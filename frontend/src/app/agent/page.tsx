"use client";

import axios from "axios";
import { Bot, Database, LoaderCircle, PlusCircle, SendHorizontal, Wrench } from "lucide-react";
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

const quickPrompts = [
  {
    label: "Core setup",
    prompt:
      "Add core setup data: create a company, branch, property, building, floor, and unit. Ask me for any missing required codes, names, dates, or amounts before creating.",
  },
  {
    label: "Tenant flow",
    prompt:
      "Add tenant flow data: create a tenant, lease, rent schedule, invoice, receipt, and security deposit. First list existing units and tenants if IDs are needed.",
  },
  {
    label: "Operations",
    prompt:
      "Add operations data: create a maintenance request, work order, preventive maintenance schedule, inspection, asset, and asset service history. Ask for missing linked record IDs.",
  },
  {
    label: "Utilities",
    prompt:
      "Add utility data: create a utility type, meter reading, and utility bill. List existing properties, units, tenants, and utility types if IDs are needed.",
  },
  {
    label: "Purchase",
    prompt:
      "Add purchase and expense data: create a purchase request, purchase order, vendor invoice, and expense. Resolve vendor, property, and unit IDs first.",
  },
  {
    label: "Admin",
    prompt:
      "Add admin data: create a role, user, notification, document, and approval workflow config. Ask for password and linked record details before creating.",
  },
];

const supportedModules = [
  "Companies",
  "Branches",
  "Properties",
  "Buildings",
  "Floors",
  "Units",
  "Tenants",
  "Leases",
  "Rent billing",
  "Maintenance",
  "Utilities",
  "Assets",
  "Inspections",
  "Purchase expenses",
  "Vendors",
  "Owners",
  "Documents",
  "Notifications",
  "Approvals",
  "Roles",
  "Users",
];

function readError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const detail = record.message ?? record.detail ?? record.error;
      if (typeof detail === "string" && detail.trim()) {
        return detail;
      }
      if (record.data && typeof record.data === "object") {
        const dataRecord = record.data as Record<string, unknown>;
        const nestedDetail = dataRecord.message ?? dataRecord.detail ?? dataRecord.error;
        if (typeof nestedDetail === "string" && nestedDetail.trim()) {
          return nestedDetail;
        }
      }
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
      subtitle="Use natural language to create records across the property-management workspace through the backend APIs."
    >
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-[28px] border border-[#0f5f6f]/20 bg-[#12384a] text-white shadow-[0_24px_70px_rgba(15,37,54,0.18)] dark:border-white/10 dark:bg-[#07131c]">
          <div className="border-b border-white/10 bg-[#0d2a38] px-5 py-5 dark:bg-[#091923]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">Chatbot actions</p>
            <h2 className="display-font mt-2 text-xl font-semibold text-white">Add data</h2>
            <p className="mt-2 text-sm leading-6 text-cyan-50/80">
              Pick a starter, then edit the instruction before sending it to the agent.
            </p>
          </div>

          <div className="grid gap-5 p-5">
            <div className="grid gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setDraft(item.prompt)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:border-cyan-200/60 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
                >
                  <PlusCircle className="h-4 w-4 shrink-0 text-cyan-200" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                <Database className="h-3.5 w-3.5" />
                <span>Supported data</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {supportedModules.map((module) => (
                  <span key={module} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-cyan-50">
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <SectionCard title="Assistant" eyebrow="Guided entry">
          <div className="grid gap-4">
            <p className="text-sm text-[color:var(--foreground-subtle)]">
              The agent uses your current login session and calls the protected backend endpoints on your behalf.
            </p>
            <div className="rounded-[24px] border border-[#b7d6de] bg-[#eef8fa] p-4 shadow-inner dark:border-white/10 dark:bg-[#081722]">
              {messages.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center text-sm text-[#38576a] dark:text-cyan-50/72">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f5f6f] text-white shadow-sm dark:bg-cyan-300 dark:text-[#07131c]">
                    <Bot className="h-7 w-7" />
                  </div>
                  <p className="max-w-xl">
                    Try: Add a complete property setup with company, branch, property, building, floor, unit, tenant, lease, invoice, and receipt.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-[22px] px-4 py-3 text-sm shadow-sm ${
                        message.role === "user"
                          ? "ml-auto max-w-[80%] border border-[#094b58] bg-[#0f5f6f] text-white dark:border-cyan-200/40 dark:bg-cyan-300 dark:text-[#07131c]"
                          : "max-w-[92%] border border-[#c8dfe5] bg-white text-[#183247] dark:border-white/10 dark:bg-[#102536] dark:text-[#e6f0f5]"
                      }`}
                    >
                      <div
                        className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          message.role === "user" ? "text-white/70 dark:text-[#07131c]/70" : "text-[#647f91] dark:text-cyan-100/70"
                        }`}
                      >
                        {message.role === "user" ? "You" : "Assistant"}
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.actions && message.actions.length > 0 ? (
                        <div className="mt-3 grid gap-2 border-t border-[#d6e8ed] pt-3 dark:border-white/10">
                          {message.actions.map((action, index) => (
                            <div key={`${message.id}-action-${index}`} className="rounded-2xl bg-[#edf5f7] px-3 py-2 dark:bg-white/10">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#647f91] dark:text-cyan-100/72">
                                <Wrench className="h-3.5 w-3.5" />
                                <span>{action.toolName}</span>
                                <span className={action.success ? "text-emerald-600" : "text-rose-600"}>
                                  {action.success ? "Success" : "Failed"}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-[#183247] dark:text-[#e6f0f5]">{action.summary}</p>
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
                  className="min-h-32 rounded-[22px] border border-[#b7d6de] bg-white px-4 py-3 text-sm text-[#183247] outline-none transition placeholder:text-[#71879a] focus:border-[#0f7c8f] focus:ring-2 focus:ring-[#bce8eb] dark:border-white/10 dark:bg-[#0c1c29] dark:text-[#e6f0f5] dark:placeholder:text-[#8fa8b7] dark:focus:border-cyan-300/70 dark:focus:ring-cyan-300/20"
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0f5f6f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b5362] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-300 dark:text-[#07131c] dark:hover:bg-cyan-200"
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
