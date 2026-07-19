from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from llama_cpp import Llama, LlamaRAMCache

MODEL_PATH = Path.home() / "models" / "qwen3-14b-gguf" / "Qwen3-14B-Q5_K_M.gguf"
SYSTEM_PROMPT_PATH = Path(__file__).parent / "prompts" / "system.md"


def list_sessions() -> list[dict[str, Any]]:
    return [{"id": 1, "title": "first_session"}]


TOOLS: dict[str, Callable[..., Any]] = {"list_sessions": list_sessions}


TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "list_sessions",
            "description": "return all saved sessions",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    }
]


@dataclass
class LlamaService:
    model_path: Path = MODEL_PATH
    n_ctx: int = 6000
    n_gpu_layers: int = 99
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

    def build_messages(self, user_prompt: str) -> list[dict[str, Any]]:
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def generate_response(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        max_tokens: int = 200,
    ) -> dict[str, Any]:
        return self.llm.create_chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=0,
            stream=False,
            tools=tools,
        )


def main():

    llm = LlamaService()
    messages = llm.build_messages("list all sessions")
    response = llm.generate_response(messages, tools=TOOL_SCHEMAS)
    print("response:", response)


if __name__ == "__main__":
    main()
