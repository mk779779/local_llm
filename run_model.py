from model import LlamaService
from pathlib import Path
from contextlib import redirect_stderr
from datetime import datetime

log_dir = Path("logs")

run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
model_log = log_dir / f"llama_{run_id}.log"

with model_log.open("a", encoding="utf-8") as stderr_files:
    with redirect_stderr(stderr_files):
        llm = LlamaService(verbose=True)
        prompt = "what is 2 + 2"
        output = llm.generate_text(prompt)
