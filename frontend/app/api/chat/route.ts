import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const BACKEND_URL = process.env.LLM_BACKEND_URL ?? "http://127.0.0.1:8000";

const SYSTEM_PROMPT = [
  "You are Afterlife Link, a tactical AI copilot inside a cyberpunk operations console.",
  "Be concise, competent, and helpful.",
  "Prefer actionable answers and call out risks when relevant.",
].join(" ");

function buildPrompt(messages: ChatMessage[]) {
  const transcript = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  return `${SYSTEM_PROMPT}\n\n${transcript}\n\nASSISTANT:`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: ChatMessage[];
      maxTokens?: number;
    };

    const messages = body.messages?.filter((message) => message.content.trim()) ?? [];
    const maxTokens = Math.min(Math.max(body.maxTokens ?? 256, 64), 1024);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: buildPrompt(messages),
        max_tokens: maxTokens,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        {
          error: `Backend request failed (${response.status}). ${detail || "Check the FastAPI server."}`,
        },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as unknown;
    const output = extractOutput(payload);

    if (!output.trim()) {
      return NextResponse.json(
        { error: "Backend returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: output.trim() });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown connection error.";

    return NextResponse.json(
      {
        error: `Unable to reach the LLM backend at ${BACKEND_URL}. ${detail}`,
      },
      { status: 502 },
    );
  }
}

function extractOutput(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    const textEntry = payload.find((entry) => typeof entry === "string" && entry !== "output:");
    return typeof textEntry === "string" ? textEntry : "";
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;

    if (typeof data.output === "string") {
      return data.output;
    }

    if (typeof data["output:"] === "string") {
      return data["output:"];
    }
  }

  return "";
}
