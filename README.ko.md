# ChatGPT Long Chat Loader v0.8.0

[English README](README.md)

ChatGPT 긴 대화의 초기 로딩, 렌더링, RAM 압박을 줄이면서 **답변 생성 중 진행상황이 끊겨 보이지 않도록** 보정하는 Chrome MV3 확장입니다.

## v0.8.0 수정 사항

이 버전은 popup에 GitHub 업데이트 helper를 추가하고, v0.7의 답변 진행 보호 수정은 유지합니다. helper는 설정된 GitHub 저장소를 확인하고, 설치된 manifest version을 최신 release 및 기본 branch의 `manifest.json`과 비교하며, 최신 ZIP 다운로드, release 페이지 열기, Chrome 확장 관리 페이지 열기, 파일 교체 후 확장 재로드를 지원합니다.

Chrome은 unpacked extension이 popup에서 자기 파일을 조용히 자동 교체하는 것을 허용하지 않습니다. 따라서 빠른 업데이트 흐름은 GitHub 확인 → ZIP 다운로드 → 압축 해제 → unpacked folder 교체 또는 다시 Load unpacked → 확장 재로드입니다.

이전 v0.7 수정 요약: 답변이 생성되고 있는데도 화면에서는 중간에 끊긴 것처럼 보이고, 새로고침하면 이미 답변이 도착해 있던 문제를 수정했습니다.

1. **streaming-safe micro-cache.** 메시지 전송 등 conversation mutation 요청 직후와 답변 생성 중에는 응답 micro-cache를 중단합니다. 생성 중인 대화에 오래된 trimmed 응답을 다시 주는 문제를 막습니다.
2. **진행 중 assistant node 보존.** API trim 단계에서 ChatGPT가 아직 `current_node`를 새 assistant node로 옮기지 않았더라도, 진행 중이거나 매우 최근인 assistant node를 보존합니다. 최신 user message의 descendant인 active assistant가 있으면 trimmed 응답의 `current_node`도 해당 node로 보정할 수 있습니다.
3. **live DOM 보호.** 생성 중인 최신 turn은 숨기지 않고 `content-visibility:auto`도 적용하지 않습니다. 현재 생성 중인 답변의 paint/update가 지연되는 일을 줄입니다.
4. **streaming mutation 감지.** `MutationObserver`가 `childList`뿐 아니라 `characterData`와 일부 attribute 변경도 감지합니다. streamed text update가 들어오면 보호 상태를 갱신합니다.
5. **active reply 중 maintenance 중단.** 답변 생성 보호 구간에서는 주기적 정리를 건너뜁니다. cache pruning과 stale-stat cleanup은 보호 구간이 끝난 뒤 재개됩니다.
6. **popup 진단 강화.** popup에서 응답 진행 보호 상태와 cache 일시중지 상태를 볼 수 있습니다. 예상 속도 향상 계산은 여전히 popup이 열린 상태에서만 실행됩니다.

## 문제 원인

긴 ChatGPT 대화는 브라우저가 큰 conversation graph를 받고, JavaScript 객체로 파싱하고, ChatGPT React 앱이 오래된 메시지까지 state/DOM으로 구성하면서 느려집니다.

별도 문제는 답변 생성 중에 발생합니다. ChatGPT는 assistant 응답이 아직 진행 중인 동안에도 conversation 데이터를 받거나 다시 fetch할 수 있습니다. 이때 확장이 최신 assistant node가 완전히 확정되기 전의 trimmed 응답을 micro-cache에서 다시 반환하면, UI는 답변이 멈춘 것처럼 보일 수 있습니다. 새로고침하면 runtime cache가 사라지기 때문에 완료된 답변이 다시 나타납니다.

## 확장이 하는 일

1. `document_start` 시점에 page MAIN world에서 `window.fetch`를 패치합니다.
2. `GET /backend-api/conversation/<id>`와 `GET /backend-api/f/conversation/<id>` JSON 응답을 intercept합니다.
3. ChatGPT React가 읽기 전에 최근 conversation graph tail만 남깁니다.
4. 아직 API `current_node`가 아니더라도 진행 중이거나 최근인 assistant node를 보존합니다.
5. 메시지 전송 같은 conversation mutation 요청 후 micro-cache를 비우고 일시중지합니다.
6. active reply가 없을 때는 기본 1개짜리 bounded micro-cache를 사용합니다.
7. 전체 DOM이 이미 존재하는 경우 오래된 DOM turn을 숨기고 floating `더보기` 버튼으로 점진 표시합니다.
8. 가벼운 trim marker를 유지해서 cache/stat 정리 후에도 `전체 대화 로드하기` 버튼을 보존합니다.
9. 생성 중인 현재 답변은 DOM 숨김과 CSS containment에서 보호합니다.
10. 예상 속도 향상치는 popup을 열 때만 계산합니다.

## 캐시 정책

| 항목 | 기본값 |
|---|---:|
| 응답 micro-cache 수 | 1 |
| 최대 cache 수 | 2 |
| 항목당 body 상한 | 1024 KB |
| TTL | 60초 |
| 메시지 전송/conversation mutation | cache 정리 및 일시중지 |
| active reply 감지 | cache 정리 및 일시중지 |
| 메모리 압박 | cache 정리 |
| route 변경 | cache 정리 |

캐시는 원본 전체 대화가 아니라 trim된 응답 body만 저장합니다. 설정값은 1 미만으로 내려가지 않지만, route 변경, TTL 만료, 메모리 압박, active reply 보호, body 크기 초과 상황에서는 runtime cache map이 일시적으로 비어 있을 수 있습니다.

