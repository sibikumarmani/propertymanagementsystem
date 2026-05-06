"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { notificationApi } from "@/lib/api";
import type { NotificationOptionsRecord, NotificationRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type FormState = {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  notificationType: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  priority: string;
  channels: string[];
};

const defaultOptions: NotificationOptionsRecord = {
  notificationTypes: ["RENT_DUE_REMINDER", "LEASE_EXPIRY_REMINDER", "MAINTENANCE_STATUS_UPDATE", "PAYMENT_CONFIRMATION", "APPROVAL_NOTIFICATION"],
  channels: ["IN_APP", "EMAIL", "SMS", "WHATSAPP"],
  priorities: ["LOW", "NORMAL", "HIGH", "URGENT"],
};

const defaults: FormState = {
  recipientName: "",
  recipientEmail: "",
  recipientPhone: "",
  notificationType: "RENT_DUE_REMINDER",
  title: "",
  message: "",
  entityType: "",
  entityId: "",
  priority: "NORMAL",
  channels: ["IN_APP"],
};

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function normalizeId(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

function label(value: string | null | undefined) {
  return value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set";
}

export default function NotificationsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [options, setOptions] = useState<NotificationOptionsRecord>(defaultOptions);
  const [draft, setDraft] = useState<FormState>(defaults);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const activeCompany = user?.activeCompany;

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
  const pendingProviderCount = useMemo(() => notifications.flatMap((item) => item.deliveries).filter((item) => item.status === "PENDING_PROVIDER").length, [notifications]);

  async function loadAll() {
    const [optionResponse, notificationResponse] = await Promise.all([
      notificationApi.getOptions(),
      notificationApi.getNotifications(),
    ]);
    setOptions(optionResponse.data.data as NotificationOptionsRecord);
    setNotifications((notificationResponse.data.data as Array<NotificationRecord & { id: number | string; companyId: number | string }>).map((item) => ({
      ...item,
      id: String(item.id),
      companyId: String(item.companyId),
      recipientUserId: normalizeId(item.recipientUserId),
      entityId: normalizeId(item.entityId),
      deliveries: (item.deliveries ?? []).map((delivery) => ({ ...delivery, id: String(delivery.id) })),
    })));
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadAll();
        if (!cancelled) setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) setError(readError(loadError, "Notifications could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  function openCreate() {
    setDraft(defaults);
    setFormError(null);
    setDrawerOpen(true);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      await notificationApi.createNotification({
        recipientName: draft.recipientName || null,
        recipientEmail: draft.recipientEmail || null,
        recipientPhone: draft.recipientPhone || null,
        notificationType: draft.notificationType,
        title: draft.title,
        message: draft.message,
        entityType: draft.entityType || null,
        entityId: draft.entityId ? Number(draft.entityId) : null,
        priority: draft.priority,
        channels: draft.channels,
      });
      await loadAll();
      setDrawerOpen(false);
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Notification could not be sent."));
    } finally {
      setIsSaving(false);
    }
  }

  async function runReminder(kind: "rent" | "lease") {
    try {
      if (kind === "rent") {
        await notificationApi.runRentDueReminders(7);
      } else {
        await notificationApi.runLeaseExpiryReminders(30);
      }
      await loadAll();
    } catch (reminderError: unknown) {
      setError(readError(reminderError, "Reminder run failed."));
    }
  }

  async function markRead(id: string) {
    try {
      await notificationApi.markRead(id);
      await loadAll();
    } catch (readError: unknown) {
      setError(readError instanceof Error ? readError.message : "Notification could not be marked read.");
    }
  }

  function toggleChannel(channel: string, checked: boolean) {
    setDraft((current) => ({
      ...current,
      channels: checked ? Array.from(new Set([...current.channels, channel])) : current.channels.filter((item) => item !== channel),
    }));
  }

  const columns = [
    { key: "title", header: "Notification", render: (row: NotificationRecord) => <div><div className="font-semibold">{row.title}</div><div className="text-xs text-[color:var(--foreground-muted)]">{label(row.notificationType)} · {label(row.priority)}</div></div> },
    { key: "recipient", header: "Recipient", render: (row: NotificationRecord) => row.recipientName || row.recipientEmail || row.recipientPhone || "Company users" },
    { key: "message", header: "Message", render: (row: NotificationRecord) => <span className="line-clamp-2">{row.message}</span> },
    { key: "deliveries", header: "Channels", render: (row: NotificationRecord) => row.deliveries.map((item) => `${label(item.channel)}: ${label(item.status)}`).join(", ") || "None" },
    { key: "read", header: "Read", render: (row: NotificationRecord) => row.read ? "Read" : <button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => markRead(row.id)}>Mark read</button> },
  ];

  return (
    <AppShell title="Notifications" subtitle="Email, SMS, WhatsApp, and in-app communication tracking">
      <div className="space-y-6">
        <CompanyContextBanner companyName={activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Insights</p>
            <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Track reminders, payment confirmations, maintenance updates, approvals, and delivery status across configured channels.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => runReminder("rent")}>Run Rent Due</button>
            <button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => runReminder("lease")}>Run Lease Expiry</button>
            <button className="btn-primary rounded-full px-5 py-2 text-sm font-semibold" onClick={openCreate}>Send Notification</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SectionCard title="Notifications"><p className="text-3xl font-semibold">{notifications.length}</p><p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Recorded communication events</p></SectionCard>
          <SectionCard title="Unread"><p className="text-3xl font-semibold">{unreadCount}</p><p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Open in-app notifications</p></SectionCard>
          <SectionCard title="Provider Pending"><p className="text-3xl font-semibold">{pendingProviderCount}</p><p className="mt-1 text-sm text-[color:var(--foreground-muted)]">SMS or WhatsApp awaiting provider setup</p></SectionCard>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <SectionCard title="Notification Register" action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadAll()}>Refresh</button>}>
          {isLoading ? <p className="text-sm text-[color:var(--foreground-muted)]">Loading notifications...</p> : <DataTable columns={columns} rows={notifications} />}
        </SectionCard>
      </div>

      <SidebarDrawer description="Send a one-off notification through selected channels." eyebrow="Notification" onClose={() => setDrawerOpen(false)} open={drawerOpen} title="Send Notification">
        <div className="space-y-5">
          {formError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</div> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput label="Type" options={options.notificationTypes} value={draft.notificationType} onChange={(value) => setDraft((current) => ({ ...current, notificationType: value }))} />
            <SelectInput label="Priority" options={options.priorities} value={draft.priority} onChange={(value) => setDraft((current) => ({ ...current, priority: value }))} />
            <TextInput label="Recipient Name" value={draft.recipientName} onChange={(value) => setDraft((current) => ({ ...current, recipientName: value }))} />
            <TextInput label="Recipient Email" value={draft.recipientEmail} onChange={(value) => setDraft((current) => ({ ...current, recipientEmail: value }))} />
            <TextInput label="Recipient Phone" value={draft.recipientPhone} onChange={(value) => setDraft((current) => ({ ...current, recipientPhone: value }))} />
            <TextInput label="Entity Type" value={draft.entityType} onChange={(value) => setDraft((current) => ({ ...current, entityType: value }))} />
          </div>
          <TextInput label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
          <TextareaInput label="Message" value={draft.message} onChange={(value) => setDraft((current) => ({ ...current, message: value }))} />
          <div>
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Channels</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.channels.map((channel) => (
                <label key={channel} className="flex items-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-semibold">
                  <input checked={draft.channels.includes(channel)} onChange={(event) => toggleChannel(channel, event.target.checked)} type="checkbox" />
                  {label(channel)}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-2 text-sm font-semibold" onClick={() => setDrawerOpen(false)} type="button">Cancel</button>
            <button className="btn-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={save} type="button">{isSaving ? "Sending..." : "Send"}</button>
          </div>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function TextInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-brand-strong">{inputLabel}<input className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}

function SelectInput({ label: inputLabel, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-brand-strong">{inputLabel}<select className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>;
}

function TextareaInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-brand-strong">{inputLabel}<textarea className="field mt-2 min-h-28 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}
