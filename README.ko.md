# ChatGPT Long Chat Loader

긴 ChatGPT 대화의 브라우저 로딩/RAM 압박을 줄이고, ChatGPT 수식을 Word/PowerPoint에 더 안전하게 복사하기 위한 Chrome MV3 확장입니다.

- 기본 문서: [`README.md`](./README.md)
- 한국어 문서: 이 파일
- 버전: `1.5.3`

## v1.5.3 핵심

v1.5.3은 v1.5.2의 긴 대화/Office 수식 보정을 유지하면서 ChatGPT 브랜치 경로 표시와 다음 질문 대기 전송을 추가한 버전입니다.

주요 변경:

- popup의 한국어/영어 프로그램 모드를 분리했습니다.
- README 버튼은 하나만 유지합니다. **Open README** 버튼은 현재 언어 모드에 맞는 README를 엽니다.
- 업데이트 영역은 **업데이트 확인**과 **최신 ZIP 다운로드**만 남겼습니다.
- 업데이트 확인 결과는 **설치 버전**과 **원격 버전**만 표시합니다.
- popup의 긴 micro-cache 안내 문구를 제거했습니다.
- GitHub 저장소 주소는 내부 고정값으로만 사용하며 popup에 표시하지 않습니다.
- GitHub 업로드용 저작권, 라이선스, third-party notice, release checklist를 정리했습니다.
- PowerPoint에서 수식이 앞에는 평문, 뒤에는 LaTeX로 중복 붙는 문제를 줄이기 위해 Office용 클립보드 형식을 한 번에 하나만 씁니다.
- 현재 ChatGPT 대화 경로와 연결된 branch variant를 작은 브랜치 패널로 표시하고, 분기 지점 전후 prompt preview를 보여줍니다.
- 기본 `Tab` 또는 popup에서 실제 키를 한 번 눌러 등록한 단축키로 prompt들을 queue에 넣고, 대기 목록 패널에서 하나씩 확인/수정한 뒤 현재 응답과 요청 제한 문구가 사라지면 순서대로 전송합니다.

## 기능

### 긴 대화 로딩 최적화

확장은 긴 ChatGPT 대화에서 브라우저 작업량을 줄입니다.

- 안정 상태의 conversation API 응답을 ChatGPT React 앱에 전달되기 전에 줄입니다.
- 오래된 DOM turn을 숨기고, 필요한 경우 작은 단위로 다시 표시합니다.
- live reply가 없을 때 더보기로 불러온 과거 메시지를 주기적으로 다시 접습니다.
- 현재 답변, thinking, status 영역은 보호하여 답변 생성 진행이 끊기지 않도록 합니다.

서버 측 모델 컨텍스트를 줄이는 기능은 아닙니다. 브라우저 로딩, 렌더링, layout, 메모리 압박을 줄이는 기능입니다.

### Office 수식 복사

선택 영역에 렌더링된 수식이 있으면 클립보드 출력을 보정합니다.

- `Ctrl+C` / `Cmd+C`: 먼저 LaTeX plain text 단일 fallback을 씁니다. PNG fallback이 켜져 있으면 이후 클립보드를 PPT 안전 PNG 단일 항목으로 교체합니다.
- 떠 있는 수식 복사 버튼: PNG fallback이 켜져 있으면 PPT 안전 PNG 하나만 씁니다. PNG 생성이 실패하면 LaTeX plain text로 fallback합니다.
- HTML/MathML과 plain text를 동시에 쓰지 않습니다. 이 조합이 일부 PowerPoint에서 중복 붙여넣기를 만드는 원인이었습니다.

PowerPoint에서 최종 시각 결과가 반드시 정확해야 하면 떠 있는 수식 복사 버튼을 우선 사용하거나, `Ctrl/Cmd+C` 후 PNG 복사 완료 toast가 뜬 뒤 붙여넣습니다.

### 브랜치 경로와 다음 질문 대기 전송

**브랜치 경로 표시**가 켜져 있으면 ChatGPT 탭에 현재 대화 경로와 탭에서 이전에 관측된 연결 branch variant를 함께 표시합니다. **브랜치 패널 단축키**로 열거나 접을 수 있으며 기본값은 `Alt+B`입니다. 접힌 미니 오버레이는 그대로 클릭할 수 있고 prompt 텍스트 없이 단순 graph만 보여줍니다. 패널은 현재 탭의 `sessionStorage`에 보이는 메시지 ID와 짧은 preview를 기록합니다. 분기 지점이 감지되면 분기 전 마지막 user prompt와 각 branch 시작 첫 user prompt를 요약해 보여줍니다.

**다음 질문 대기 전송**이 켜져 있으면 ChatGPT가 답변 중일 때 prompt를 입력하고 지정 queue 단축키를 누릅니다. 기본값은 `Tab`입니다. queue된 prompt는 편집 가능한 대기 목록 패널에 쌓입니다. **대기 목록 단축키** 기본값은 `Alt+Q`이고, 떠 있는 **Queue** 버튼이나 접힌 queue 미니 오버레이를 클릭해서도 열 수 있습니다. 단축키를 바꾸려면 popup의 단축키 입력칸에 focus한 뒤 원하는 키 조합을 한 번 누릅니다. 확장은 live response 표시가 사라질 때까지 기다린 뒤 `Too many requests`, `rate limit` 같은 요청 제한 문구가 보이는지 확인합니다. 해당 문구가 있으면 전송하지 않고 대기하며, queued prompt를 하나씩 순서대로 보냅니다.

## popup 구성

### 언어

**프로그램 언어**에서 선택합니다.

- `한국어`
- `English`

