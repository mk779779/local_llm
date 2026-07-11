"use client";

import { Bot, Cpu, Radio, SendHorizonal, Shield, Sparkles, Trash2, User, Zap } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

const quickPrompts = [
  "Plan a stealth data-exfiltration workflow for an internal docs agent.",
  "Summarize a long incident report into a clean executive briefing.",
  "Design a tool-using research agent with memory, retries, and safety checks.",
];

const starterMessages: Message[] = [
  {
    id: "boot-sequence",
    role: "assistant",
    content:
      "Afterlife Link is online. Drop a target, a question, or an objective and I’ll spin up a route through the noise.",
    timestamp: "Booted now",
  },
];

const telemetry = [
  { label: "Model bridge", value: "FastAPI relay" },
  { label: "City node", value: "Night City East" },
  { label: "Threat profile", value: "Low / monitored" },
];

function createMessage(role: Message["role"], content: string): Message {
  return {
    id: `${role}-${crypto.randomUUID()}`,
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function AgentConsole() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [prompt, setPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState("256");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function resizeTextarea(nextValue: string) {
    setPrompt(nextValue);

    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }

  async function submitPrompt(content: string) {
    const trimmed = content.trim();

    if (!trimmed || isPending) {
      return;
    }

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];

    setError("");
    setPrompt("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "88px";
    }

    startTransition(() => {
      setMessages(nextMessages);
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
          maxTokens: Number(maxTokens) || 256,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || !data.message) {
        throw new Error(data.error || "The relay failed to return a response.");
      }

      startTransition(() => {
        setMessages((current) => [...current, createMessage("assistant", data.message!)]);
      });
    } catch (caughtError) {
      const detail =
        caughtError instanceof Error ? caughtError.message : "Unexpected runtime failure.";

      setError(detail);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-70" />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="animate-rise rounded-3xl border border-primary/30 bg-slate-950/50 p-4 shadow-neon backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Afterlife Link</Badge>
                <Badge variant="secondary" className="animate-pulseLine">
                  Agent Console
                </Badge>
              </div>
              <div>
                <h1 className="font-display text-3xl uppercase tracking-[0.3em] text-primary sm:text-4xl">
                  Night City Relay
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  A cyberpunk 2077 inspired frontend for your local LLM agent stack, with a Shadcn-style
                  component system and a clean bridge to FastAPI.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {telemetry.map((item) => (
                <div
                  key={item.label}
                  className="clip-corner border border-cyan-400/25 bg-slate-950/70 px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/70">
                    {item.label}
                  </p>
                  <p className="mt-2 font-display text-sm uppercase tracking-[0.18em] text-slate-100">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="scanline animate-rise">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg text-primary">Mission Deck</CardTitle>
                </div>
                <CardDescription>
                  Focus the agent before you dive into a run.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickPrompts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void submitPrompt(item)}
                    className="w-full rounded-xl border border-border/80 bg-background/40 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="scanline animate-rise [animation-delay:120ms]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-cyan-300" />
                  <CardTitle className="text-lg text-cyan-300">Runtime</CardTitle>
                </div>
                <CardDescription>Live knobs for the chat loop.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="max-tokens"
                    className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Max tokens
                  </label>
                  <Input
                    id="max-tokens"
                    inputMode="numeric"
                    value={maxTokens}
                    onChange={(event) => setMaxTokens(event.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Radio className="h-4 w-4 text-cyan-300" />
                      Relay status
                    </span>
                    <span className="text-cyan-300">Armed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Response mode
                    </span>
                    <span className="text-primary">Direct</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-fuchsia-300" />
                      Persona shell
                    </span>
                    <span className="text-fuchsia-300">Netrunner</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <Card className="scanline animate-rise [animation-delay:180ms]">
            <CardHeader className="border-b border-border/70">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl text-primary">Conversation Rail</CardTitle>
                  <CardDescription>
                    Talk to the agent, inspect the transcript, and keep the run moving.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="muted">{messages.length} transcript nodes</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMessages(starterMessages);
                      setError("");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
              <div
                ref={transcriptRef}
                className="max-h-[56vh] space-y-4 overflow-y-auto pr-1"
              >
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "clip-corner animate-rise rounded-2xl border p-4",
                      message.role === "assistant"
                        ? "mr-6 border-cyan-400/30 bg-cyan-400/8"
                        : "ml-6 border-primary/30 bg-primary/10",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.28em] text-slate-100">
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4 text-cyan-300" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                        {message.role === "assistant" ? "Link AI" : "Operator"}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {message.timestamp}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100/95">
                      {message.content}
                    </p>
                  </article>
                ))}

                {isPending ? (
                  <article className="clip-corner mr-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/8 p-4">
                    <div className="mb-3 flex items-center gap-2 font-display text-xs uppercase tracking-[0.28em] text-cyan-300">
                      <Bot className="h-4 w-4" />
                      Link AI
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Processing the shard...
                    </div>
                  </article>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <form
                className="space-y-4 rounded-2xl border border-primary/20 bg-slate-950/50 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitPrompt(prompt);
                }}
              >
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(event) => resizeTextarea(event.target.value)}
                  placeholder="Feed the relay an objective, file summary request, or agent task..."
                  className="max-h-72 resize-none"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Secure rail routed through <code>/api/chat</code>
                  </p>
                  <Button type="submit" disabled={isPending || !prompt.trim()}>
                    <SendHorizonal className="h-4 w-4" />
                    Dispatch
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
