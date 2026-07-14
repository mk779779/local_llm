from model import LlamaService
from pathlib import Path
from contextlib import redirect_stderr
from datetime import datetime
from store import SQliteChatStore

log_dir = Path("logs")

run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
model_log = log_dir / f"llama_{run_id}.log"

db = SQliteChatStore()

with model_log.open("a", encoding="utf-8") as stderr_files:
    with redirect_stderr(stderr_files):
        llm = LlamaService(verbose=True)
        prompt = "what is 2 + 2"
        output = llm.generate_text(prompt)
        print("type:", type(output))
        print("output:", output)


text = output["choices"][0]["text"]
print("text:", text)
print("text_type:", type(text))
session_id = db.create_session()
print("session_id_type", type(session_id))
db.add_message(session_id, "user", prompt)
db.add_message(session_id, "assistant", text)

print("get_messages", db.get_messages(session_id))
