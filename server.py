from pathlib import Path

from llama_cpp import Llama

MODEL_PATH = Path.home() / "models" / "qwen3-14b-gguf" / "Qwen3-14B-Q5_K_M.gguf"


# n_ctx: Context window 2048
llm = Llama(
    model_path=str(MODEL_PATH),
    n_ctx=2048,
    verbose=False,
)


def run_model(stream):
    output = llm(
        "List the planets in the solar system.",
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


run_model(False)
