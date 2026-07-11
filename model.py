from pathlib import Path
from llama_cpp import Llama, LlamaRAMCache
from dataclasses import dataclass, field

MODEL_PATH = Path.home() / "models" / "qwen3-14b-gguf" / "Qwen3-14B-Q5_K_M.gguf"


# n_ctx: Context window 2048
llm = Llama(
    model_path=str(MODEL_PATH),
    n_ctx=6000,
    n_gpu_layers=1,
    verbose=False,
)

llm.set_cache(LlamaRAMCache(capacity_bytes=2 * 1024**3))


@dataclass
class LlamaService:
    model_path: Path = (
        Path.home() / "models" / "qwen3-14b-gguf" / "Qwen3-14B-Q5_K_M.gguf"
    )

    n_ct: int = 6000
    n_gpu_layers: int = 1
    verbose: bool = False
    llm: Llama = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.llm = Llama(
            model_path=str(MODEL_PATH),
            n_ctx=6000,
            n_gpu_layers=1,
            verbose=False,
        )

    def generate_text(self, prompt: str, max_tokens: int = 200) -> str:
        output = llm(prompt, max_tokens=max_tokens, echo=False, stream=False)

        return output["choices"][0]["text"].strip()

    def stream_text(self, prompt: str, max_tokens: int = 200):
        output = llm(
            prompt,
            max_tokens=max_tokens,
            echo=False,
            stream=True,
        )
        for chunk in output:
            text = chunk["choices"][0]["text"]
            if text:
                yield text


def main():

    llm = LlamaService()
    llm.stream_text("What is KV cache?")


if __name__ == "__main__":
    main()
