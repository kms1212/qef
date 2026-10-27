# 웹 백엔드 API 기준

HTTP API를 내는 백엔드의 영역 나누기, 경로, 영역 사이 관계를 정한다. 근거: Vaughn Vernon, "Effective Aggregate Design" Part II(다른 aggregate는 식별자로만 참조한다) (https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf); JSON:API, "Sparse Fieldsets" (https://jsonapi.org/format/#fetching-sparse-fieldsets); Google AIP-157, "Partial responses" (https://google.aip.dev/157); Google AIP-231, "Batch methods: Get" (https://google.aip.dev/231).

## 영역과 경로

- API의 첫 경로 조각 하나가 도메인 영역 하나다. 영역마다 모듈 하나를 두고, 모듈 이름은 경로와 같다.
- 부모 없이 존재할 수 없는 자원은 부모 경로 안에 둔다. 예: `/files/:fileId/versions/:versionId`. 코드에서도 그 영역 안의 하위 모듈이다.
- 그 밖의 관계는 아이디로만 가리킨다. 예: `/files?projectId=…`.
- 경로가 정하는 것은 영역과 중첩 자원의 모듈까지다. 영역 안의 그 밖의 배치는 `qef:dev` 스킬의 `criteria/structure.md` 파일·디렉터리 규칙대로 한다. 영역 안을 정리해도 경로는 바뀌지 않는다.

## 영역 사이

- 영역은 같은 층의 다른 영역 코드를 가져다 쓰지 않는다. 영역들이 함께 쓰는 바탕(저장소 접근, 인증 확인 등)은 영역 아래 층에 두고, 바탕은 영역을 모른다.
- 다른 영역의 정보가 필요하면 응답에는 아이디만 넣고, 쓰는 쪽(웹, MCP 등)이 그 영역에서 가져온다. 이를 위해 영역마다 여러 기록을 한 번에 가져오는 요청과, 받을 필드를 고르는 `fields` 파라미터를 둔다.
- 한 동작이 여러 영역을 함께 바꿔야 할 것 같으면 설계를 다시 본다. 미리 만들지 않거나(필요할 때 아이디로 가리킨다), 쓰는 때에 확인하거나(상태를 퍼뜨리지 않고 읽을 때 판단한다), 늘 함께 바뀌는 것이면 `qef:dev` 스킬의 `criteria/structure.md` "함께 바뀜"대로 한 영역으로 합친다.

## 공개 API

외부에서 직접 부르는 공개 API가 생기면, 그 API는 내부 영역 구조와 떼어 따로 두고 버전을 붙인다. 이 문서의 경로 규칙은 자기 웹과 도구가 쓰는 API에 적용한다.
