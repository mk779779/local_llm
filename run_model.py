from model import LlamaService
from pathlib import Path
from contextlib import redirect_stderr
from datetime import datetime
import json
from store import SQliteChatStore

log_dir = Path("logs")

run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
model_log = log_dir / f"llama_{run_id}.log"

db = SQliteChatStore()
llm = LlamaService(verbose=False)


def generate_with_logs(prompt: str) -> str:
    with model_log.open("a", encoding="utf-8") as stderr_files:
        with redirect_stderr(stderr_files):
            return llm.generate_text(prompt)


def save_chat(session_id: int, prompt: str, response: str):
    db.add_message(session_id, "user", prompt)
    db.add_message(session_id, "assistant", response)


def run_model_logs(prompt: str, session_id: str | None = None):
    if not session_id:
        session_id = db.create_session()

    response = generate_with_logs(prompt)
    save_chat(session_id, prompt, response)

    print("get_messages", db.get_messages(session_id))


def run_model(prompt: str | list[dict], session_id: str | None = None):
    # if not session_id:
    #     session_id = db.create_session()

    response = llm.generate_text(prompt)
    return response

    # save_chat(session_id, prompt, response)

    # print("get_messages", db.get_messages(session_id))


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


TOOLS = {
    "create_session": create_session,
    "get_messages": get_messages,
}


# def get_tool_calls()


def runner(prompt: str):
    messages = [{"role": "user", "content": prompt}]

    while True:
        output = run_model(messages)
        choice = output["choices"][0]
        message = choice["message"]
        finish_reason = choice["finish_reason"]

        if finish_reason == "stop":
            return message.get("content")

        if finish_reason != "tool_calls":
            print("non_tool_call:")
            return finish_reason

        messages.append(message)

        print(messages)

        tool_calls = message.get("tool_calls")
        if tool_calls:
            for tool_call in tool_calls:
                function_call = tool_call["function"]
                function_name = function_call["name"].strip().rstrip(":")
                arguments = function_call.get("arguments")
                tool = TOOLS.get(function_name)
                if not tool:
                    tool_response = {"error": f"Unknown tool: {function_name}"}
                else:
                    tool_response = tool(arguments)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": json.dumps(tool_response, default=str),
                    }
                )
            continue

        function_call = message["function_call"]
        function_name = function_call["name"].strip().rstrip(":")
        arguments = function_call.get("arguments")
        tool = TOOLS.get(function_name)
        if not tool:
            tool_response = {"error": f"Unknown tool: {function_name}"}
        else:
            tool_response = tool(arguments)

        messages.append(
            {
                "role": "function",
                "name": function_name,
                "content": json.dumps(tool_response, default=str),
            }
        )


runner("get session")
