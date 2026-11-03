---
name: web
description: Use when designing or changing a web application — an HTTP API backend or a browser frontend — alongside qef:dev. 웹 백엔드 API·웹 프론트엔드의 구조를 정하거나 바꾸는 작업.
---

# web

웹 프로젝트에만 해당하는 기준을 둔다. 작업의 흐름(상위 설계 → 할 일 목록 → 단위마다 처리)과 공통 기준(구조, 검증, 리뷰, 재사용)은 `qef:dev` 스킬을 따르고, 여기서는 다시 적지 않는다.

| 다루는 것 | 기준 |
|---|---|
| HTTP API를 내는 백엔드의 경로와 도메인 나누기, 도메인 안과 사이, 입력·오류, 목록, 쓰기, 권한·식별자 | `criteria/web-api.md` |
| 브라우저에서 도는 웹 앱에서 무엇을 어디에 두고 데이터를 어떻게 다룰지 | `criteria/web-frontend.md` |
| 데이터베이스 고르기와 설계 | 새 프로젝트는 PostgreSQL을 쓰고, 기존 프로젝트는 쓰던 DBMS를 그대로 쓴다. 설계와 쿼리는 그 DBMS에 맞는 검증된 스킬을 따른다. 검증된 스킬은 쓰는 사람이 많고(설치 수, 스타 수) 최근까지 고쳐지고 있는 것이다. 특정 서비스 전용 내용은 따르지 않는다. 검증된 스킬이 없으면 그 DBMS의 공식 문서를 따른다. 스킬이 설치되어 있지 않으면 설치를 사람에게 부탁한다. |
