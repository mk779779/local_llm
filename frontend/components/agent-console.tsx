"use client";

import {
  ChevronDown,
  CirclePlus,
  Folder,
  Grid2x2,
  Mic,
  MoreHorizontal,
  MonitorSmartphone,
  Search,
  Send,
  SquarePen,
  FlaskConical,
  BookOpenText,
  Download,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

const sidebarItems = [
  { icon: Search, label: "Search" },
  { icon: Folder, label: "Projects" },
  { icon: Grid2x2, label: "Hub" },
];

const trainItems = [
  { icon: FlaskConical, label: "Train" },
  { icon: BookOpenText, label: "Recipes" },
  { icon: Download, label: "Export" },
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxTokens = 256;

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
      textareaRef.current.style.height = "56px";
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
          maxTokens,
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

  const isEmpty = messages.length === 0;

  return (
    <main className="app-shell min-h-screen text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/80 bg-white/78 lg:flex lg:flex-col">
          <div className="flex items-center justify-between px-5 py-7">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl font-semibold text-white shadow-sm">
                A
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-border bg-white p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Sidebar mode"
            >
              <MonitorSmartphone className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setError("");
              }}
              className="flex w-full items-center gap-3 rounded-[1.7rem] bg-slate-100 px-6 py-3.5 text-left text-[1.1rem] font-medium text-slate-950 transition hover:bg-slate-200/80"
            >
              <SquarePen className="h-4 w-4" />
              New chat
            </button>
          </div>

          <nav className="mt-4 space-y-1 px-3">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl px-5 py-3 text-left text-[1.1rem] text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-10 px-5 text-sm text-muted-foreground">
            <p className="mb-5 text-[1.05rem] font-medium text-slate-500">Train</p>
            <div className="space-y-1">
              {trainItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-5 py-3 text-left text-[1.1rem] text-slate-700 transition hover:bg-white hover:text-slate-950"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 px-5 text-sm text-muted-foreground">
            <p className="mb-5 text-[1.05rem] font-medium text-slate-500">Recents</p>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-[1rem]">No chats yet</p>
              ) : (
                messages
                  .filter((message) => message.role === "user")
                  .slice(-3)
                  .reverse()
                  .map((message) => (
                    <div
                      key={message.id}
                      className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700"
                    >
                      <p className="truncate">{message.content}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-8 py-6 lg:px-10">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-[2rem] font-medium tracking-tight text-slate-950"
            >
              Select model
              <ChevronDown className="h-5 w-5 text-slate-500" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-white hover:text-foreground"
                aria-label="More"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-white hover:text-foreground"
                aria-label="Window mode"
              >
                <MonitorSmartphone className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div
            ref={transcriptRef}
            className={cn(
              "flex-1 overflow-y-auto px-6 pb-8 lg:px-10",
              isEmpty ? "flex items-center justify-center" : "",
            )}
          >
            {isEmpty ? (
              <div className="flex w-full max-w-[1220px] flex-col items-center justify-center pb-24">
                <Composer
                  prompt={prompt}
                  onPromptChange={resizeTextarea}
                  onSubmit={() => void submitPrompt(prompt)}
                  isPending={isPending}
                  textareaRef={textareaRef}
                />
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6 pb-40 pt-4">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-3xl px-5 py-4 shadow-sm",
                      message.role === "user"
                        ? "ml-auto bg-emerald-500 text-white"
                        : "bg-white text-slate-900",
                    )}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-7">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "mt-3 text-xs",
                        message.role === "user" ? "text-emerald-50/90" : "text-slate-400",
                      )}
                    >
                      {message.timestamp}
                    </p>
                  </article>
                ))}

                {isPending ? (
                  <div className="max-w-[85%] rounded-3xl bg-white px-5 py-4 text-slate-500 shadow-sm">
                    Thinking...
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {!isEmpty ? (
            <div className="sticky bottom-0 px-6 pb-8 pt-4 lg:px-10">
              <div className="mx-auto max-w-[1220px]">
                <Composer
                  prompt={prompt}
                  onPromptChange={resizeTextarea}
                  onSubmit={() => void submitPrompt(prompt)}
                  isPending={isPending}
                  textareaRef={textareaRef}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Composer({
  prompt,
  onPromptChange,
  onSubmit,
  isPending,
  textareaRef,
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <form
      className="w-full rounded-[2.2rem] bg-white px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-end gap-3">
        <button
          type="button"
          className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Add attachment"
        >
          <CirclePlus className="h-6 w-6" />
        </button>

        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Ask anything"
          className="min-h-[56px] max-h-56 resize-none border-none bg-transparent px-0 py-3 text-[1.15rem] text-slate-900 shadow-none focus-visible:ring-0"
        />

        <button
          type="button"
          className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Voice input"
        >
          <Mic className="h-5 w-5" />
        </button>

        <Button
          type="submit"
          disabled={isPending || !prompt.trim()}
          className="mb-1 h-12 w-12 rounded-full border-none bg-emerald-300 p-0 text-white shadow-none hover:bg-emerald-400"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
