"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { leaseApi, rentBillingApi, tenantApi } from "@/lib/api";
import type { InvoiceRecord, LeaseRecord, ReceiptRecord, RentBillingOptionsRecord, RentScheduleRecord, SecurityDepositRecord, TenantRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type Tab = "schedules" | "invoices" | "receipts" | "deposits";
type DrawerMode = "schedule" | "invoice" | "receipt" | "deposit" | "deposit-action";

const fallbackOptions: RentBillingOptionsRecord = {
  scheduleStatuses: ["PENDING", "INVOICED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
  invoiceStatuses: ["DRAFT", "APPROVED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
  invoiceTypes: ["RENT", "MAINTENANCE", "UTILITY", "DEPOSIT", "PENALTY", "OTHER"],
  paymentModes: ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "CARD", "ONLINE_PAYMENT_GATEWAY"],
};

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function prettify(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase()) : "Not set";
}

function toNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null | undefined) {
  if (value == null) {
    return "0.00";
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
}

function normalizeIds<T extends { id: number | string; companyId: number | string }>(rows: T[]) {
  return rows.map((row) => ({ ...row, id: String(row.id), companyId: String(row.companyId) }));
}

export default function RentBillingPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [tab, setTab] = useState<Tab>("schedules");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("schedule");
  const [schedules, setSchedules] = useState<RentScheduleRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [deposits, setDeposits] = useState<SecurityDepositRecord[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [options, setOptions] = useState<RentBillingOptionsRecord>(fallbackOptions);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({ leaseId: "", fromDate: "", toDate: "", lateFeeAmount: "0" });
  const [invoiceDraft, setInvoiceDraft] = useState({
    invoiceNumber: "",
    invoiceType: "RENT",
    leaseId: "",
    tenantId: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    subtotalAmount: "",
    taxAmount: "0",
    discountAmount: "0",
    lateFeeAmount: "0",
    status: "DRAFT",
    description: "",
  });
  const [receiptDraft, setReceiptDraft] = useState({
    receiptNumber: "",
    invoiceId: "",
    tenantId: "",
    receiptDate: new Date().toISOString().slice(0, 10),
    paymentMode: "CASH",
    amount: "",
    referenceNumber: "",
    remarks: "",
  });
  const [depositDraft, setDepositDraft] = useState({ leaseId: "", depositNumber: "", remarks: "" });
  const [depositAction, setDepositAction] = useState<{ action: "collect" | "adjust" | "refund"; deposit: SecurityDepositRecord | null; amount: string; referenceNumber: string; remarks: string }>({
    action: "collect",
    deposit: null,
    amount: "",
    referenceNumber: "",
    remarks: "",
  });

  async function loadData() {
    const [scheduleResponse, invoiceResponse, receiptResponse, depositResponse, leaseResponse, tenantResponse, optionResponse] = await Promise.all([
      rentBillingApi.getSchedules(),
      rentBillingApi.getInvoices(),
      rentBillingApi.getReceipts(),
      rentBillingApi.getSecurityDeposits(),
      leaseApi.getLeases(),
      tenantApi.getTenants(),
      rentBillingApi.getOptions(),
    ]);
    setSchedules(
      normalizeIds(scheduleResponse.data.data as Array<RentScheduleRecord & { id: number | string; companyId: number | string }>).map((row) => ({
        ...row,
        leaseId: String(row.leaseId),
        tenantId: String(row.tenantId),
        propertyId: String(row.propertyId),
        unitId: String(row.unitId),
        invoiceId: row.invoiceId == null ? null : String(row.invoiceId),
      })),
    );
    setInvoices(
      normalizeIds(invoiceResponse.data.data as Array<InvoiceRecord & { id: number | string; companyId: number | string }>).map((row) => ({
        ...row,
        leaseId: row.leaseId == null ? null : String(row.leaseId),
        rentScheduleId: row.rentScheduleId == null ? null : String(row.rentScheduleId),
        tenantId: String(row.tenantId),
        propertyId: row.propertyId == null ? null : String(row.propertyId),
        unitId: row.unitId == null ? null : String(row.unitId),
      })),
    );
    setReceipts(
      normalizeIds(receiptResponse.data.data as Array<ReceiptRecord & { id: number | string; companyId: number | string }>).map((row) => ({
        ...row,
        invoiceId: row.invoiceId == null ? null : String(row.invoiceId),
        tenantId: String(row.tenantId),
      })),
    );
    setDeposits(
      normalizeIds(depositResponse.data.data as Array<SecurityDepositRecord & { id: number | string; companyId: number | string }>).map((row) => ({
        ...row,
        leaseId: String(row.leaseId),
        tenantId: String(row.tenantId),
        propertyId: String(row.propertyId),
        unitId: String(row.unitId),
        depositInvoiceId: row.depositInvoiceId == null ? null : String(row.depositInvoiceId),
        depositReceiptId: row.depositReceiptId == null ? null : String(row.depositReceiptId),
      })),
    );
    setLeases(
      normalizeIds(leaseResponse.data.data as Array<LeaseRecord & { id: number | string; companyId: number | string }>).map((lease) => ({
        ...lease,
        tenantId: String(lease.tenantId),
        propertyId: String(lease.propertyId),
        unitId: String(lease.unitId),
        renewedFromLeaseId: lease.renewedFromLeaseId == null ? null : String(lease.renewedFromLeaseId),
      })),
    );
    setTenants(normalizeIds(tenantResponse.data.data as Array<TenantRecord & { id: number | string; companyId: number | string }>));
    setOptions({
      scheduleStatuses: optionResponse.data.data.scheduleStatuses ?? fallbackOptions.scheduleStatuses,
      invoiceStatuses: optionResponse.data.data.invoiceStatuses ?? fallbackOptions.invoiceStatuses,
      invoiceTypes: optionResponse.data.data.invoiceTypes ?? fallbackOptions.invoiceTypes,
      paymentModes: optionResponse.data.data.paymentModes ?? fallbackOptions.paymentModes,
    });
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadData();
        if (!cancelled) {
          setError(null);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Rent and billing data could not be loaded."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  function openDrawer(mode: DrawerMode) {
    setDrawerMode(mode);
    setFormError(null);
    setIsDrawerOpen(true);
  }

  async function handleGenerateSchedules() {
    if (!scheduleDraft.leaseId) {
      setFormError("Lease is required.");
      return;
    }
    try {
      setIsSaving(true);
      await rentBillingApi.generateSchedules({
        leaseId: Number(scheduleDraft.leaseId),
        fromDate: scheduleDraft.fromDate || null,
        toDate: scheduleDraft.toDate || null,
        lateFeeAmount: toNumber(scheduleDraft.lateFeeAmount),
      });
      setIsDrawerOpen(false);
      await loadData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Rent schedule could not be generated."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateInvoice() {
    const subtotalAmount = toNumber(invoiceDraft.subtotalAmount);
    if (!invoiceDraft.invoiceNumber || !invoiceDraft.tenantId || subtotalAmount == null) {
      setFormError("Invoice number, tenant, and subtotal are required.");
      return;
    }
    const lease = leases.find((item) => item.id === invoiceDraft.leaseId);
    try {
      setIsSaving(true);
      await rentBillingApi.createInvoice({
        invoiceNumber: invoiceDraft.invoiceNumber,
        invoiceType: invoiceDraft.invoiceType,
        leaseId: invoiceDraft.leaseId ? Number(invoiceDraft.leaseId) : null,
        tenantId: Number(invoiceDraft.tenantId),
        propertyId: lease ? Number(lease.propertyId) : null,
        unitId: lease ? Number(lease.unitId) : null,
        invoiceDate: invoiceDraft.invoiceDate,
        dueDate: invoiceDraft.dueDate,
        subtotalAmount,
        taxAmount: toNumber(invoiceDraft.taxAmount),
        discountAmount: toNumber(invoiceDraft.discountAmount),
        lateFeeAmount: toNumber(invoiceDraft.lateFeeAmount),
        status: invoiceDraft.status,
        description: invoiceDraft.description || null,
      });
      setIsDrawerOpen(false);
      await loadData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Invoice could not be created."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateReceipt() {
    const amount = toNumber(receiptDraft.amount);
    if (!receiptDraft.receiptNumber || !receiptDraft.tenantId || amount == null) {
      setFormError("Receipt number, tenant, and amount are required.");
      return;
    }
    try {
      setIsSaving(true);
      await rentBillingApi.createReceipt({
        receiptNumber: receiptDraft.receiptNumber,
        invoiceId: receiptDraft.invoiceId ? Number(receiptDraft.invoiceId) : null,
        tenantId: Number(receiptDraft.tenantId),
        receiptDate: receiptDraft.receiptDate,
        paymentMode: receiptDraft.paymentMode,
        amount,
        referenceNumber: receiptDraft.referenceNumber || null,
        remarks: receiptDraft.remarks || null,
      });
      setIsDrawerOpen(false);
      await loadData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Receipt could not be posted."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateDeposit() {
    if (!depositDraft.leaseId || !depositDraft.depositNumber) {
      setFormError("Lease and deposit number are required.");
      return;
    }
    try {
      setIsSaving(true);
      await rentBillingApi.createSecurityDeposit({ leaseId: Number(depositDraft.leaseId), depositNumber: depositDraft.depositNumber, remarks: depositDraft.remarks || null });
      setIsDrawerOpen(false);
      await loadData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Security deposit could not be created."));
    } finally {
      setIsSaving(false);
    }
  }

  function openDepositAction(action: "collect" | "adjust" | "refund", deposit: SecurityDepositRecord) {
    setDrawerMode("deposit-action");
    setDepositAction({ action, deposit, amount: action === "collect" ? String(deposit.depositAmount - deposit.collectedAmount) : String(deposit.refundableAmount), referenceNumber: "", remarks: "" });
    setFormError(null);
    setIsDrawerOpen(true);
  }

  async function handleDepositAction() {
    if (!depositAction.deposit) return;
    const amount = toNumber(depositAction.amount);
    if (amount == null) {
      setFormError("Amount is required.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = { amount, referenceNumber: depositAction.referenceNumber || null, remarks: depositAction.remarks || null };
      if (depositAction.action === "collect") {
        await rentBillingApi.collectSecurityDeposit(depositAction.deposit.id, payload);
      } else if (depositAction.action === "adjust") {
        await rentBillingApi.adjustSecurityDeposit(depositAction.deposit.id, payload);
      } else {
        await rentBillingApi.refundSecurityDeposit(depositAction.deposit.id, payload);
      }
      setIsDrawerOpen(false);
      await loadData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Deposit action could not be posted."));
    } finally {
      setIsSaving(false);
    }
  }

  async function invoiceWorkflow(invoice: InvoiceRecord, action: "approve" | "send" | "cancel") {
    try {
      if (action === "approve") {
        await rentBillingApi.approveInvoice(invoice.id);
      } else if (action === "send") {
        await rentBillingApi.sendInvoice(invoice.id);
      } else {
        await rentBillingApi.cancelInvoice(invoice.id);
      }
      await loadData();
    } catch (workflowError: unknown) {
      setError(readError(workflowError, "Invoice action failed."));
    }
  }

  return (
    <AppShell title="Rent and billing management" subtitle="Generate rent schedules from leases, create invoices, record receipts, and track outstanding tenant balances.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["schedules", "invoices", "receipts", "deposits"] as const).map((item) => (
          <button key={item} className={`rounded-full border px-4 py-2 text-sm font-semibold ${tab === item ? "bg-[color:var(--accent)] text-white" : "border-line"}`} onClick={() => setTab(item)} type="button">
            {prettify(item)}
          </button>
        ))}
      </div>

      {tab === "schedules" ? (
        <SectionCard title="Rent schedule" eyebrow="Rent Billing">
          <div className="mb-4 flex justify-end">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={() => openDrawer("schedule")} type="button">Generate schedule</button>
          </div>
          {isLoading ? <Loading label="Loading schedules..." /> : (
            <DataTable rows={schedules} columns={[
              { key: "scheduleNumber", header: "Schedule" },
              { key: "leaseNumber", header: "Lease", render: (row) => row.leaseNumber || "Not set" },
              { key: "tenantDisplayName", header: "Tenant", render: (row) => row.tenantDisplayName || "Not set" },
              { key: "billingPeriodStart", header: "Period", render: (row) => `${row.billingPeriodStart} to ${row.billingPeriodEnd}` },
              { key: "dueDate", header: "Due date" },
              { key: "rentAmount", header: "Rent", render: (row) => money(row.rentAmount) },
              { key: "dueAmount", header: "Due", render: (row) => money(row.dueAmount) },
              { key: "status", header: "Status", render: (row) => prettify(row.status) },
              { key: "actions", header: "Actions", render: (row) => row.invoiceId ? "Invoiced" : <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={async () => { await rentBillingApi.createInvoiceFromSchedule(row.id); await loadData(); }} type="button">Generate invoice</button> },
            ]} />
          )}
        </SectionCard>
      ) : null}

      {tab === "invoices" ? (
        <SectionCard title="Invoice management" eyebrow="Rent Billing">
          <div className="mb-4 flex justify-end">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={() => openDrawer("invoice")} type="button">Create invoice</button>
          </div>
          {isLoading ? <Loading label="Loading invoices..." /> : (
            <DataTable rows={invoices} columns={[
              { key: "invoiceNumber", header: "Invoice" },
              { key: "invoiceType", header: "Type", render: (row) => prettify(row.invoiceType) },
              { key: "tenantDisplayName", header: "Tenant", render: (row) => row.tenantDisplayName || "Not set" },
              { key: "dueDate", header: "Due date" },
              { key: "totalAmount", header: "Total", render: (row) => money(row.totalAmount) },
              { key: "paidAmount", header: "Paid", render: (row) => money(row.paidAmount) },
              { key: "dueAmount", header: "Due", render: (row) => money(row.dueAmount) },
              { key: "status", header: "Status", render: (row) => prettify(row.status) },
              { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2">{row.status === "DRAFT" ? <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => void invoiceWorkflow(row, "approve")} type="button">Approve</button> : null}{row.status === "APPROVED" ? <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => void invoiceWorkflow(row, "send")} type="button">Send</button> : null}{!["PAID", "CANCELLED"].includes(row.status) ? <button className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => void invoiceWorkflow(row, "cancel")} type="button">Cancel</button> : null}</div> },
            ]} />
          )}
        </SectionCard>
      ) : null}

      {tab === "receipts" ? (
        <SectionCard title="Receipt management" eyebrow="Rent Billing">
          <div className="mb-4 flex justify-end">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={() => openDrawer("receipt")} type="button">Record receipt</button>
          </div>
          {isLoading ? <Loading label="Loading receipts..." /> : (
            <DataTable rows={receipts} columns={[
              { key: "receiptNumber", header: "Receipt" },
              { key: "invoiceNumber", header: "Invoice", render: (row) => row.invoiceNumber || "Advance" },
              { key: "tenantDisplayName", header: "Tenant", render: (row) => row.tenantDisplayName || "Not set" },
              { key: "receiptDate", header: "Date" },
              { key: "paymentMode", header: "Mode", render: (row) => prettify(row.paymentMode) },
              { key: "amount", header: "Amount", render: (row) => money(row.amount) },
              { key: "advanceAmount", header: "Advance", render: (row) => money(row.advanceAmount) },
              { key: "status", header: "Status", render: (row) => prettify(row.status) },
            ]} />
          )}
        </SectionCard>
      ) : null}

      {tab === "deposits" ? (
        <SectionCard title="Security deposit management" eyebrow="Rent Billing">
          <div className="mb-4 flex justify-end">
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={() => openDrawer("deposit")} type="button">Create deposit ledger</button>
          </div>
          {isLoading ? <Loading label="Loading deposits..." /> : (
            <DataTable rows={deposits} columns={[
              { key: "depositNumber", header: "Deposit" },
              { key: "leaseNumber", header: "Lease", render: (row) => row.leaseNumber || "Not set" },
              { key: "tenantDisplayName", header: "Tenant", render: (row) => row.tenantDisplayName || "Not set" },
              { key: "depositAmount", header: "Deposit", render: (row) => money(row.depositAmount) },
              { key: "collectedAmount", header: "Collected", render: (row) => money(row.collectedAmount) },
              { key: "adjustedAmount", header: "Adjusted", render: (row) => money(row.adjustedAmount) },
              { key: "refundedAmount", header: "Refunded", render: (row) => money(row.refundedAmount) },
              { key: "refundableAmount", header: "Refundable", render: (row) => money(row.refundableAmount) },
              { key: "status", header: "Status", render: (row) => prettify(row.status) },
              { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2"><button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={async () => { await rentBillingApi.generateDepositInvoice(row.id); await loadData(); }} type="button">Invoice</button><button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => openDepositAction("collect", row)} type="button">Collect</button><button className="rounded-full border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700" onClick={() => openDepositAction("adjust", row)} type="button">Adjust</button><button className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700" onClick={() => openDepositAction("refund", row)} type="button">Refund</button></div> },
            ]} />
          )}
        </SectionCard>
      ) : null}

      <SidebarDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={drawerMode === "schedule" ? "Generate rent schedule" : drawerMode === "invoice" ? "Create invoice" : drawerMode === "receipt" ? "Record receipt" : drawerMode === "deposit" ? "Create security deposit" : `${prettify(depositAction.action)} deposit`} description="Rent billing transactions are company-scoped and linked back to lease, tenant, and unit context.">
        {formError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
        {drawerMode === "schedule" ? <ScheduleForm draft={scheduleDraft} leases={leases} onChange={setScheduleDraft} onSubmit={handleGenerateSchedules} saving={isSaving} /> : null}
        {drawerMode === "invoice" ? <InvoiceForm draft={invoiceDraft} leases={leases} options={options} onChange={setInvoiceDraft} onSubmit={handleCreateInvoice} saving={isSaving} tenants={tenants} /> : null}
        {drawerMode === "receipt" ? <ReceiptForm draft={receiptDraft} invoices={invoices} options={options} onChange={setReceiptDraft} onSubmit={handleCreateReceipt} saving={isSaving} tenants={tenants} /> : null}
        {drawerMode === "deposit" ? <DepositForm draft={depositDraft} leases={leases} onChange={setDepositDraft} onSubmit={handleCreateDeposit} saving={isSaving} /> : null}
        {drawerMode === "deposit-action" ? <DepositActionForm draft={depositAction} onChange={setDepositAction} onSubmit={handleDepositAction} saving={isSaving} /> : null}
      </SidebarDrawer>
    </AppShell>
  );
}

function Loading({ label }: { label: string }) {
  return <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">{label}</div>;
}

function Field({ label, onChange, type = "text", value }: { label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></label>;
}

function ScheduleForm({ draft, leases, onChange, onSubmit, saving }: { draft: { leaseId: string; fromDate: string; toDate: string; lateFeeAmount: string }; leases: LeaseRecord[]; onChange: (draft: { leaseId: string; fromDate: string; toDate: string; lateFeeAmount: string }) => void; onSubmit: () => void; saving: boolean }) {
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}><label className="grid gap-2 text-sm font-medium">Lease<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, leaseId: event.target.value })} value={draft.leaseId}><option value="">Select lease</option>{leases.map((lease) => <option key={lease.id} value={lease.id}>{lease.leaseNumber} - {lease.tenantDisplayName}</option>)}</select></label><Field label="From date" onChange={(value) => onChange({ ...draft, fromDate: value })} type="date" value={draft.fromDate} /><Field label="To date" onChange={(value) => onChange({ ...draft, toDate: value })} type="date" value={draft.toDate} /><Field label="Late fee amount" onChange={(value) => onChange({ ...draft, lateFeeAmount: value })} type="number" value={draft.lateFeeAmount} /><button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Generating..." : "Generate schedule"}</button></form>;
}

function InvoiceForm({ draft, leases, onChange, onSubmit, options, saving, tenants }: { draft: typeof initialInvoiceDraft; leases: LeaseRecord[]; onChange: (draft: typeof initialInvoiceDraft) => void; onSubmit: () => void; options: RentBillingOptionsRecord; saving: boolean; tenants: TenantRecord[] }) {
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}><Field label="Invoice number" onChange={(value) => onChange({ ...draft, invoiceNumber: value })} value={draft.invoiceNumber} /><label className="grid gap-2 text-sm font-medium">Invoice type<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, invoiceType: event.target.value })} value={draft.invoiceType}>{options.invoiceTypes.map((type) => <option key={type} value={type}>{prettify(type)}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Lease<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => { const lease = leases.find((item) => item.id === event.target.value); onChange({ ...draft, leaseId: event.target.value, tenantId: lease?.tenantId ?? draft.tenantId, subtotalAmount: lease?.rentAmount == null ? draft.subtotalAmount : String(lease.rentAmount) }); }} value={draft.leaseId}><option value="">Manual / no lease</option>{leases.map((lease) => <option key={lease.id} value={lease.id}>{lease.leaseNumber} - {lease.tenantDisplayName}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Tenant<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, tenantId: event.target.value })} value={draft.tenantId}><option value="">Select tenant</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName}</option>)}</select></label><Field label="Invoice date" onChange={(value) => onChange({ ...draft, invoiceDate: value })} type="date" value={draft.invoiceDate} /><Field label="Due date" onChange={(value) => onChange({ ...draft, dueDate: value })} type="date" value={draft.dueDate} /><Field label="Subtotal" onChange={(value) => onChange({ ...draft, subtotalAmount: value })} type="number" value={draft.subtotalAmount} /><Field label="Tax" onChange={(value) => onChange({ ...draft, taxAmount: value })} type="number" value={draft.taxAmount} /><Field label="Discount" onChange={(value) => onChange({ ...draft, discountAmount: value })} type="number" value={draft.discountAmount} /><Field label="Late fee" onChange={(value) => onChange({ ...draft, lateFeeAmount: value })} type="number" value={draft.lateFeeAmount} /><label className="grid gap-2 text-sm font-medium">Description<textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, description: event.target.value })} value={draft.description} /></label><button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : "Create invoice"}</button></form>;
}

