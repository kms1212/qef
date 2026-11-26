---
name: db
description: 테이블·컬럼·관계·인덱스를 정하거나 바꾸기 전에, 그리고 DB를 읽고 쓰는 코드를 쓰기 전에 반드시 호출한다.
---

# db

이 스킬은 DB schema를 사람이 읽고 바로 파악할 수 있게 정하는 기준과, DB를 읽고 쓰는 기준을 다룬다. schema 언어와 ORM(Prisma, Drizzle, SQL DDL, SQLAlchemy 등)에 상관없이 적용한다. 무엇을 저장할지(개념, 관계, 다중성, 파생 값)는 `qef:model`이 정한다. PostgreSQL의 데이터 타입, 제약 조건, 인덱스는 `design-postgres-tables`, schema를 바꾸는 마이그레이션은 `postgres-database-migration`을 따르고, 다른 DB 엔진은 그 엔진의 공식 문서를 따른다. schema 언어와 ORM의 사용법은 설치된 그 버전의 문서를 따른다.

원칙마다 의도, 규칙, 확인할 것을 둔다. 규칙에 없는 상황은 그 원칙의 의도로 판단한다. 사용자가 실제 프로젝트에서 짚은 장면은 [references/cases.md](references/cases.md)에 있다.

## 업무 관계와 기록용 참조를 가른다

**의도.** 「누가 만들었나」, 「누가 했나」 같은 기록을 업무 관계와 같은 모양으로 섞으면, 참조받는 쪽(사용자 같은)에 기록용 back-relation이 쌓여 업무 관계가 묻힌다. 기록이 업무 데이터의 삭제 규칙에 묶여, 사람을 지우면 기록이 막히거나 함께 지워진다.

**규칙**
- 참조 컬럼마다 업무 관계인지 기록용 참조인지 먼저 정한다. 업무 관계는 요구사항이 정한 관계다(담당자, 소속, 상위 조직). 기록용 참조는 만든 사람, 마지막으로 바꾼 사람, 행위자, 요청 ID처럼 일이 일어난 사실을 남기는 참조다.
- 기록용 참조를 FK로 둘지 plain ID로 둘지는 「참조 대상이 지워지거나 바뀌어도 이 기록이 남아야 하는가」로 정한다. 남아야 하면 FK의 삭제 규칙이 기록을 막거나 함께 지우지 않게 둔다.
- 정한 방식은 한 프로젝트 안의 모든 기록용 참조에 같게 쓴다. 감사 기록은 plain ID이고 다른 테이블의 「만든 사람」은 FK인 식으로 갈리지 않게 한다.

**확인할 것**
- [ ] 모델마다 기록용 참조가 업무 관계와 다른 묶음에 있다.
- [ ] 기록용 참조가 FK인지 plain ID인지가 프로젝트 안에서 한 방식이다.

## 관계 이름은 그 관계의 역할을 말한다

**의도.** 상대 모델 이름을 그대로 쓴 관계는 이름만 보고 무슨 관계인지 알 수 없다. `User.files`는 사용자가 가진 파일인지 만든 파일인지 말하지 않는다.

**규칙**
- relation 필드와 back-relation 필드는 상대 모델 이름이 아니라 그 관계의 역할로 이름 짓는다(`createdFiles`, `ownedFiles`).
- 같은 두 모델 사이의 관계가 둘 이상이면 역할마다 다른 이름을 쓴다(`createdTasks`, `assignedTasks`). ORM이 관계 이름을 요구하면 그 이름도 역할로 짓는다.
- 기록용 참조의 back-relation은 이름에서 기록이라는 것이 드러나게 한다(`created…`, `updated…`).

**확인할 것**
- [ ] back-relation 이름만 보고 그 관계가 무엇인지(가진 것, 맡은 것, 만든 것) 말할 수 있다.

