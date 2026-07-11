from dataclasses import dataclass, field
from pathlib import Path

from llama_cpp import Llama, LlamaRAMCache

MODEL_PATH = Path.home() / "models" / "qwen3-14b-gguf" / "Qwen3-14B-Q5_K_M.gguf"
SYSTEM_PROMPT_PATH = Path(__file__).parent / "prompts" / "system.md"


@dataclass
class LlamaService:
    model_path: Path = MODEL_PATH
    n_ctx: int = 6000
    n_gpu_layers: int = 1
    verbose: bool = False
    system_prompt: str = ""
    llm: Llama = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.llm = Llama(
            model_path=str(self.model_path),
            n_ctx=self.n_ctx,
            n_gpu_layers=self.n_gpu_layers,
            verbose=self.verbose,
        )

        self.llm.set_cache(LlamaRAMCache(capacity_bytes=2 * 1024**3))

    def build_prompt(self, user_prompt: str) -> str:
        return f"{self.system_prompt}\n\nUser: {user_prompt}\nAssistant:"

    def generate_text(self, prompt: str, max_tokens: int = 200) -> str:
        output = self.llm(
            self.build_prompt(prompt),
            max_tokens=max_tokens,
            echo=False,
            stream=False,
        )

        return output["choices"][0]["text"].strip()

    def stream_text(self, prompt: str, max_tokens: int = 200):
        output = self.llm(
            self.build_prompt(prompt),
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
    print(llm.generate_text("What is KV cache?"))


if __name__ == "__main__":
    main()
