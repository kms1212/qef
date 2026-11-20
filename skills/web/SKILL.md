---
name: web
description: 웹 백엔드 API나 브라우저 프론트엔드의 구조를 정하거나 바꾸기 전에 반드시 호출한다.
---

# web

웹 프로젝트에만 해당하는 구조 기준을 둔다. 공통 기준은 `qef:dev`, `qef:model`, `qef:layout`을 따르고 여기서 다시 적지 않는다. 화면에서 무엇을 어떻게 표시할지는 `qef:ux`, 모양은 `qef:ui`가 정한다.

| 다루는 것 | 기준 |
|---|---|
| HTTP API를 내는 백엔드의 경로와 도메인 나누기, 도메인 안과 사이, 입력·오류, 목록, 쓰기, 권한·식별자 | [criteria/web-api.md](criteria/web-api.md) |
| 브라우저에서 도는 웹 앱에서 코드와 상태를 어디에 두고, 서버와 무엇을 주고받을지 | [criteria/web-frontend.md](criteria/web-frontend.md) |