const initialInvoiceDraft = {
  invoiceNumber: "",
  invoiceType: "RENT",
  leaseId: "",
  tenantId: "",
  invoiceDate: "",
  dueDate: "",
  subtotalAmount: "",
  taxAmount: "0",
  discountAmount: "0",
  lateFeeAmount: "0",
  status: "DRAFT",
  description: "",
};

function ReceiptForm({ draft, invoices, onChange, onSubmit, options, saving, tenants }: { draft: typeof initialReceiptDraft; invoices: InvoiceRecord[]; onChange: (draft: typeof initialReceiptDraft) => void; onSubmit: () => void; options: RentBillingOptionsRecord; saving: boolean; tenants: TenantRecord[] }) {
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}><Field label="Receipt number" onChange={(value) => onChange({ ...draft, receiptNumber: value })} value={draft.receiptNumber} /><label className="grid gap-2 text-sm font-medium">Invoice<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => { const invoice = invoices.find((item) => item.id === event.target.value); onChange({ ...draft, invoiceId: event.target.value, tenantId: invoice?.tenantId ?? draft.tenantId, amount: invoice?.dueAmount == null ? draft.amount : String(invoice.dueAmount) }); }} value={draft.invoiceId}><option value="">Advance receipt</option>{invoices.filter((invoice) => !["PAID", "CANCELLED"].includes(invoice.status)).map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - Due {money(invoice.dueAmount)}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Tenant<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, tenantId: event.target.value })} value={draft.tenantId}><option value="">Select tenant</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName}</option>)}</select></label><Field label="Receipt date" onChange={(value) => onChange({ ...draft, receiptDate: value })} type="date" value={draft.receiptDate} /><label className="grid gap-2 text-sm font-medium">Payment mode<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, paymentMode: event.target.value })} value={draft.paymentMode}>{options.paymentModes.map((mode) => <option key={mode} value={mode}>{prettify(mode)}</option>)}</select></label><Field label="Amount" onChange={(value) => onChange({ ...draft, amount: value })} type="number" value={draft.amount} /><Field label="Reference number" onChange={(value) => onChange({ ...draft, referenceNumber: value })} value={draft.referenceNumber} /><label className="grid gap-2 text-sm font-medium">Remarks<textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, remarks: event.target.value })} value={draft.remarks} /></label><button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Posting..." : "Post receipt"}</button></form>;
}

