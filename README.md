# ChatGPT Long Chat Loader

ChatGPT의 긴 대화 페이지에서 초기 로딩과 스크롤 지연을 줄이기 위한 Chrome MV3 확장입니다.

## 문제 원인 분석

1. 긴 대화는 `/backend-api/conversation/...` 응답 안에 많은 `mapping` 노드를 포함합니다.
2. ChatGPT 웹 앱은 이 데이터를 받은 뒤 React UI로 메시지 DOM을 생성합니다. 메시지가 많아질수록 JSON 파싱, React reconciliation, markdown/code 렌더링, DOM 생성, layout/reflow 비용이 누적됩니다.
3. 단순히 CSS로 오래된 메시지를 숨기는 방식은 스크롤 지연은 줄이지만, 이미 React가 모든 메시지를 렌더링한 뒤라 초기 로딩 문제를 완전히 해결하지 못합니다.
4. 따라서 가장 큰 효과는 “페이지 앱이 렌더링하기 전에” conversation API 응답을 줄이고, 이후 필요할 때만 더 보이게 하는 방식입니다.

## 해결 방법 목록

| 방법 | 효과 | 위험/한계 | 구현 여부 |
|---|---:|---|---|
| 오래된 DOM 메시지 숨김 | 중간 | 초기 React 렌더링 이후에 동작 | 구현 |
| `Load more` 버튼으로 과거 메시지 점진 표시 | 중간 | 숨겨진 DOM 범위까지만 가능 | 구현 |
| `window.fetch`를 MAIN world에서 패치해 conversation 응답 trim | 높음 | ChatGPT 내부 API 구조 변경 시 수정 필요 | 구현 |
| 최근 conversation 응답 메모리 캐시 | 중간 | 탭 새로고침 시 초기화 | 구현 |
| “전체 대화 로드” 우회 버튼 | 안정성 | 전체 로드 시 다시 느려질 수 있음 | 구현 |

## 구현 구조

```text
manifest.json     Chrome MV3 설정
mainWorld.js      ChatGPT 페이지의 fetch를 MAIN world에서 패치, API 응답 trim
content.js        DOM 메시지 windowing, Load more 버튼, 상태 배지
content.css       숨김/버튼/배지 스타일
popup.html/js     설정 UI
```

## 설치

1. 이 폴더를 압축 해제합니다.
2. Chrome 주소창에서 `chrome://extensions`를 엽니다.
3. 오른쪽 위의 “개발자 모드”를 켭니다.
4. “압축해제된 확장 프로그램을 로드합니다”를 누릅니다.
5. 이 폴더 `chatgpt-long-chat-loader`를 선택합니다.
6. `https://chatgpt.com`에서 긴 대화를 열고 확장 아이콘의 설정을 조정합니다.

## 기본 설정

- 처음 표시할 최근 턴: 6
- 더 보기 배치: 6
- API 사전 보관 배치: 10
- API 응답 줄이기: 켜짐

API trim은 “최근 표시 턴 + 더 보기 배치 × 사전 보관 배치”만 conversation 응답에 남깁니다. 숨겨진 DOM 메시지를 모두 더 본 뒤에도 과거 대화가 더 필요하면 페이지 상단의 “전체 대화 로드하기” 버튼을 누르면 한 번만 trim 없이 새로고침합니다.

## 주의 사항

- 이 확장은 메시지 본문을 외부로 전송하지 않습니다. 설정은 `chrome.storage.local`과 페이지 로컬 브리지에만 저장됩니다.
- ChatGPT 웹의 내부 API/DOM 구조가 바뀌면 selector 또는 trim 로직을 수정해야 할 수 있습니다.
- 전체 대화 검색, 아주 오래된 메시지 편집, 과거 branch 탐색이 필요하면 “전체 대화 로드하기”를 사용하세요.
- ChatGPT 서버가 모델에 사용하는 실제 대화 맥락을 줄이는 도구가 아닙니다. 브라우저 UI의 로딩과 렌더링 부담을 줄이는 도구입니다.
