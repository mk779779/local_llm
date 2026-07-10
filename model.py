from pathlib import Path
from time import perf_counter
from llama_cpp import Llama, LlamaRAMCache

MODEL_PATH = Path.home() / "models" / "qwen3-14b-gguf" / "Qwen3-14B-Q5_K_M.gguf"


# n_ctx: Context window 2048
llm = Llama(
    model_path=str(MODEL_PATH),
    n_ctx=6000,
    n_gpu_layers=1,
    verbose=False,
)

llm.set_cache(LlamaRAMCache(capacity_bytes=2 * 1024**3))

STABLE_PREFIX = (
    """
You are a local LLM tutor.

Rules:
- Explain concepts clearly.
- Use concrete examples.
- Keep answers concise.

Technical background:
- KV cache stores attention keys and values.
- Prefill processes input tokens.
- Decode generates new tokens one at a time.
"""
    * 10
)


def run_model(question: str, stream: bool = False) -> None:

    prompt = STABLE_PREFIX + f"\nUser: {question}\n" + "Assistant:"

    started = perf_counter()

    output = llm(
        prompt,
        max_tokens=64,
        echo=False,
        stream=stream,
    )
    if stream:
        for chunk in output:
            text = chunk["choices"][0]["text"]
            print(text, end="", flush=True)
        print()

    else:
        print(output["choices"][0]["text"].strip())

    elapsed = perf_counter() - started
    print("time_spent", elapsed)


def main():
    run_model("What is KV cache?")
    run_model("What is KV cache?")
    run_model("What is decode?")


if __name__ == "__main__":
    main()