근거: Prisma, "Relations"(같은 두 모델 사이의 관계가 여럿이면 `@relation` 이름으로 가른다. 예: `writtenPosts`, `pinnedPost`) (https://www.prisma.io/docs/orm/prisma-schema/data-model/relations).

## schema는 개념별로 묶고, 모델 안은 같은 순서로 나눠 쓴다

**의도.** 필드가 한 덩어리로 이어지면 무엇이 업무 값이고 무엇이 관계, 수명, 기록인지를 읽는 사람이 매번 갈라야 한다. 모델마다 순서가 다르면 같은 것을 찾으러 매번 전부 읽는다.

**규칙**
- schema 파일은 개념(도메인)별로 나눈다. 한 파일에는 함께 바뀌는 모델을 둔다(`qef:layout`의 「패키지는 함께 바뀌고 함께 쓰이는 큰 묶음이다」).
- 모델 안의 필드는 아래 순서의 묶음으로 쓰고, 묶음 사이에 빈 줄을 둔다. 모든 모델이 같은 순서다.
  1. 식별자(PK, 밖에 보이는 번호)
  2. 업무 값
  3. 업무 관계. FK 컬럼과 그 relation 필드를 붙여 둔다
  4. 상태와 수명(revision, 만든 시각, 바꾼 시각, 보관 시각)
  5. 기록용 참조
  6. back-relation. 업무 관계 묶음, 기록용 참조 묶음 순서로 나눠 둔다
  7. 모델 속성(인덱스, 제약 조건, 테이블 매핑)
- 업무 값을 수명이나 기록 묶음 뒤에 끼워 넣지 않는다. 새 업무 값을 더할 때도 업무 값 묶음에 넣는다.

**확인할 것**
- [ ] 모델마다 묶음 순서가 같고, 묶음 사이가 빈 줄로 나뉜다.
- [ ] 업무 값, 업무 관계, 기록용 참조가 다른 묶음에 섞여 있지 않다.

근거: Prisma, "Schema location"(「Organize your files by domain: group related models into the same file.」) (https://www.prisma.io/docs/orm/prisma-schema/overview/location).

## 조회 방식은 DB에서 읽는 단계부터 정한다

**의도.** 목록을 커서로 넘길지 쪽 번호로 넘길지는 DB가 행을 고르는 방식이다. 화면이나 API 층에서만 바꾸면 DB는 여전히 앞 행을 모두 세어 넘기고, 같은 목록에 두 방식이 섞인다.

**규칙**
- 목록마다 커서 방식과 쪽 번호 방식 가운데 무엇을 쓸지 DB에서 읽는 단계(리포지토리, 쿼리)에서 정한다. API와 화면은 그 방식을 그대로 따른다.
- 커서 방식은 정렬이 결정적이어야 한다. 정렬 기준 뒤에 고유한 컬럼을 덧붙이고, 그 순서의 인덱스를 둔다.

**확인할 것**
- [ ] 목록마다 조회 방식이 DB 쿼리에서 정해지고, 정렬 기준에 고유한 컬럼이 들어 있다.

근거: Markus Winand, Use The Index, Luke, "No Offset"(OFFSET은 앞 행을 모두 읽어야 한다), "Paging Through Results"(「Paging requires a deterministic sort order.」) (https://use-the-index-luke.com/no-offset, https://use-the-index-luke.com/sql/partial-results/fetch-next-page).

## 관계는 ORM에 먼저 선언한다

**의도.** ORM에 선언하지 않은 관계를 raw SQL로 이으면, 그 관계가 schema에 드러나지 않아 다음 사람이 찾지 못하고, 타입 검사와 마이그레이션이 그 관계를 모른다.

**규칙**
- 프로젝트가 ORM을 쓰면 테이블 사이의 관계를 ORM의 relation으로 먼저 선언하고, 그 관계로 읽고 쓴다.
- raw SQL은 ORM이 표현하지 못하는 쿼리에만 쓴다. ORM 문서에서 그 쿼리를 표현할 수 없다는 근거를 찾은 뒤에 쓰고, 리포지토리 한 곳에 둔다.

**확인할 것**
- [ ] raw SQL이 잇는 관계가 모두 ORM에도 선언되어 있다.

## 설계를 남긴다

- DB 설계는 객체 설계 다음, API 설계 앞에 한다(`qef:model`의 「정하는 순서」). 정한 테이블, 관계, 인덱스, 조회 방식은 파일로 남긴다(OpenSpec 변경이면 `design.md`).
