# llm_local

Small local LLM playground using `llama-cpp-python`, a GGUF model, and a simple tool-calling runner. The backend code loads a local Qwen GGUF model, sends chat messages to it, and can execute Python tools such as `list_sessions`.

## Setup

Install Python deps:

```bash
poetry install
```

Make sure the model exists here:

```text
~/models/qwen3-14b-gguf/Qwen3-14B-Q5_K_M.gguf
```

Run the model smoke test:

```bash
poetry run python model.py
```

Run the tool-calling loop:

```bash
poetry run python run_model.py
```

## Frontend

The Next.js UI lives in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Next.js.
