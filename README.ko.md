# ChatGPT Long Chat Loader v0.9.0

[English README](README.md)

ChatGPT 긴 대화의 초기 로딩, 렌더링, RAM 압박을 줄이면서 **답변 생성 중 진행상황이 끊겨 보이지 않도록** 보정하는 Chrome MV3 확장입니다.

## v0.9.0 수정 사항

v0.9.0은 다음 문구에서 답변이 멈춘 것처럼 보이는 문제를 우선 처리합니다.

```text
스트리밍이 중지되었습니다. 메시지 완료를 기다리는 중입니다…
```

이전 버전은 답변 생성 중 micro-cache는 중단했지만, ChatGPT가 답변 완료를 복구/확정하는 동안에도 `GET /backend-api/conversation/...` 응답을 rewrite할 수 있었습니다. v0.9.0은 live 답변 중에는 **로딩 최적화보다 진행상황 정확성**을 우선합니다.

### v0.9.0 핵심 수정

1. **Live API rewrite bypass.** 메시지 생성, conversation mutation, active reply 보호, stream-recovery 대기 중에는 conversation GET 응답을 수정하지 않고 원본 그대로 통과시킵니다. 이 상태에서도 micro-cache는 비우고 일시중지합니다.
2. **stream-recovery 문구 감지.** `스트리밍이 중지되었습니다. 메시지 완료를 기다리는 중입니다…` 문구를 감지하면 최신 turn을 계속 보호합니다.
3. **active-reply watchdog.** active/recovery 상태가 이어지는 동안 가벼운 watchdog이 보호 신호를 갱신해서 MAIN-world fetch patch가 stale cache/trim 동작으로 너무 빨리 복귀하지 않게 합니다.
4. **정상 모드 복귀 개선.** stop 버튼, busy marker, streaming marker, recovery notice가 짧은 시간 동안 보이지 않으면 active-reply 보호를 해제하고 일반 trim/cache 동작으로 복귀합니다.
5. **popup 진단 추가.** popup에 `Live API rewrite` 상태가 추가되어 conversation GET 응답이 현재 원본 통과 중인지 볼 수 있습니다.
6. **GitHub 업데이트 대상 고정.** GitHub 저장소는 내부 고정값으로 사용하며, popup에서 저장소 링크를 표시하거나 수정하지 않습니다.

## 문제 원인

긴 ChatGPT 대화는 브라우저가 큰 conversation graph를 받고, JavaScript 객체로 파싱하고, ChatGPT React 앱이 오래된 메시지까지 state/DOM으로 구성하면서 느려집니다.

별도 문제는 답변 생성 중에 발생합니다. ChatGPT가 답변 완료를 기다리는 stream-recovery 상태를 표시할 때, 확장이 해당 기간의 conversation 응답을 rewrite하거나 stale 응답을 반환하면 UI가 새로고침 전까지 멈춘 것처럼 보일 수 있습니다. v0.9.0은 live/recovery 중 conversation GET 응답을 원본 그대로 통과시켜 이 경로를 줄입니다.

## 확장이 하는 일

1. `document_start` 시점에 page MAIN world에서 `window.fetch`를 패치합니다.
2. `GET /backend-api/conversation/<id>`와 `GET /backend-api/f/conversation/<id>` JSON 응답을 intercept합니다.
3. live 답변이 없을 때는 ChatGPT React가 읽기 전에 최근 conversation graph tail만 남깁니다.
4. 답변 생성, stream recovery, 메시지 전송 직후에는 conversation GET 응답을 원본 그대로 통과시킵니다.
5. 메시지 전송 같은 conversation mutation 요청 후 micro-cache를 비우고 일시중지합니다.
6. active reply가 없을 때는 기본 1개짜리 bounded micro-cache를 사용합니다.
7. 전체 DOM이 이미 존재하는 경우 오래된 DOM turn을 숨기고 floating `더보기` 버튼으로 점진 표시합니다.
8. 가벼운 trim marker를 유지해서 cache/stat 정리 후에도 `전체 대화 로드하기` 버튼을 보존합니다.
9. 생성 중인 현재 답변은 DOM 숨김과 CSS containment에서 보호합니다.
10. 예상 속도 향상치는 popup을 열 때만 계산합니다.

## 캐시 및 live rewrite 정책

