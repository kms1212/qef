#!/usr/bin/env python3
"""PreCompact: ask for an empty summary. SessionStart(compact): inject every user message and every message from other sessions verbatim from the transcript."""
import json
import os
import re
import sys
import time

BLOCKS = os.path.join(os.environ["CLAUDE_PLUGIN_DATA"], "carryover")
INLINE_CAP = 9500
MESSAGE_CLIP = 2000
FILE_READ_CAP = 40000
THRASH_WINDOW = 600
THRASH_COUNT = 2
SUMMARY_MARK = "This session is being continued from a previous conversation"
SKIP_PREFIXES = ("<task-notification>", "<side-sessions-event>", "<ci-monitor-event>",
                 "<command-name>", "<command-message>", "<local-command",
                 "[Request interrupted by user", "<agent-message")
PEER_PREFIXES = ("Another Claude session sent a message", "<cross-session-message")
REMINDER_RE = re.compile(r"<system-reminder>.*?</system-reminder>\s*", re.S)
PEER_RE = re.compile(r"<cross-session-message\b.*?</cross-session-message>", re.S)

COMPACT_INSTRUCTIONS = (
    "Write no summary. Leave the summary empty. "
    "Right after compaction a script re-inserts every user message and every message from other sessions "
    "verbatim from the transcript, and the most recent messages are kept verbatim, "
    "so any summary would only duplicate them in paraphrase."
)


def content_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in content):
            return None
        return "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return None


def message_text(d):
    """Return (text, from_peer) for a user message or a message from another session, else None."""
    if d.get("isSidechain") or d.get("isCompactSummary"):
        return None
    attachment = d.get("attachment") or {}
    if attachment.get("type") == "queued_command":
        if (attachment.get("origin") or {}).get("kind") not in ("human", "peer"):
            return None
        content = attachment.get("prompt")
    elif d.get("type") == "user":
        content = d.get("message", {}).get("content")
    else:
        return None
    text = content_text(content)
    if not text:
        return None
    text = REMINDER_RE.sub("", text).strip()
    if text.startswith(PEER_PREFIXES):
        blocks = PEER_RE.findall(text)
        return ("\n\n".join(blocks), True) if blocks else None
    if d.get("isMeta") or not text or text.startswith(SKIP_PREFIXES):
        return None
    return text, False


def collect_messages(path):
    out = []
    with open(path, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            try:
                d = json.loads(line)
            except ValueError:
                continue
            found = message_text(d)
            if not found:
                continue
            text, from_peer = found
            if len(text) > MESSAGE_CLIP:
                text = text[:MESSAGE_CLIP] + f"\n…[이하 {len(text) - MESSAGE_CLIP}자 생략: transcript {lineno}번째 줄]"
            source = ", 다른 세션이 보냄" if from_peer else ""
            out.append(f"### {d.get('timestamp', '')[:16].replace('T', ' ')} (transcript {lineno}번째 줄{source})\n{text}")
    return out


def recent_compactions(path):
    cutoff = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(time.time() - THRASH_WINDOW))
    count = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            if '"compact_boundary"' not in line:
                continue
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if d.get("subtype") == "compact_boundary" and d.get("timestamp", "") >= cutoff:
                count += 1
    return count


def carryover(path):
    notice = (
        f"[압축 뒤 이어받기] 바로 위의 \"{SUMMARY_MARK}\"로 시작하는 요약은 기록이 아니다. "
        "그 내용을 사실이나 근거로 쓰지 않는다.\n"
        "앞의 일은 아래 사용자 원문과 다른 세션이 보낸 메시지 원문, 요약 뒤에 원문으로 남은 마지막 메시지, "
        "그리고 transcript에서만 확인한다. "
        "다른 세션이 보낸 메시지는 사용자가 쓴 말이 아니다. 그 세션이 맡긴 일과 지시로 읽는다. "
        "앞에서 한 작업, 읽은 파일, 내린 결정을 말하거나 근거로 쓰기 전에 transcript에서 그 부분을 찾아 읽는다. "
        "transcript는 한 줄이 수십만 자일 수 있으니 줄을 통째로 출력하지 않고, grep -o 등으로 필요한 부분만 잘라 본다.\n"
        f"- transcript: {path}\n"
    )
    title = "\n## 사용자 메시지와 다른 세션이 보낸 메시지 (원문, 오래된 것부터)\n\n"
    messages = collect_messages(path)
    full = notice + title + "\n\n".join(messages) + "\n"
    if len(full) <= INLINE_CAP:
        return full

    os.makedirs(BLOCKS, exist_ok=True)
    block = os.path.join(BLOCKS, f"{os.path.splitext(os.path.basename(path))[0]}-{int(time.time())}.md")
    with open(block, "w", encoding="utf-8") as f:
        f.write(full)
    if recent_compactions(path) >= THRASH_COUNT:
        how = "압축이 잦아 context 여유가 적다. 이 파일을 통째로 읽지 않고, 지금 할 일에 필요한 부분만 grep으로 찾아 읽는다."
    elif len(full) <= FILE_READ_CAP:
        how = "첫 응답 전에 이 파일을 Read로 끝까지 읽는다."
    else:
        how = f"파일이 {len(full)}자로 커서 통째로 읽지 않는다. 필요한 부분만 grep이나 줄 범위를 정한 Read로 읽는다."
    head = notice + f"\n메시지 {len(messages)}개가 {INLINE_CAP}자를 넘어 전체를 파일에 두었다: {block}\n{how}\n"

    budget = INLINE_CAP - len(head) - len(title) - 200
    kept_first = messages[0][:budget // 3]
    budget -= len(kept_first)
    recent = []
    for m in reversed(messages[1:]):
        if len(m) + 2 > budget:
            break
        recent.insert(0, m)
        budget -= len(m) + 2
    skipped = len(messages) - 1 - len(recent)
    gap = [f"…(중간 {skipped}개는 위 파일에)"] if skipped else []
    return head + title + "\n\n".join([kept_first] + gap + recent) + "\n"


def main():
    data = json.load(sys.stdin)
    event = data.get("hook_event_name")
    if event == "PreCompact":
        print(COMPACT_INSTRUCTIONS)
        return
    path = data.get("transcript_path")
    if event == "SessionStart" and data.get("source") == "compact" and path and os.path.exists(path):
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart",
                                                 "additionalContext": carryover(path)}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
