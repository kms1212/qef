# LLM·에이전트의 UX·사용성 평가 성능 (2023~2026)

모든 출처는 2026-11-09에 가져왔다. 표기 규칙은 01과 같다.

## 결론

- 사람 전문가가 찾은 문제와의 겹침은 낮다. 스크린샷 기반 GPT-4o는 전문가 문제의 21.2%만 찾았고, 다른 연구에서도 한 모델의 recall은 0.38~0.43이었다. 사람 한 명의 recall과 비슷하거나 조금 낮다.
- precision은 사람보다 낮다(0.60~0.83 대 0.83~0.92). 거짓 양성의 주된 종류는 (1) 시각·미적 취향 지적, (2) 스크린샷으로 확인할 수 없는 것을 가정한 지적(피드백이 없을 것이다, 검증이 없을 것이다)이다.
- 잘하는 것: 문구(문법, 전문 용어), 일관성, 정렬·간격 같은 세밀한 배치 불일치(구조 데이터를 줄 때), 사용자 말과의 일치.
- 못하는 것: 도메인 지식과 맥락이 필요한 문제, 사용자 통제·유연성·효율, 화면 사이에 걸친 문제, 미니멀리즘 판단(「Aesthetic and Minimalist Design」 지적은 대체로 부정확), 렌더링을 보지 않으면 모르는 시각 문제(코드·JSON 기반), 범용 MLLM의 텍스트 overflow·컨테이너 겹침 검출(F1 20~31%, 검색 요약만).
- 스크린샷 기반과 코드(구조) 기반은 놓치는 것이 다르다. 구조 기반은 bounding box가 겹쳐도 실제로 겹쳐 보이지 않는 것을 잘못 지적하고 시각 중심 정렬을 놓친다. 스크린샷 기반은 상호작용 뒤의 상태와 화면에 없는 시나리오를 가정으로 채운다.
- 모든 연구가 「사람 평가를 대신하지 못하고 보조할 수 있다」로 결론 낸다. 사람과 AI를 합친 것이 가장 좋다.
- 자기 산출물을 평가할 때는 self-preference bias가 있다.

## 출처