## 답변 진행 보호

사용자가 prompt를 전송했거나, stop/generating control이 보이거나, streaming text mutation이 감지되면 확장은 active-reply 보호 구간에 들어갑니다.

이 구간에서는 다음을 적용합니다.

- 응답 micro-cache를 사용하거나 저장하지 않음
- 최신 live turn 강제 표시
- 보호된 turn에서 CSS containment 제거
- 주기적 maintenance 건너뜀
- popup에 `응답 진행 보호`와 `micro-cache 일시중지` 표시

목표는 수동 새로고침 없이 답변 진행상황을 계속 볼 수 있게 하는 것입니다.

## trim-state marker

`더보기` / `전체 대화 로드하기` 버튼은 cache body에 의존하면 안 됩니다. 확장은 API 응답이 trim된 뒤 현재 route에 대한 작은 marker를 `sessionStorage`에 저장합니다. marker에는 message text가 없고, count, timestamp, route key만 들어갑니다.

marker는 다음 상황에서 제거됩니다.

- 다른 대화 route로 이동
- API trim 비활성화
- 사용자가 `전체 대화 로드하기` 클릭
- marker가 6시간 이상 경과



## GitHub 업데이트 helper

popup에 **GitHub 업데이트** 섹션이 추가되었습니다.

기본 저장소:

```text
ch040602/Chatgpt-web-booster_chrome_extentsion
```

버튼:

| 버튼 | 동작 |
|---|---|
| 업데이트 확인 | GitHub API로 최신 release와 기본 branch `manifest.json` 확인 |
| 최신 ZIP 다운로드 | release asset ZIP을 우선 다운로드하고, 없으면 source ZIP fallback 사용 |
| 릴리스 열기 | 선택된 GitHub release 페이지 열기 |
| 확장 관리 열기 | Chrome이 허용하면 `chrome://extensions` 열기 |
| 확장 재로드 | 파일 교체 후 `chrome.runtime.reload()` 실행 |

`downloads` 권한은 ZIP 다운로드 버튼에만 사용합니다. GitHub host permission은 업데이트 확인에만 사용합니다. 업데이트 확인은 popup에서 수동으로 실행되며 background polling은 없습니다.

## popup 전용 예상 속도 향상치

상시 계산 루프를 돌리지 않습니다. popup을 열면 활성 탭에서 snapshot을 한 번 받아 API 메시지 감소율, API JSON 크기 감소율, 숨겨진 DOM turn 비율, `content-visibility` 지원 여부, Chromium이 제공하는 경우 JS heap 정보를 기준으로 추정합니다.

이 값은 controlled benchmark가 아니라 현재 탭 상태 기반 추정치입니다.

## GPU와 RAM 관련 메모

- `will-change`, `translateZ(0)`, 강제 layer promotion은 사용하지 않습니다.
- 확장이 Chrome hardware acceleration 설정을 직접 바꾸지는 않습니다. GPU compositing 문제가 의심되면 `chrome://gpu`에서 확인해야 합니다.
- RAM 절감의 핵심은 오래된 메시지를 React state/DOM으로 만들기 전에 API 입력을 줄이는 것입니다.
- fetch 응답을 rewrite하려면 JSON 응답을 한 번 읽고 parse해야 하므로 이 peak memory는 완전히 제거할 수 없습니다.
- micro-cache는 반복 parse를 줄이기 위한 소형 cache입니다. 단, 생성 중에는 stale UI 상태를 막기 위해 비활성화됩니다.

## 설치

1. ZIP 압축을 풉니다.
2. `chrome://extensions`를 엽니다.
3. 개발자 모드를 켭니다.
4. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
5. 압축 해제한 확장 폴더를 선택합니다.
6. `https://chatgpt.com`의 긴 대화를 열거나 새로고침합니다.
7. 확장 아이콘을 눌러 현재 탭 추정치와 설정을 확인합니다.

이전 빌드에서 업데이트한 뒤에는 ChatGPT 탭을 새로고침하세요. 기존 탭에는 페이지를 새로고침하기 전까지 오래된 content script 또는 MAIN-world fetch patch가 메모리에 남아 있을 수 있습니다.

popup에서 `API patch: 미감지`가 표시되면 ChatGPT 탭을 새로고침하세요. DOM 최적화와 추정치 fallback은 이미 열린 탭에도 주입될 수 있지만, 초기 MAIN-world fetch patch는 페이지 새로고침 후 가장 안정적으로 동작합니다.

## 한계

- 인증된 긴 대화에서 최종 성능 수치를 얻으려면 실제 E2E 테스트가 필요합니다.
- ChatGPT 내부 DOM/API가 바뀌면 selector 또는 endpoint 수정이 필요할 수 있습니다.
- 전체 히스토리 검색, 오래된 메시지 편집, 오래된 branch navigation은 `전체 대화 로드하기` bypass가 필요합니다.
- 서버 측 모델 context는 줄이지 않습니다. 브라우저 UI 로딩/렌더링 부담만 줄입니다.
- 공유 대화는 다른 delivery path를 사용할 수 있어 API trim이 보장되지 않습니다. 이 경우 DOM windowing만 도움이 될 수 있습니다.

## 개인정보

메시지 내용은 외부 서버로 전송되지 않습니다. 설정은 `chrome.storage.local`에 저장되고, count/timestamp만 담은 작은 trim marker는 탭 단위 `sessionStorage`에 저장되며, MAIN-world 접근을 위해 설정이 `localStorage`로 bridge됩니다. 디버그 export는 사용자가 버튼을 눌렀을 때만 로컬 파일로 생성됩니다.
