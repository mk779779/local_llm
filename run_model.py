from model import LlamaService
from pathlib import Path
from contextlib import redirect_stderr
from datetime import datetime
from store import SQliteChatStore

log_dir = Path("logs")

run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
model_log = log_dir / f"llama_{run_id}.log"

db = SQliteChatStore()
llm = LlamaService(verbose=True)


def generate_with_logs(prompt: str) -> str:
    with model_log.open("a", encoding="utf-8") as stderr_files:
        with redirect_stderr(stderr_files):
            return llm.generate_text(prompt)


def save_chat(session_id: int, prompt: str, response: str):
    db.add_message(session_id, "user", prompt)
    db.add_message(session_id, "assistant", response)


def run_model(prompt: str, session_id: id):
    if not session_id:
        session_id = db.create_session()

    output = generate_with_logs
    response = output["choices"][0]["text"]
    save_chat(session_id, prompt, response)

    print("get_messages", db.get_messages(session_id))


run_model("what is 1+ 2")
