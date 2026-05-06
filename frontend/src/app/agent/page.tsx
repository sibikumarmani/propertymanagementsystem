"use client";

import axios from "axios";
import { Bot, LoaderCircle, SendHorizontal, Wrench } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/common/section-card";
import { agentApi } from "@/lib/api";
import type { AgentActionRecord, AgentChatHistoryMessage } from "@/lib/types";

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AgentActionRecord[];
};

function readError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.message ?? error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return "The agent request could not be completed.";
}

export default function AgentPage() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = useMemo<AgentChatHistoryMessage[]>(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSubmitting) {
      return;
    }

    const nextUserMessage: ChatEntry = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, nextUserMessage]);
    setDraft("");
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await agentApi.chat({
        message,
        history,
      });

      const payload = response.data.data;
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.message,
          actions: payload.actions,
        },
      ]);
    } catch (submitError: unknown) {
      setError(readError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Agent Workspace"
      subtitle="Use natural language to create companies, branches, properties, units, tenants, owners, vendors, and users through the backend APIs."
    >
      <div className="grid gap-6">
        <SectionCard title="Assistant" eyebrow="Guided entry">
          <div className="grid gap-4">
            <p className="text-sm text-[color:var(--foreground-subtle)]">
              The agent uses your current login session and calls the protected backend endpoints on your behalf.
            </p>
            <div className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface-soft)] p-4">
              {messages.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center text-sm text-[color:var(--foreground-subtle)]">
                  <Bot className="h-8 w-8 text-brand" />
                  <p>Try: Create a company called Sunrise Estates, then add a branch in Chennai and a residential property with 24 units.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-[22px] px-4 py-3 text-sm ${
                        message.role === "user"
                          ? "ml-auto max-w-[80%] bg-brand text-[color:var(--on-brand)]"
                          : "max-w-[92%] border border-[color:var(--line)] bg-white/75 text-[color:var(--foreground)] dark:bg-white/5"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.actions && message.actions.length > 0 ? (
                        <div className="mt-3 grid gap-2 border-t border-[color:var(--line)] pt-3">
                          {message.actions.map((action, index) => (
                            <div key={`${message.id}-action-${index}`} className="rounded-2xl bg-[color:var(--surface-muted)] px-3 py-2">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">
                                <Wrench className="h-3.5 w-3.5" />
                                <span>{action.toolName}</span>
                                <span className={action.success ? "text-emerald-600" : "text-rose-600"}>
                                  {action.success ? "Success" : "Failed"}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[color:var(--foreground)]">{action.summary}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form className="grid gap-3" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">Instruction</span>
                <textarea
                  className="min-h-32 rounded-[22px] border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand-border)] focus:ring-2 focus:ring-[color:var(--brand-soft-strong)] dark:bg-white/5"
                  placeholder="Describe the records you want created and any exact codes, names, or IDs the agent should use."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !draft.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-[color:var(--on-brand)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  <span>{isSubmitting ? "Working..." : "Send to agent"}</span>
                </button>
              </div>
            </form>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