- [Duan et al., Generating Automatic Feedback on UI Mockups with Large Language Models, CHI 2024](https://arxiv.org/html/2403.13139v1) — 본문 확인(앞 100,000자). 입력은 Figma 시안을 JSON으로 바꾼 것(코드·구조 기반).
  - 51개 UI에서 GPT-4 제안의 52%가 정확, 19% 부분 정확, 29% 부정확. 반복 사용 뒤에는 정확 39%로 떨어짐.
  - 12개 UI에서 전문가와 비교: 둘 다 찾은 29개, GPT-4만 9개, 사람만 62개. precision/recall/F1 GPT-4 0.603/0.380/0.466, 사람 평균 0.829/0.336/0.478.
  - 잘한 heuristic: Recognition rather than Recall, Match Between System and Real World, Consistency and Standards. 「Aesthetic and Minimalist Design」은 대체로 부정확.
  - 텍스트 문제(12/12)와 미세한 정렬·간격(12/12)이 강점. 시각 이해(8/12)가 약점: JSON의 bounding box 겹침을 실제 겹침으로 오판하고 크기가 다른 요소의 시각 중심 정렬을 놓침.
  - 지침을 맥락과 관례를 무시하고 지나치게 문자 그대로 적용함.
  - 결론: 「will not replace human heuristic evaluation」
- [Can GPT-4o Evaluate Usability Like Human Experts? (arXiv 2506.16345, 2025)](https://arxiv.org/abs/2506.16345) — 초록만 확인. 웹 시스템 스크린샷 입력.
  - 「only 21.2% of the issues identified by human experts were also identified by GPT-4o」
  - 새 문제 27개를 냈으나 환각과 추측에서 온 거짓 양성이 여럿. aesthetic/minimalist와 match에서 낫고, flexibility·control·efficiency에서 약함.
- [Will AI also replace inspectors? (arXiv 2510.17056, 2025)](https://arxiv.org/html/2510.17056v1) — 본문 확인. 소아 중환자실 시제품의 스크린샷 16장, GPT-4o와 Gemini 2.5 Flash, 사람 전문가 4명.
  - recall: 사람 최고 .567, Gemini .433, ChatGPT .409. Gemini+사람 .843.
  - precision: 사람 .917, Gemini .829, ChatGPT .820. 거짓 양성 비율 사람 약 8%, Gemini 17.1%, ChatGPT 18%.
  - AI 거짓 양성: 시각·미적 지적(라벨 정렬, 버튼 색조)과 스크린샷으로 확인할 수 없는 가정(동작 뒤 피드백, 입력 검증). ChatGPT 18개 중 7개가 동작 뒤 피드백.
  - 차이의 원인으로 「domain knowledge, contextual reasoning, and user-centered interpretation」을 든다.
  - 결론: AI는 「cannot replace human inspectors but can serve as a valuable augmentation tool」
- [Zhong et al., Synthetic Heuristic Evaluation (arXiv 2507.02306, 2025)](https://arxiv.org/abs/2507.02306) — 초록만 확인. 순서 있는 스크린샷과 다듬은 prompt로 GPT-4가 두 앱의 문제 73%·77%를 찾았고 사람 5명은 57%·63%. 레이아웃 문제에서 뛰어났으나 「struggled with recognizing some UI components and design conventions」, 화면 사이에 걸친 위반을 찾기 어려웠다. 정답 집합을 저자가 정한 것이라 독립 검증은 아니라는 비판이 있다는 검색 요약도 있다(pith.science, 원문 미확인).
- [Duan et al., UICrit (arXiv 2407.08850, UIST 2024)](https://arxiv.org/abs/2407.08850) — 검색 요약만. 디자이너 7명의 비평 3,059개(UI 983개). few-shot과 visual prompting으로 LLM 피드백이 55% 나아졌으나 여전히 사람 전문가에 못 미친다.
- [Visual Prompting with Iterative Refinement for Design Critique Generation (arXiv 2412.16829)](https://arxiv.org/html/2412.16829v1) — 검색 요약만. MLLM이 정확한 visual grounding에 어려움을 겪는다.
- [UI-Lens, CVPR 2026](https://openaccess.thecvf.com/content/CVPR2026/html/Xiang_UI-Lens_Assessing_General_MLLMs_Potential_to_Automate_UI_Display_Quality_CVPR_2026_paper.html) — 검색 요약만(본문 403). 디자인 전문가가 주석한 4,759쪽, 모델 10개. Text Overflow와 Container Overlap에서 과업 평균 F1 20.36%·31.21%, Text Inconsistency 10.61%. 세밀한 요소 경계 과업은 무작위에 가깝다.
- [ASE 2025 Meituan 논문(fine-tuned VLM 화면 이상 검출)](https://tsingpig.github.io/files/ASE%202025%20papers/ASE%202025/pdfs/ASE2025-5DQL9ko9OwpjaORDC0qal7/573300d273/573300d273.pdf) — 검색 요약만. 정상·이상 스크린샷으로 fine-tune하면 F1 80%, 거짓 양성 10%. 텍스트 overflow 같은 텍스트 이상은 전용 기법에 맡긴다.
- [UXAgent (arXiv 2504.09407)](https://arxiv.org/abs/2504.09407v3) — 초록만 확인. LLM agent로 사용성 테스트를 흉내 낸다. 실제 연구 전에 연구 설계를 다듬는 용도: 「before they conduct the real human-subject study」. 행동이 사람과 얼마나 맞는지의 정량 검증은 찾지 못했다.
- [GLM-5 (arXiv 2602.15763)](https://arxiv.org/pdf/2602.15763) — 검색 요약만. agent-as-a-judge가 실제 UI를 조작해 확인하는 항목에서 전문가와 94% 일치했으나, 불일치는 주관적 시각 품질 항목에 몰렸다.
- [Panickssery, Bowman, Feng, LLM Evaluators Recognize and Favor Their Own Generations (arXiv 2404.13076)](https://arxiv.org/abs/2404.13076) — 초록 확인. 「a linear correlation between self-recognition capability and the strength of self-preference bias」
