# ChatGPT Long Chat Loader

[English README](./README.md) | [라이선스](./LICENSE) | [제3자 고지](./THIRD_PARTY_NOTICES.md) | [업데이트 호스팅](./UPDATE_HOSTING.md)

긴 ChatGPT 대화의 브라우저 로딩, 렌더링, 메모리 부담을 줄이기 위한 Chrome Manifest V3 확장 프로그램입니다.

팝업에는 별도의 **프로그램 언어** 모드가 있습니다. 팝업에서 **한국어** 또는 **English**를 선택하면 UI 문구가 전환되고, README 버튼은 선택 언어에 맞는 GitHub 문서 페이지로 연결됩니다.

## 주요 기능

- 안전한 상황에서 큰 ChatGPT conversation API 응답을 페이지 앱에 전달되기 전에 줄입니다.
- 최근 메시지 중심의 DOM window만 보이게 하고 오래된 렌더링 메시지는 숨깁니다.
- 답변 생성, thinking/reasoning 패널, 스트림 복구 중인 영역은 숨기거나 rewrite하지 않도록 보호합니다.
- **더보기**로 불러온 과거 메시지를 다음 자동 정리 주기에서 다시 접습니다.
- 팝업에서 API trim, DOM 표시/숨김, live reply 보호, 패치 상태, 캐시 상태, 업데이트 상태를 진단합니다.
- GitHub 릴리스 ZIP 다운로드와 Chrome 관리형 업데이트 확인을 보조합니다.

## v1.4.0 중점

v1.4.0은 확장이 실행된 것처럼 보이지만 실제로는 대화가 줄어들거나 windowing되지 않던 경우를 수정합니다. 안정 상태의 conversation refresh를 계속 trim하고, 자동 정리 중 DOM windowing을 다시 강제하며, 첫 로딩 기본 부담을 낮췄습니다.

### 수정 / 변경 사항

- live/thinking 우회가 최초 trim 슬롯을 잘못 소비하던 route-state 문제를 수정했습니다.
- stable conversation refresh는 첫 trimmed GET 이후에도 계속 trim합니다.
- stable trim 완료 상태는 응답이 실제로 파싱되고 trim되었거나 충분히 작다고 확인된 뒤에만 기록됩니다.
- 답변 생성, thinking, reasoning, recovery 중인 응답은 route 최적화 완료로 표시하지 않습니다.
- live-reply 보호 중에도 자동 정리 주기마다 DOM windowing을 다시 적용합니다.
- 완료된 과거 thinking/reasoning 조각은 더 이상 오래된 메시지 보호 대상으로 보지 않습니다.
- 불러온 과거 메시지를 설정된 최근 window로 자동 접습니다.
- 이미 열린 탭을 위한 MAIN-world fallback injection 경로를 추가했습니다.
- **빠른 초기 로딩 프리셋**, **패치 재주입**, GitHub 업데이트 보조 버튼을 추가했습니다.
- 팝업 한/영 모드와 README 링크를 분리했습니다.

## 기본값

| 설정 | 기본값 |
|---|---:|
| 확장 기능 사용 | 켜짐 |
| 초기 API 응답 줄이기 | 켜짐 |
| 네트워크 안전 모드 | 켜짐 |
| 최근 턴 | 2 |
| 더 보기 배치 | 2 |
| API 사전 보관 배치 | 0 |
| 응답 micro-cache 수 | 1 |
| 캐시 항목 상한 | 256 KB |
| 자동 정리 주기 | 60초 |
| 불러온 과거 메시지 자동 접기 | 켜짐 |
| 상태 배지 | 꺼짐 |

이 기본값은 최신 메시지 window만 보이도록 유지합니다. 오래된 DOM 메시지는 숨겨지고 batch 단위로 다시 볼 수 있습니다. ChatGPT가 렌더링하기 전에 과거 메시지가 제거된 경우 ChatGPT의 전체 로드 버튼을 사용하세요.

## 설치