| 상태 | micro-cache | API trim/rewrite |
|---|---|---|
| idle 긴 대화 로드 | 제한적으로 사용 | 사용 |
| idle 상태의 동일 대화 refetch | 1-entry cache 사용 가능 | 사용 |
| 메시지 전송 / conversation mutation | 정리 및 일시중지 | 임시 bypass |
| active reply 감지 | 정리 및 일시중지 | 임시 bypass |
| stream-recovery 문구 감지 | 정리 및 일시중지 | 문구가 있는 동안 bypass |
| 메모리 압박 | 정리 | active/idle 상태에 따름 |
| route 변경 | 정리 | reset |

기본 cache 설정:

| 항목 | 기본값 |
|---|---:|
| 응답 micro-cache 수 | 1 |
| 최대 cache 수 | 2 |
| 항목당 body 상한 | 1024 KB |
| TTL | 60초 |

캐시는 원본 전체 대화가 아니라 trim된 응답 body만 저장합니다. 설정값은 1 미만으로 내려가지 않지만, route 변경, TTL 만료, 메모리 압박, active reply 보호, body 크기 초과 상황에서는 runtime cache map이 일시적으로 비어 있을 수 있습니다.

## 답변 진행 보호

사용자가 prompt를 전송했거나, stop/generating control이 보이거나, streaming text mutation이 감지되거나, stream-recovery 문구가 있으면 확장은 active-reply 보호 구간에 들어갑니다.

이 구간에서는 다음을 적용합니다.

- 응답 micro-cache를 사용하거나 저장하지 않음
- conversation GET rewrite/trim bypass
- 최신 live turn 강제 표시
- 보호된 turn에서 CSS containment 제거
- 주기적 maintenance 건너뜀
- popup에 `응답 진행 보호`, `micro-cache 일시중지`, `Live API rewrite` 표시

목표는 수동 새로고침 없이 답변 진행상황을 계속 볼 수 있게 하는 것입니다.

## GitHub 업데이트 helper

popup에는 **GitHub 업데이트** 섹션이 있습니다. 업데이트 대상 저장소는 내부에 고정되어 있으며, popup에서 저장소 링크를 표시하거나 수정하지 않습니다.

버튼:

| 버튼 | 동작 |
|---|---|
| 업데이트 확인 | GitHub API로 최신 release와 기본 branch `manifest.json` 확인 |
| 최신 ZIP 다운로드 | release asset ZIP을 우선 다운로드하고, 없으면 source ZIP fallback 사용 |
| 릴리스 열기 | 선택된 GitHub release 페이지 열기 |
| 확장 관리 열기 | Chrome이 허용하면 `chrome://extensions` 열기 |
| 확장 재로드 | 파일 교체 후 `chrome.runtime.reload()` 실행 |

Chrome은 unpacked extension이 popup에서 자기 파일을 조용히 자동 교체하는 것을 허용하지 않습니다. 따라서 빠른 업데이트 흐름은 GitHub 확인 → ZIP 다운로드 → 압축 해제 → unpacked folder 교체 또는 다시 Load unpacked → 확장 재로드입니다.

`downloads` 권한은 ZIP 다운로드 버튼에만 사용합니다. GitHub host permission은 업데이트 확인에만 사용합니다. 업데이트 확인은 popup에서 수동으로 실행되며 background polling은 없습니다.

## popup 전용 예상 속도 향상치

상시 계산 루프를 돌리지 않습니다. popup을 열면 활성 탭에서 snapshot을 한 번 받아 API 메시지 감소율, API JSON 크기 감소율, 숨겨진 DOM turn 비율, `content-visibility` 지원 여부, Chromium이 제공하는 경우 JS heap 정보를 기준으로 추정합니다.

이 값은 controlled benchmark가 아니라 현재 탭 상태 기반 추정치입니다.

## GPU와 RAM 관련 메모

- `will-change`, `translateZ(0)`, 강제 layer promotion은 사용하지 않습니다.
- 확장이 Chrome hardware acceleration 설정을 직접 바꾸지는 않습니다. GPU compositing 문제가 의심되면 `chrome://gpu`에서 확인해야 합니다.
- RAM 절감의 핵심은 idle 대화 로드 시 오래된 메시지를 React state/DOM으로 만들기 전에 API 입력을 줄이는 것입니다.
- 답변 생성 또는 stream recovery 중에는 정확성을 우선하므로 conversation GET 응답을 원본 그대로 통과시킵니다.
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
