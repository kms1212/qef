---
name: repo
description: 새 저장소를 만들 때 호출한다.
---

# repo

새 저장소를 만들 때 갖출 것이다. 이미 있는 저장소에 새 언어를 들일 때는 그 언어 스킬의 「들일 때」를, 도구나 의존성 하나를 들일 때는 `qef:dev`의 「쓰기 전에 이미 있는 것을 찾는다」를 따른다. 무엇을 설치할지는 `qef:dev`의 새 의존성 문단대로 사용자가 정한다.

## git

- `git init -b main`으로 만든다.

## 무시할 파일

- 프로젝트의 `.gitignore`에는 이 저장소에서 빌드하거나 도구를 돌리는 사람 누구에게나 생기는 파일을 둔다.
  - 쓰는 언어의 GitHub 템플릿(github/gitignore)으로 시작한다. `gibo dump Python Node TeX >> .gitignore`나 gitignore.io API(`https://www.toptal.com/developers/gitignore/api/<언어,...>`)로 받는다.
  - 템플릿에 없는, 이 저장소의 도구가 만드는 파일(도구 캐시, 빌드 폴더, 생성 결과)을 더한다. 각 언어 스킬의 「들일 때」에 그 언어의 것이 있다.
- 개인 환경에만 생기는 파일(OS 파일, 편집기 설정)은 프로젝트 `.gitignore`가 아니라 전역 ignore(`~/.config/git/ignore`)에 둔다.
- 에이전트 파일(`CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/` 아래 에이전트가 쓰는 파일)은 커밋하지 않는다. 전역 ignore에 들어 있는지 확인한다.

## OpenSpec

- 초기화하기 전에, 설치된 `openspec`이 OpenSpec 포크인지 `grep -c 'qef:' "$(npm root -g)/@fission-ai/openspec/schemas/spec-driven/schema.yaml"`로 확인한다. 포크와 upstream은 패키지 이름이 같아서, 결과가 0이면 upstream이 깔린 것이고 qef를 부르는 지시가 들어가지 않는다. 그때는 qef README의 「OpenSpec 포크」대로 포크를 설치한다.
- `openspec init --tools claude`로 초기화한다. 에이전트용 skill과 command를 프로젝트 안에 만들었으면(`--scope project`) 그 파일은 커밋하지 않는다.

## 언어

- 쓸 언어마다 그 언어 스킬(`qef:js-ts`, `qef:python`, `qef:latex`, `qef:sail`)의 「들일 때」를 따른다.

**확인할 것**
- [ ] 빌드와 테스트를 한 번 돌린 뒤 `git status`에 빌드 결과, 캐시, 에이전트 파일이 보이지 않는다.
