from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from model import LlamaService

app = FastAPI()
llm = LlamaService()


class GenerateRequest(BaseModel):
    question: str
    max_tokens: int = 128


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/generate")
def generate(req: GenerateRequest):

    output = llm.generate_text(req.prompt, req.max_tokens)
    return {"output:", output}
