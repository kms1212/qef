# layout 사례

사례의 도메인과 이름은 설명을 위해 지은 것이다. 표면이 아니라 판단을 가져간다.

## 자리마다 다른 기준

```text
repo/
├── apps/                 # 어디에 배포되나
│   ├── storefront/
│   └── warehouse-api/
│       └── src/
│           ├── routes/orders/{id}/ship.ts   # API 경로와 같은 모양
│           └── fulfillment/                 # 개념
└── packages/             # 여러 앱이 쓰는 것
    └── order-contract/   # 프론트엔드와 백엔드가 함께 쓰는 API 약속
```

## 쓰는 곳이 한 곳이면 그 곳에

백엔드의 서버와 배치 작업만 쓰는 재고 계산은 공용 `packages/`가 아니라 백엔드 안에 둔다. 프론트엔드도 쓰는 요청·응답 모양은 공용에 둔다.

## 바뀌는 이유로 나누는 공용 바탕

```text
나쁨: packages/foundation/ 안에 날짜 표기, 오류 바탕, 저장 연결이 섞임
좋음: packages/errors/, packages/formatting/, packages/storage/
```

쓰는 쪽이 같다는 것만으로 묶지 않는다. 표기 규칙이 바뀔 때 저장 연결이 함께 바뀌지 않는다.

## 경로로 상속이 보임

```text
나쁨:
validators/
├── validator.ts
└── validators.ts      # 하위 정의를 한 파일에

좋음:
validators/
├── validator.ts       # 추상
└── validators/
    ├── isbn.ts
    └── barcode.ts
```

## 같은 낱말을 되풀이하지 않음

```text
나쁨: invoice/invoice-parser.ts, invoice/invoice-printer.ts
좋음: invoice/parser.ts, invoice/printer.ts
```

## 안쪽과 바깥쪽

```text
나쁨: 암호화 로직을 저장 패키지가 갖고, 봉인 함수가 대상이 행인지 파일인지 받음
좋음: crypto가 봉인을 갖고 바이트만 다루며, 저장 패키지는 결과를 저장
```

## 통로

```text
나쁨: POST /uploads/metadata 뒤에 POST /uploads/content
좋음: POST /uploads 한 번에 메타데이터와 파일을 함께
```

입력을 대문자로 거절하는 대신 안쪽 표현만 소문자로 통일할 수 있으면 제한을 두지 않는다. 반대로 "기관 설정 행은 하나뿐"은 업무 제약이니 구조로 둔다.

## 결함의 층

파일 이름이 어색해 고치려 했는데, 원인이 성질을 상위 타입으로 세운 객체 설계에 있으면 이름을 바꾸지 않고 객체 설계로 돌아간다.

## 경로 검사는 양쪽으로 확인

화면과 할 수 있는 일을 맞춰 보는 검사를 만들었으면, 할 수 있는 일보다 적은 화면과 많은 화면을 하나씩 만들어 둘 다 실패하는지 본다.
