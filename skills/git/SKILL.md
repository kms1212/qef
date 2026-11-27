---
name: git
description: 커밋, 스테이징, branch·worktree 만들기와 정리, merge·rebase, push를 하기 전에 호출한다.
---

# git

이 스킬은 커밋을 나누고 만드는 방법과, branch·worktree·merge·push를 다루는 기준이다. 커밋할 때 사용자에게 묻는지, push·merge·태그·PR을 누가 시키는지는 사용자의 규칙과 프로젝트 규칙을 따른다.

원칙마다 의도, 규칙, 확인할 것을 둔다. 규칙에 없는 상황은 그 원칙의 의도로 판단한다. 사용자가 실제 작업에서 짚은 장면은 [references/cases.md](references/cases.md)에 있다.

## 커밋 하나에는 논리적 변경 하나를 담는다

**의도.** 여러 변경을 한 커밋에 섞으면 그중 하나만 따로 보거나 되돌릴 수 없고, `git blame`과 `git bisect`가 가리키는 커밋이 여러 일을 담는다. 커밋을 끝에 한 번만 내면 그 사이의 단계가 기록에 남지 않는다.

**규칙**
- 일을 단계로 나눠 했으면(OpenSpec 변경이면 tasks의 번호 묶음) 단계마다 커밋한다. 한 단계로 끝나는 일은 끝났다고 보고하기 전에 커밋한다.
- 각 커밋은 뒤 커밋 없이 빌드되고 그 단계의 검사를 통과하는 상태로 낸다. 무거운 검사를 언제 돌리는지는 `qef:testing`의 「언제 돌리는가」를 따른다.
- 관계없는 수정(어긋난 것 고치기, 리팩터링, 범위 밖의 것 지우기)은 하던 변경과 다른 커밋으로 낸다. 지금 바꾸는 줄 안의 작은 정리(지역 변수 이름 같은)는 같은 커밋에 둔다. 따로 내면 커밋만 늘고 보는 사람이 얻는 것이 없기 때문이다.
- 하던 일 도중 관계없는 것을 고치면, 고치는 커밋을 먼저 내고 하던 변경은 그 위에서 이어 간다. 고친 것이 하던 일에 영향을 주면 하던 변경을 그에 맞춘다.
- 범위 밖의 것을 지우면 그것만 담은 커밋으로 내고 무엇이 사라졌는지 보고한다. 따로 커밋해 두면 `git revert` 한 번으로 되돌릴 수 있다.

**확인할 것**
- [ ] 커밋마다 논리적 변경 하나이고, 관계없는 수정은 따로 있다.
- [ ] 끝낸 단계마다 커밋이 있다.

