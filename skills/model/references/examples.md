# model 사례

사례의 도메인과 이름은 설명을 위해 지은 것이다. 표면이 아니라 판단을 가져간다.

## 동작이 다르면 클래스, 값만 다르면 인스턴스

배송비를 계산한다. 정액 배송은 금액을 그대로 쓰고, 무게 배송은 무게에 단가를 곱한다.

```text
나쁨: shipping_rules 표의 행 { kind: "weight", formula: "w*300" }
좋음: ShippingMethod
       ├── FlatShipping
       └── WeightShipping
```

계산식이 값처럼 적혀 있어도 판정하는 것은 코드다.

회원 등급은 할인율만 다르고 계산은 같다.

```text
나쁨: GoldTier, SilverTier 클래스가 rate만 다르게 반환
좋음: Tier 하나와 인스턴스 { name: "gold", rate: 0.1 }
```

어느 배송 방법을 쓰는지, 어느 등급을 주는지는 데이터다.

쿠폰 코드를 거르는 패턴도 같다.

```text
나쁨: patterns 목록의 인스턴스 { name: "gift", regex: "^G[0-9]{8}$" }
좋음: CouponPattern
       ├── GiftCouponPattern
       └── PartnerCouponPattern
```

정규식은 값도 데이터도 아니고 코드다.

매장 진열은 고르는 목록과 값이 다른 자리에 간다.

```text
코드: DisplaySurface(FLOOR, SHELF, WALL). 면마다 놓는 검사가 다르다
데이터: 상품마다 어느 면에 놓는지, 그 위치 값
```

## 이름에 박힌 정책

```text
나쁨: Over14DaysLateFee
좋음: LateFee, 기준 일수는 설정 값
```

기준이 21일로 바뀌어도 이름을 바꾸지 않는다.

## 합치지 않기, 쪼개지 않기

문서 게시 시스템이다.

```text
나쁨: Publish 단위에 "예약 게시는 편집장일 때만" 조건을 붙임
좋음: Publish와 SchedulePublish를 독립 단위로 두고 역할마다 고름
```

반대로 제목 수정과 본문 수정을 늘 함께 준다면 `EditTitle`, `EditBody`로 나누지 않고 `EditDraft` 하나로 묶는다.

## 구현이 하나뿐인 추상

```text
checkout → PaymentGateway
              └── StripeGateway
```

결제 코드는 결제를 어떻게 부르는지만 알면 되고 어느 회사인지 알 필요가 없다. 구현이 하나여도 둔다. 반대로 호출하는 쪽이 `if (gateway instanceof StripeGateway)`로 분기하면 이 추상은 아무것도 숨기지 않는다.

## 개념과 성질

```text
나쁨: Reservable ← Book, Journal
좋음: Publication ← Book, Journal
      ReservableMixin을 Book, Journal에 붙임
```

"예약할 수 있다"는 형용사로 말하는 성질이다. 책은 예약 가능한 것의 한 종류가 아니라 출판물의 한 종류다.

## 자기 정보를 스스로 선언

```text
나쁨: commands.ts의 큰 배열에 모든 명령의 이름과 인자를 손으로 적음
좋음: 명령 파일마다 자기 이름과 인자를 선언하고, 등록부는 그 선언을 모아 만듦
```

## 업무 관계

도서관 시스템이다.

```text
나쁨: /fines 최상위, Loan과 별개
좋음: /loans/{id}/fine. 대출 없이 연체료는 없다
```

```text
나쁨: Member.is_overdue를 저장
좋음: 대출의 반납 기한과 반납일을 사실로 두고 계산
```

"회원당 카드는 하나"에서 얻은 규칙을 "회원당 대출"에 그대로 대지 않는다. 대출이 몇 건일 수 있는지는 업무에 묻는다.

## 빌려 온 모델

저장소의 브랜치 모델을 문서 초안에 빌려 올 때, 브랜치만 가져오고 병합 충돌을 다루는 축을 빼면 일부만 댄 것이다. 서버가 계산한 초안 상태를 화면이 읽기만 하면 될 때 화면 안에 브랜치 모델을 다시 세우면 층 밖에 댄 것이다.