선택한 언어에 따라 popup 문구가 바뀌고, 단일 **Open README** 버튼이 해당 언어 README를 엽니다.

### 업데이트 도우미

업데이트 영역은 의도적으로 다음 두 버튼만 포함합니다.

- **업데이트 확인**
- **최신 ZIP 다운로드**

확인 후에는 다음 두 값만 표시합니다.

- **설치 버전**
- **원격 버전**

확장은 내부에 고정된 GitHub 저장소만 확인합니다. popup에서 저장소 링크를 표시하거나 수정하지 않습니다.

개발자 모드/unpacked 설치는 Chrome이 로컬 확장 폴더를 버튼 하나로 자동 교체할 수 없습니다. **최신 ZIP 다운로드** 후 압축을 풀고 `chrome://extensions`에서 unpacked 폴더를 교체합니다.

## 설치

1. 최신 release ZIP을 다운로드합니다.
2. ZIP 압축을 풉니다.
3. `chrome://extensions`를 엽니다.
4. **개발자 모드**를 켭니다.
5. **압축해제된 확장 프로그램을 로드합니다**를 누릅니다.
6. 압축 해제한 확장 폴더를 선택합니다.
7. 기존 ChatGPT 탭을 새로고침합니다.
8. popup에서 `API patch: MAIN 1.5.3`을 확인합니다.

## 권장 설정

| 설정 | 권장값 |
|---|---:|
| 확장 기능 사용 | 켜짐 |
| 초기 API 응답 줄이기 | 켜짐 |
| 네트워크 안전 모드 | 켜짐 |
| 처음 표시할 최근 턴 | 2 |
| 더 보기 배치 | 2 |
| API 사전 보관 배치 | 0 |
| 응답 micro-cache 수 | 1 |
| 캐시 항목 상한 | 256 KB |
| 대화 중 자동 정리 | 켜짐 |
| 불러온 과거 메시지 주기적 접기 | 켜짐 |
| 브랜치 경로 표시 | 켜짐 |
| 브랜치 패널 단축키 | `Alt+B` |
| 다음 질문 대기 전송 | 켜짐 |
| 대기 전송 단축키 | `Tab` |
| 대기 목록 단축키 | `Alt+Q` |
| 상태 배지 표시 | 꺼짐 |

## 대화 축약이 되지 않을 때

popup에서 다음을 확인합니다.

- `API patch`: `MAIN 1.5.3`이어야 합니다.
- `Patch status`: `MAIN detected`가 포함되어야 합니다.
- 긴 대화에서 DOM hidden count가 0이면 안 됩니다.
- 답변 완료 후 `Thinking shield`가 대기 상태로 돌아와야 합니다.

첫 로딩을 가장 빠르게 하려면 **빠른 초기 로딩 프리셋**을 적용한 뒤 ChatGPT 탭을 새로고침합니다.

## PowerPoint 수식 복사가 깨질 때

일반 `Ctrl+C` 대신 떠 있는 수식 복사 버튼을 사용합니다. 이 경로는 PowerPoint에 단일 PNG 표현만 주므로, 앞에는 평문 수식, 뒤에는 LaTeX 수식이 함께 붙는 중복 문제를 줄입니다.

편집 가능한 수식이 필요하면 `Ctrl+C`를 사용해 Office 수식 입력이 가능한 위치에 붙입니다. Office 버전과 붙여넣기 위치에 따라 편집 가능한 수식 변환 여부는 달라질 수 있습니다.

## 개인정보

확장은 메시지 본문을 외부 서버로 전송하지 않습니다.

저장되는 항목:

- `chrome.storage.local`의 확장 설정,
- ChatGPT 탭 안의 짧은 page bridge 설정,
- debug logging을 켠 경우에만 로컬 debug log.

GitHub 업데이트 확인은 사용자가 **업데이트 확인** 또는 **최신 ZIP 다운로드**를 누를 때만 GitHub API를 호출합니다.

## 라이선스와 저작권

Copyright (c) 2026 ch040602.

이 프로젝트는 MIT License로 배포됩니다. [`LICENSE`](./LICENSE)를 확인합니다.

fork를 공개할 경우 저작권자, 저장소 이름, release asset 이름, README 링크를 본인 기준에 맞게 수정해야 합니다.

## Third-party notices

이 패키지는 독자 구현입니다. 공개된 long-chat 최적화 접근 방식을 참고했지만, 해당 저장소의 source file을 그대로 복사하지 않았습니다. [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)를 확인합니다.

## GitHub release checklist

release 업로드 전 확인합니다.

1. `manifest.json` version이 `1.5.3`인지 확인합니다.
2. popup update UI가 **업데이트 확인**과 **최신 ZIP 다운로드**만 표시하는지 확인합니다.
3. `README.md`, `README.ko.md`가 모두 포함되어 있는지 확인합니다.
4. `LICENSE`, `THIRD_PARTY_NOTICES.md`가 포함되어 있는지 확인합니다.
5. 확장 폴더 root 기준으로 ZIP을 생성합니다.
6. 생성한 ZIP을 GitHub Release asset으로 업로드합니다.
7. popup에서 원격 버전 감지와 ZIP 다운로드가 되는지 확인합니다.

## 한계

- ChatGPT 원본 네트워크 응답은 확장이 trim하기 전에 먼저 다운로드되어야 합니다.
- ChatGPT DOM/API가 바뀌면 selector 또는 trim 로직 수정이 필요할 수 있습니다.
- Office 수식 붙여넣기 동작은 Office 버전과 플랫폼에 따라 달라질 수 있습니다.
- 인증된 긴 대화 E2E benchmark는 실제 ChatGPT 세션에서 실행해야 합니다.