근거: git, "gitworkflows"(「you should try to split your changes into small logical steps, and commit each of them」) (https://git-scm.com/docs/gitworkflows). Linux kernel, "Submitting patches"(「Separate each logical change into a separate patch.」) (https://docs.kernel.org/process/submitting-patches.html). Google, "Small CLs"(「It's usually best to do refactorings in a separate CL from feature changes or bug fixes.」) (https://google.github.io/eng-practices/review/developer/small-cls.html).

## 스테이징은 파일 이름으로 하고, 하던 변경은 작업 트리에 둔다

**의도.** 한꺼번에 스테이징하면 다른 세션이나 사람의 변경, 시크릿, 에이전트 파일이 섞인다. 하던 변경을 치우려고 stash나 reset을 쓰면, 같은 폴더를 쓰는 다른 세션의 변경까지 치운다.

**규칙**
- 파일을 이름으로 스테이징한다. `git add -A`, `git add .`을 쓰지 않는다.
- 하던 변경과 같은 파일에서 일부만 커밋하려면 그 부분의 patch만 index에 올린다(`git apply --cached`).
- 하던 변경을 치우려고 stash, reset, checkout을 쓰지 않는다. 스테이징한 것만 시험하려고 `git stash push --keep-index`를 쓰는 것도 같다. 같은 폴더를 다른 세션이 쓰면 그 세션의 변경까지 치우기 때문이다.
- 커밋하기 전에 `git status`와 `git diff --cached`로 들어갈 것을 보고, 파일마다 아래 표에서 행을 찾는다. 어느 행에도 맞지 않으면 그 파일을 넣지 않고 무엇인지부터 찾는다.

| 파일 | 저장소에 |
|---|---|
| 코드, 테스트, 빌드·실행 설정, 그 프로젝트를 쓰거나 개발하는 사람이 읽는 문서 | 추적한다 |
| 빌드 산출물, 의존성 캐시, 실행 중에 생기는 파일(log, 임시 파일), OS·편집기가 만드는 파일 | 추적하지 않고 프로젝트 `.gitignore`에 넣는다 |
| 시크릿, 한 사람의 컴퓨터에만 맞는 설정 | 추적하지 않는다 |
| 에이전트 지시 파일(`CLAUDE.md`, `AGENTS.md`, `.claude/` 등) | 사용자의 규칙을 따른다 |
| 조사 기록과 보고서, 계획, 작업 경위, 에이전트가 쓴 메모 | 추적하지 않는다 |

- 커밋 hook이 막으면 원인을 고친다. `--no-verify`로 넘기지 않는다. hook이 막는 것은 그 프로젝트가 커밋에 들어가면 안 된다고 정한 것이기 때문이다.

**확인할 것**
- [ ] 스테이징한 파일마다 표의 행이 있고, 다른 세션이나 사람의 변경이 들어가지 않았다.

## 커밋 메시지는 왜 바꿨는지 쓴다

**의도.** 무엇을 바꿨는지는 diff가 보여 주지만, 왜 바꿨는지는 메시지에만 남는다.

**규칙**
- 왜 바꿨는지를 쓴다. 바꾼 것을 diff에서 그대로 옮겨 적지 않는다.
- 저장소의 지난 메시지 형식(언어, 길이, Conventional Commits 같은 접두어)을 `git log`로 보고 따른다.
- 문장을 다듬는 skill은 `qef:doc`의 「문장 다듬기 skill은 독자와 언어로 고른다」 표를 따른다.

**확인할 것**
- [ ] 메시지가 저장소의 형식을 따르고, 왜 바꿨는지를 말한다.

## 되살릴 수 없는 것은 버리지 않는다

**의도.** 커밋된 것은 지워도 git 기록에서 되살릴 수 있다. 커밋하지 않은 변경과 추적하지 않는 파일은 버리면 되살릴 수 없고, 그것이 다른 세션이나 사람이 하던 일일 수 있다.

**규칙**
- 커밋하지 않은 변경과 추적하지 않는 파일을 `checkout`, `restore`, `reset --hard`, `clean`, `rm`으로 버리지 않는다. 누가 왜 만들었는지 찾고(`qef:investigate`), 끝난 변경이면 따로 커밋하고, 하던 일이면 그 주인에게 알린다.
- 커밋된 것을 되돌릴 때는 되돌리는 커밋(`git revert`)이나 지우는 커밋으로 한다.
- 이미 push한 기록은 고쳐 쓰지 않는다(force push, push한 커밋의 amend나 rebase). 그 기록을 받아 간 쪽의 기록과 어긋나기 때문이다.

**확인할 것**
- [ ] 버린 것이 없거나, 버린 것마다 커밋되어 있던 것이다.

## branch와 worktree는 harness가 아는 방식으로 다룬다

**의도.** harness가 모르는 worktree를 만들면 harness가 보지도 정리하지도 못하는 상태가 남는다. 같은 폴더에서 branch를 바꾸면 그 폴더를 쓰는 다른 세션의 작업 기반이 바뀐다.

**규칙**
- 격리가 필요하면 먼저 이미 linked worktree 안인지 본다. `git rev-parse --git-dir`와 `git rev-parse --git-common-dir`가 다르면 linked worktree다. 다만 submodule 안에서도 다르므로, `git rev-parse --show-superproject-working-tree`가 경로를 내면 submodule로 본다.
- harness의 worktree 도구가 있으면 그것을 쓰고, 없을 때만 `git worktree add`를 쓴다. 프로젝트 안에 두면 그 폴더가 ignore되었는지 먼저 본다.
- 같은 폴더를 다른 세션과 나눠 쓰면 branch를 바꾸지 않는다.
- merge된 branch와 그 worktree, remote에서 지워진 branch(`git branch -v`의 `[gone]`)는 정리한다. 커밋하지 않은 변경이 있는 worktree는 지우지 않는다(「되살릴 수 없는 것은 버리지 않는다」).

**확인할 것**
- [ ] 새로 만든 worktree가 harness의 도구로 만든 것이거나, 도구가 없었던 이유가 있다.

근거: obra/superpowers, "using-git-worktrees"(「Detect existing isolation first. Then use native tools. Then fall back to git.」) (https://github.com/obra/superpowers/blob/main/skills/using-git-worktrees/SKILL.md).

## 합치고 올린 결과를 확인한다

**의도.** 틀린 branch에 merge하면 되돌리기 비싸다. merge하기 전에 통과한 검사는 합친 결과가 통과한다는 근거가 아니다.

**규칙**
- push, merge, 태그, PR은 사용자의 규칙과 프로젝트 규칙이 정한 때 한다.
- merge하기 전에 대상 branch를 확인한다. 일이 갈라져 나온 branch는 계획, 대화, branch의 upstream에 있다.
- merge 방식(merge commit, rebase, squash)은 프로젝트의 지난 기록과 규칙을 따른다. 이미 push한 branch는 rebase하지 않는다.
- 합친 결과에서 검사를 다시 돌리고(`qef:testing`), 실패하면 push하지 않고 원인을 찾는다.
- push한 뒤에는 CI 결과를 읽는다(`qef:command`). CI에서 처음 실패를 알게 되지 않게, CI가 돌릴 검사는 push하기 전에 로컬에서 돌린다(`qef:testing`).

**확인할 것**
- [ ] 합친 결과에서 검사를 돌렸고, push한 뒤 CI 결과를 읽었다.

근거: obra/superpowers, "finishing-a-development-branch"(「Confirm before merging: merging into the wrong base is expensive to undo.」) (https://github.com/obra/superpowers/blob/main/skills/finishing-a-development-branch/SKILL.md).
