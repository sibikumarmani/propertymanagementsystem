"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { accountingApi } from "@/lib/api";
import type { AccountingEntryRecord, AccountingReportRowRecord, AccountingSummaryRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

const reportTypes = [
  ["RENT_RECEIVABLE", "Rent receivable"],
  ["OUTSTANDING", "Outstanding"],
  ["COLLECTION", "Collection"],
  ["EXPENSE", "Expense"],
  ["PROPERTY_PNL", "Profit and loss by property"],
  ["TENANT_LEDGER", "Tenant ledger"],
  ["OWNER_STATEMENT", "Owner statement"],
  ["VENDOR_OUTSTANDING", "Vendor outstanding"],
];

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}
function id(value: string | number | null | undefined) { return value == null ? null : String(value); }
function label(value: string | null | undefined) { return value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set"; }
function money(value: number | null | undefined) { return (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }

export default function AccountingPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [summary, setSummary] = useState<AccountingSummaryRecord | null>(null);
  const [entries, setEntries] = useState<AccountingEntryRecord[]>([]);
  const [reportType, setReportType] = useState("RENT_RECEIVABLE");
  const [reportRows, setReportRows] = useState<AccountingReportRowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (type = reportType) => {
    const [summaryResponse, entryResponse, reportResponse] = await Promise.all([
      accountingApi.getSummary(),
      accountingApi.getEntries(),
      accountingApi.getReport(type),
    ]);
    setSummary(summaryResponse.data.data as AccountingSummaryRecord);
    setEntries((entryResponse.data.data as Array<AccountingEntryRecord & { id: number | string; companyId: number | string; sourceId: number | string }>).map((entry) => ({
      ...entry,
      id: String(entry.id),
      companyId: String(entry.companyId),
      sourceId: String(entry.sourceId),
      partyId: id(entry.partyId),
      propertyId: id(entry.propertyId),
      unitId: id(entry.unitId),
    })));
    setReportRows(reportResponse.data.data as AccountingReportRowRecord[]);
  }, [reportType]);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) return;
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadAll();
        if (!cancelled) setError(null);
      } catch (loadError) {
        if (!cancelled) setError(readError(loadError, "Accounting data could not be loaded. Post accounting entries first if this is a new database."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient, loadAll]);

  async function postAccounting() {
    try {
      setIsLoading(true);
      await accountingApi.post();
      await loadAll();
      setError(null);
    } catch (postError) {
      setError(readError(postError, "Accounting posting failed."));
    } finally {
      setIsLoading(false);
    }
  }

  async function switchReport(type: string) {
    try {
      setReportType(type);
      const response = await accountingApi.getReport(type);
      setReportRows(response.data.data as AccountingReportRowRecord[]);
    } catch (reportError) {
      setError(readError(reportError, "Report could not be loaded."));
    }
  }

  const entryColumns = [
    { key: "entryDate", header: "Date" },
    { key: "accountType", header: "Account", render: (row: AccountingEntryRecord) => <div><div className="font-semibold">{label(row.accountType)}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.sourceType} · {row.sourceReference}</div></div> },
    { key: "party", header: "Party", render: (row: AccountingEntryRecord) => row.partyName ?? label(row.partyType) },
    { key: "propertyName", header: "Property", render: (row: AccountingEntryRecord) => row.propertyName ?? "Not mapped" },
    { key: "debitAmount", header: "Debit", render: (row: AccountingEntryRecord) => money(row.debitAmount) },
    { key: "creditAmount", header: "Credit", render: (row: AccountingEntryRecord) => money(row.creditAmount) },
  ];
  const reportColumns = [
    { key: "label", header: "Report Line" },
    { key: "debitAmount", header: "Debit", render: (row: AccountingReportRowRecord) => money(row.debitAmount) },
    { key: "creditAmount", header: "Credit", render: (row: AccountingReportRowRecord) => money(row.creditAmount) },
    { key: "balanceAmount", header: "Balance", render: (row: AccountingReportRowRecord) => money(row.balanceAmount) },
  ];

  return (
    <AppShell title="Accounting" subtitle="Ledgers, receivables, liabilities, reconciliation, and property reports">
      <div className="space-y-6">
        <CompanyContextBanner companyName={user?.activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Leasing</p>
            <h1 className="text-3xl font-semibold tracking-tight">Accounting</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Post rent, receipts, deposits, expenses, tax, owner shares, and vendor bills into accounting ledgers and operational reports.</p>
          </div>
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" onClick={postAccounting}>Post Accounting</button>
        </div>
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-4">
          <Metric title="Rent Receivable" value={summary?.rentReceivable} />
          <Metric title="Advance Received" value={summary?.advanceReceived} />
          <Metric title="Deposit Liability" value={summary?.securityDepositLiability} />
          <Metric title="Net Profit" value={summary?.netProfit} />
        </div>
        <SectionCard title="Reports">
          <div className="mb-4 flex flex-wrap gap-2">
            {reportTypes.map(([type, name]) => <button key={type} className={`rounded-full px-4 py-2 text-sm font-semibold ${reportType === type ? "btn-primary" : "btn-secondary"}`} onClick={() => switchReport(type)}>{name}</button>)}
          </div>
          <DataTable columns={reportColumns} rows={reportRows.map((row) => ({ ...row, id: row.key }))} />
        </SectionCard>
        <SectionCard title="Ledger Entries" action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadAll()}>Refresh</button>}>
          {isLoading ? <p className="text-sm text-[color:var(--foreground-muted)]">Loading accounting...</p> : <DataTable columns={entryColumns} rows={entries} />}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Metric({ title, value }: { title: string; value?: number | null }) {
  return <SectionCard title={title}><p className="text-2xl font-semibold">{money(value)}</p></SectionCard>;
}