function DepositForm({ draft, leases, onChange, onSubmit, saving }: { draft: typeof initialDepositDraft; leases: LeaseRecord[]; onChange: (draft: typeof initialDepositDraft) => void; onSubmit: () => void; saving: boolean }) {
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}><label className="grid gap-2 text-sm font-medium">Lease<select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => { const lease = leases.find((item) => item.id === event.target.value); onChange({ ...draft, leaseId: event.target.value, depositNumber: lease ? `${lease.leaseNumber}-DEP` : draft.depositNumber }); }} value={draft.leaseId}><option value="">Select lease</option>{leases.map((lease) => <option key={lease.id} value={lease.id}>{lease.leaseNumber} - {lease.tenantDisplayName} - Deposit {money(lease.securityDepositAmount)}</option>)}</select></label><Field label="Deposit number" onChange={(value) => onChange({ ...draft, depositNumber: value })} value={draft.depositNumber} /><label className="grid gap-2 text-sm font-medium">Remarks<textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, remarks: event.target.value })} value={draft.remarks} /></label><button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Saving..." : "Create deposit ledger"}</button></form>;
}

function DepositActionForm({ draft, onChange, onSubmit, saving }: { draft: { action: "collect" | "adjust" | "refund"; deposit: SecurityDepositRecord | null; amount: string; referenceNumber: string; remarks: string }; onChange: (draft: { action: "collect" | "adjust" | "refund"; deposit: SecurityDepositRecord | null; amount: string; referenceNumber: string; remarks: string }) => void; onSubmit: () => void; saving: boolean }) {
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void onSubmit(); }}><div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 text-sm text-[color:var(--foreground-muted)]">Refundable balance: {money(draft.deposit?.refundableAmount ?? 0)}</div><Field label="Amount" onChange={(value) => onChange({ ...draft, amount: value })} type="number" value={draft.amount} /><Field label="Reference number" onChange={(value) => onChange({ ...draft, referenceNumber: value })} value={draft.referenceNumber} /><label className="grid gap-2 text-sm font-medium">Remarks<textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange({ ...draft, remarks: event.target.value })} value={draft.remarks} /></label><button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">{saving ? "Posting..." : `${prettify(draft.action)} deposit`}</button></form>;
}

const initialReceiptDraft = {
  receiptNumber: "",
  invoiceId: "",
  tenantId: "",
  receiptDate: "",
  paymentMode: "CASH",
  amount: "",
  referenceNumber: "",
  remarks: "",
};

const initialDepositDraft = {
  leaseId: "",
  depositNumber: "",
  remarks: "",
};