1. 이 저장소를 다운로드하거나 clone합니다.
2. `chrome://extensions`를 엽니다.
3. **Developer mode**를 켭니다.
4. **Load unpacked**를 누릅니다.
5. 이 확장 폴더를 선택합니다.
6. 이미 열려 있던 ChatGPT 탭을 새로고침합니다.
7. 팝업에서 `API patch: MAIN 1.4.0`을 확인합니다.

## 팝업 진단 항목

팝업은 열려 있을 때만 성능 추정치를 계산합니다. 표시 항목은 다음과 같습니다.

- 예상 로딩 개선 정도
- API trim 개수와 추정 크기 감소
- DOM 표시/숨김 개수
- 응답 진행 보호 상태
- Thinking Shield 상태
- live API 원본 통과 상태
- 보안 안전 잠금 상태
- micro-cache 상태
- 패치 상태와 fallback injection 상태
- content/main script 버전

## Trim이 동작하지 않을 때

팝업에서 다음을 확인하세요.

- `API patch`: `MAIN 1.4.0`이어야 합니다.
- `패치 상태`: `MAIN 감지`가 포함되어야 합니다.
- `Safe original pass`: 페이지가 idle 상태일 때 계속 활성화되어 있으면 안 됩니다.
- DOM 숨김 개수: 긴 대화에서는 0보다 커야 합니다.
- `Thinking shield`: 답변 완료 후에는 대기 상태여야 합니다.

이미 열린 탭에서는 **패치 재주입**을 사용하세요. 첫 로딩을 가장 빠르게 하려면 **빠른 초기 로딩 프리셋**을 적용한 뒤 ChatGPT 탭을 새로고침하세요.

## 업데이트 보조

팝업에는 GitHub 업데이트 버튼이 있습니다. 저장소 주소는 내부 고정값을 사용하며 별도 입력란으로 표시하지 않습니다.

- **Chrome 자동 업데이트 시도**는 `chrome.runtime.requestUpdateCheck()`를 호출합니다.
- **최신 ZIP 다운로드**는 GitHub의 최신 release/source ZIP을 다운로드합니다.

개발자 모드 unpacked 확장은 자신의 로컬 파일을 자동으로 교체할 수 없습니다. 릴리스 기반 자동 업데이트를 사용하려면 고정 key로 CRX를 패키징하고 Chrome 관리형 update manifest를 배포해야 합니다. 자세한 내용은 [업데이트 호스팅](./UPDATE_HOSTING.md)을 참고하세요.

## 제한 사항

- ChatGPT 네트워크 응답은 확장이 trim하기 전에 먼저 다운로드되어야 합니다.
- 이 확장은 브라우저 로딩, 렌더링, 메모리 부담을 줄이는 데 집중합니다. 서버 측 모델 context는 줄이지 않습니다.
- 인증이 필요한 긴 대화 E2E 벤치마크는 사용자의 ChatGPT 세션에서 직접 확인해야 합니다.
- ChatGPT DOM/API 변경 시 selector 또는 trim 로직 수정이 필요할 수 있습니다.
- 이 확장은 OpenAI 보안 시스템을 우회하지 않습니다. ChatGPT가 unusual activity 경고를 표시하면 확장은 passive safety lock에 들어가고 conversation response rewrite를 일시 중단합니다.

## 라이선스

Copyright (c) 2026 ch040602.

이 프로젝트는 [MIT License](./LICENSE)로 공개되는 오픈소스입니다. 저작권 및 라이선스 고지를 포함하는 조건으로 사용, 복사, 수정, 공개, 배포, 서브라이선스, 판매가 가능합니다.

ChatGPT 및 OpenAI는 OpenAI의 상표 또는 등록상표입니다. 이 프로젝트는 OpenAI와 독립적으로 제작되었으며 OpenAI의 제휴, 보증, 후원을 받지 않습니다.

검토한 참고 저장소와 고지 사항은 [제3자 고지](./THIRD_PARTY_NOTICES.md)를 확인하세요.
