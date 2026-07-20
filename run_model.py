from model import LlamaService
from pathlib import Path
from contextlib import redirect_stderr
from datetime import datetime
import json
from store import SQliteChatStore
import re
from typing import Any
from model import LlamaService, TOOL_SCHEMAS, TOOLS

log_dir = Path("logs")

run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
model_log = log_dir / f"llama_{run_id}.log"

db = SQliteChatStore()


TOOL_CALL_RE = re.compile(r"<tool_call>\s*(.*?)\s*</tool_call>", re.DOTALL)


# def generate_with_logs(prompt: str) -> str:
#     with model_log.open("a", encoding="utf-8") as stderr_files:
#         with redirect_stderr(stderr_files):
#             return llm.generate_text(prompt)


def save_chat(session_id: int, prompt: str, response: str):
    db.add_message(session_id, "user", prompt)
    db.add_message(session_id, "assistant", response)


# def run_model_logs(prompt: str, session_id: str | None = None):
#     if not session_id:
#         session_id = db.create_session()

#     response = generate_with_logs(prompt)
#     save_chat(session_id, prompt, response)

#     print("get_messages", db.get_messages(session_id))


# def run_model(prompt: str | list[dict], session_id: str | None = None):
#     # if not session_id:
#     #     session_id = db.create_session()

#     response = llm.generate_text(prompt)
#     return response

#     # save_chat(session_id, prompt, response)

#     # print("get_messages", db.get_messages(session_id))


def parse_tool_arguments(arguments):
    if isinstance(arguments, dict):
        return arguments
    if not arguments:
        return {}
    if isinstance(arguments, str):
        try:
            return json.loads(arguments)
        except json.JSONDecodeError:
            return {"raw": arguments}
    return {"raw": arguments}


def create_session(args):
    arguments = parse_tool_arguments(args)
    session_id = db.create_session(arguments.get("title"))
    return {"session_id": session_id}


def get_messages(args):
    arguments = parse_tool_arguments(args)
    session_id = arguments.get("session_id")
    if not session_id:
        return {"error": "session_id is required"}
    return {"messages": db.get_messages(session_id)}


def extract_text_tool_call(content: str) -> dict[str]:
    match = TOOL_CALL_RE.search(content)
    if not match:
        return None

    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        return {"name": "", "arguments": {}, "error": f"Invalid tool JSON: {exc}"}


def normalize_tool_name(name: str) -> str:
    return name.strip().rstrip(":")


def parse_arguments(arguments: Any) -> Any:

    if isinstance(arguments, str):
        return json.loads(arguments)
    return arguments


def call_tool(name: str, arguments: Any) -> Any:
    tool_name = normalize_tool_name(name)
    tool = TOOLS.get(tool_name)

    arguments = parse_arguments(arguments)

    if isinstance(arguments, dict):
        return tool(**arguments)

    return tool(arguments)


def runner(prompt: str, max_iterations: int = 5):
    llm = LlamaService(verbose=False)
    messages = llm.build_messages(prompt)

    for _ in range(max_iterations):
        response = llm.generate_response(messages, tools=TOOL_SCHEMAS)
        message = response["choices"][0]["message"]
        content = message.get("content") or ""

        structured_tool_calls = message.get("tool_calls")
        if structured_tool_calls:
            messages.append(message)

            for tool_call in structured_tool_calls:
                function = tool_call["function"]
                result = call_tool(function["name"], function.get("arguments"))

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": json.dumps(result),
                    }
                )

            continue

        text_tool_call = extract_text_tool_call(content)

        if text_tool_call:
            result = call_tool(
                text_tool_call["name"], text_tool_call.get("arguments", {})
            )

            messages.append({"role": "assistant", "content": content})
            messages.append({"role": "tool", "content": json.dumps(result)})
            continue
    print("messages:", messages)
    return content


def main() -> None:
    print(runner("Use Python to calculate the sum of the squares from 1 to 10."))


if __name__ == "__main__":
    main()
