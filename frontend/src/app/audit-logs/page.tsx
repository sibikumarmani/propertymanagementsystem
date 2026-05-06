"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { auditLogApi } from "@/lib/api";
import type { AuditLogRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}

function normalizeId(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

function preview(value: string | null) {
  if (!value) return "None";
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

export default function AuditLogsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const response = await auditLogApi.getAuditLogs();
    setLogs((response.data.data as Array<AuditLogRecord & { id: number | string }>).map((item) => ({
      ...item,
      id: String(item.id),
      companyId: normalizeId(item.companyId),
      userId: normalizeId(item.userId),
      entityId: normalizeId(item.entityId),
    })));
  }, []);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) return;
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadAll();
        if (!cancelled) setError(null);
      } catch (loadError) {
        if (!cancelled) setError(readError(loadError, "Audit logs could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient, loadAll]);

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((log) => [log.userName, log.action, log.screen, log.entityType, log.ipAddress, log.oldValue, log.newValue].some((value) => value?.toLowerCase().includes(needle)));
  }, [logs, query]);

  return (
    <AppShell title="Audit Logs" subtitle="Trace important actions by user, screen, value changes, date/time, and IP address">
      <div className="space-y-6">
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
        <SectionCard
          title="Audit Trail"
          eyebrow="Administration"
          action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadAll()}>Refresh</button>}
        >
          <div className="mb-4">
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setQuery(event.target.value)} placeholder="Search user, action, screen, IP, old/new value" value={query} />
          </div>
          {isLoading ? (
            <p className="text-sm text-[color:var(--foreground-muted)]">Loading audit logs...</p>
          ) : (
            <DataTable
              rows={filteredLogs}
              columns={[
                { key: "actionAt", header: "Date & Time", render: (row) => new Date(row.actionAt).toLocaleString() },
                { key: "userName", header: "User", render: (row) => row.userName ?? "System" },
                { key: "action", header: "Action" },
                { key: "screen", header: "Screen" },
                { key: "entityType", header: "Entity", render: (row) => `${row.entityType ?? "N/A"}${row.entityId ? ` #${row.entityId}` : ""}` },
                { key: "oldValue", header: "Old Value", render: (row) => preview(row.oldValue) },
                { key: "newValue", header: "New Value", render: (row) => preview(row.newValue) },
                { key: "ipAddress", header: "IP Address", render: (row) => row.ipAddress ?? "Not captured" },
              ]}
            />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
