"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { accountingApi, approvalApi, documentApi, leaseApi, maintenanceApi, notificationApi, ownerApi, propertyApi, rentBillingApi, tenantApi, unitApi } from "@/lib/api";
import type { AccountingEntryRecord, ApprovalRequestRecord, DocumentRecord, InvoiceRecord, LeaseRecord, MaintenanceRequestRecord, NotificationRecord, OwnerRecord, PropertyRecord, ReceiptRecord, TenantRecord, UnitRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}
function id(value: string | number | null | undefined) { return value == null ? null : String(value); }
function count(value: number) { return new Intl.NumberFormat("en-US").format(value); }
function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function sameEmail(a?: string | null, b?: string | null) { return !!a && !!b && a.toLowerCase() === b.toLowerCase(); }
function isOpen(status?: string | null) { return !!status && !["CLOSED", "COMPLETED", "CANCELLED", "PAID", "APPROVED"].includes(status); }

type DashboardData = {
  properties: PropertyRecord[];
  units: UnitRecord[];
  tenants: TenantRecord[];
  owners: OwnerRecord[];
  leases: LeaseRecord[];
  invoices: InvoiceRecord[];
  receipts: ReceiptRecord[];
  maintenance: MaintenanceRequestRecord[];
  documents: DocumentRecord[];
  notifications: NotificationRecord[];
  approvals: ApprovalRequestRecord[];
  accounting: AccountingEntryRecord[];
};

const emptyData: DashboardData = { properties: [], units: [], tenants: [], owners: [], leases: [], invoices: [], receipts: [], maintenance: [], documents: [], notifications: [], approvals: [], accounting: [] };

async function safeData<T>(request: Promise<{ data: { data: T } }>, fallback: T): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch {
    return fallback;
  }
}

export default function DashboardPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [data, setData] = useState<DashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roles = user?.roles ?? [];
  const isTenant = roles.some((role) => role.toUpperCase().includes("TENANT"));
  const isOwner = roles.some((role) => role.toUpperCase().includes("OWNER"));
  const userEmail = user?.email ?? null;

  const loadAll = useCallback(async () => {
    const [properties, units, tenants, owners, leases, invoices, receipts, maintenance, documents, notifications, approvals, accounting] = await Promise.all([
      safeData(propertyApi.getProperties(), []),
      safeData(unitApi.getUnits(), []),
      safeData(tenantApi.getTenants(), []),
      safeData(ownerApi.getOwners(), []),
      safeData(leaseApi.getLeases(), []),
      safeData(rentBillingApi.getInvoices(), []),
      safeData(rentBillingApi.getReceipts(), []),
      safeData(maintenanceApi.getRequests(), []),
      safeData(documentApi.getDocuments(), []),
      safeData(notificationApi.getMyNotifications(), []),
      safeData(approvalApi.getRequests(), []),
      safeData(accountingApi.getEntries(), []),
    ]);
    setData({
      properties: (properties as Array<PropertyRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: id(item.branchId), propertyManagerUserId: id(item.propertyManagerUserId), documentAttachments: item.documentAttachments ?? [] })),
      units: (units as Array<UnitRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: item.photoAttachments ?? [], documentAttachments: item.documentAttachments ?? [] })),
      tenants: (tenants as Array<TenantRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })),
      owners: (owners as Array<OwnerRecord & { id: number | string; propertyIds: Array<number | string> }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyIds: item.propertyIds.map(String) })),
      leases: (leases as Array<LeaseRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), renewedFromLeaseId: id(item.renewedFromLeaseId) })),
      invoices: (invoices as Array<InvoiceRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), leaseId: id(item.leaseId), rentScheduleId: id(item.rentScheduleId), propertyId: id(item.propertyId), unitId: id(item.unitId) })),
      receipts: (receipts as Array<ReceiptRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), invoiceId: id(item.invoiceId) })),
      maintenance: (maintenance as Array<MaintenanceRequestRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), assignedVendorId: id(item.assignedVendorId), assignedUserId: id(item.assignedUserId), attachments: item.attachments ?? [] })),
      documents: (documents as Array<DocumentRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: id(item.propertyId), unitId: id(item.unitId), tenantId: id(item.tenantId), leaseId: id(item.leaseId), vendorId: id(item.vendorId), invoiceId: id(item.invoiceId), previousDocumentId: id(item.previousDocumentId) })),
      notifications: (notifications as Array<NotificationRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), recipientUserId: id(item.recipientUserId), entityId: id(item.entityId), deliveries: item.deliveries ?? [] })),
      approvals: (approvals as Array<ApprovalRequestRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), entityId: String(item.entityId), requestedBy: id(item.requestedBy), history: item.history ?? [] })),
      accounting: (accounting as Array<AccountingEntryRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), partyId: id(item.partyId), propertyId: id(item.propertyId), unitId: id(item.unitId), sourceId: String(item.sourceId) })),
    });
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
        if (!cancelled) setError(readError(loadError, "Dashboard data could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient, loadAll]);

  const currentTenant = useMemo(() => data.tenants.find((tenant) => sameEmail(tenant.email, userEmail)) ?? null, [data.tenants, userEmail]);
  const currentOwner = useMemo(() => data.owners.find((owner) => sameEmail(owner.email, userEmail)) ?? null, [data.owners, userEmail]);
  const ownerPropertyIds = currentOwner?.propertyIds ?? [];

  const today = useMemo(() => new Date(), []);
  const leaseAlertDate = useMemo(() => new Date(today.getTime() + 30 * 86400000), [today]);
  const month = today.getMonth();
  const year = today.getFullYear();
  const inThisMonth = useCallback((date: string) => {
    const parsed = new Date(date);
    return parsed.getMonth() === month && parsed.getFullYear() === year;
  }, [month, year]);

  const adminMetrics = useMemo(() => {
    const totalUnits = data.units.length;
    const occupied = data.units.filter((unit) => unit.unitStatus === "OCCUPIED").length;
    const available = data.units.filter((unit) => unit.unitStatus === "AVAILABLE").length;
    const collection = data.receipts.filter((receipt) => inThisMonth(receipt.receiptDate)).reduce((sum, receipt) => sum + receipt.amount, 0);
    const pendingRent = data.invoices.filter((invoice) => !["PAID", "CANCELLED"].includes(invoice.status)).reduce((sum, invoice) => sum + invoice.dueAmount, 0);
    const overdue = data.invoices.filter((invoice) => invoice.status === "OVERDUE" || (invoice.dueAmount > 0 && new Date(invoice.dueDate) < today)).length;
    const expiring = data.leases.filter((lease) => ["ACTIVE", "APPROVED"].includes(lease.status) && new Date(lease.leaseEndDate) <= leaseAlertDate).length;
    return [
      { label: "Total properties", value: count(data.properties.length), change: "Portfolio", tone: "success" as const },
      { label: "Total units", value: count(totalUnits), change: "Inventory", tone: "success" as const },
      { label: "Occupied units", value: count(occupied), change: "Live", tone: "success" as const },
      { label: "Available units", value: count(available), change: "Ready", tone: available > 0 ? "warning" as const : "success" as const },
      { label: "Occupancy percentage", value: `${totalUnits ? Math.round((occupied / totalUnits) * 100) : 0}%`, change: "Utilization", tone: "success" as const },
      { label: "Monthly rent collection", value: money(collection), change: "This month", tone: "success" as const },
      { label: "Pending rent", value: money(pendingRent), change: "Receivable", tone: pendingRent > 0 ? "warning" as const : "success" as const },
      { label: "Overdue invoices", value: count(overdue), change: "Follow-up", tone: overdue > 0 ? "danger" as const : "success" as const },
      { label: "Open maintenance requests", value: count(data.maintenance.filter((item) => isOpen(item.status)).length), change: "Tickets", tone: "warning" as const },
      { label: "Lease expiry alerts", value: count(expiring), change: "30 days", tone: expiring > 0 ? "warning" as const : "success" as const },
      { label: "Pending approvals", value: count(data.approvals.filter((item) => ["PENDING", "RESUBMITTED"].includes(item.status)).length), change: "Workflow", tone: "warning" as const },
    ];
  }, [data, inThisMonth, leaseAlertDate, today]);

  const tenantLeases = currentTenant ? data.leases.filter((lease) => lease.tenantId === currentTenant.id) : [];
  const currentLease = tenantLeases.find((lease) => lease.status === "ACTIVE") ?? tenantLeases[0] ?? null;
  const tenantInvoices = currentTenant ? data.invoices.filter((invoice) => invoice.tenantId === currentTenant.id) : [];
  const tenantReceipts = currentTenant ? data.receipts.filter((receipt) => receipt.tenantId === currentTenant.id) : [];
  const tenantMaintenance = currentTenant ? data.maintenance.filter((item) => item.tenantId === currentTenant.id) : [];
  const tenantDocuments = currentTenant ? data.documents.filter((document) => document.tenantId === currentTenant.id || (currentLease && document.leaseId === currentLease.id)) : [];

  const ownerProperties = data.properties.filter((property) => ownerPropertyIds.includes(property.id));
  const ownerEntries = currentOwner ? data.accounting.filter((entry) => entry.partyType === "OWNER" && entry.partyId === currentOwner.id) : [];
  const ownerIncome = ownerEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
  const ownerExpenses = data.accounting.filter((entry) => ownerPropertyIds.includes(entry.propertyId ?? "") && entry.accountType === "EXPENSE").reduce((sum, entry) => sum + entry.debitAmount, 0);
  const ownerUnits = data.units.filter((unit) => ownerPropertyIds.includes(unit.propertyId));
  const ownerOccupied = ownerUnits.filter((unit) => unit.unitStatus === "OCCUPIED").length;

  return (
    <AppShell title="Dashboard" subtitle="Role-aware portfolio, tenant, and owner visibility">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? (
        <div className="rounded-[28px] border border-line bg-[color:var(--surface-soft)] px-6 py-10 text-sm text-[color:var(--foreground-muted)]">Loading dashboard...</div>
      ) : (
        <div className="grid gap-6">
          {!isTenant && !isOwner ? <AdminDashboard metrics={adminMetrics} invoices={data.invoices} maintenance={data.maintenance} leases={data.leases} approvals={data.approvals} /> : null}
          {isTenant ? <TenantDashboard lease={currentLease} invoices={tenantInvoices} receipts={tenantReceipts} maintenance={tenantMaintenance} documents={tenantDocuments} notifications={data.notifications} /> : null}
          {isOwner ? <OwnerDashboard properties={ownerProperties} income={ownerIncome} expenses={ownerExpenses} units={ownerUnits} occupied={ownerOccupied} statement={ownerEntries} /> : null}
        </div>
      )}
    </AppShell>
  );
}

function AdminDashboard({ metrics, invoices, maintenance, leases, approvals }: { metrics: Array<{ label: string; value: string; change: string; tone: "success" | "warning" | "danger" }>; invoices: InvoiceRecord[]; maintenance: MaintenanceRequestRecord[]; leases: LeaseRecord[]; approvals: ApprovalRequestRecord[] }) {
  return (
    <>
      <SectionCard title="Admin Dashboard" eyebrow="Portfolio Control"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <StatCard key={metric.label} {...metric} />)}</div></SectionCard>
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Overdue Invoices"><DataTable rows={invoices.filter((item) => item.dueAmount > 0).slice(0, 6)} columns={[{ key: "invoiceNumber", header: "Invoice" }, { key: "tenantDisplayName", header: "Tenant" }, { key: "dueDate", header: "Due" }, { key: "dueAmount", header: "Pending", render: (row) => money(row.dueAmount) }]} /></SectionCard>
        <SectionCard title="Operational Alerts"><DataTable rows={[...maintenance.filter((item) => isOpen(item.status)).slice(0, 3), ...leases.filter((item) => ["ACTIVE", "APPROVED"].includes(item.status)).slice(0, 3)].map((item, index) => ({ id: `${index}`, type: "requestNumber" in item ? "Maintenance" : "Lease", reference: "requestNumber" in item ? item.requestNumber : item.leaseNumber, status: item.status }))} columns={[{ key: "type", header: "Type" }, { key: "reference", header: "Reference" }, { key: "status", header: "Status" }]} /></SectionCard>
      </div>
      <SectionCard title="Pending Approvals"><DataTable rows={approvals.filter((item) => ["PENDING", "RESUBMITTED"].includes(item.status)).slice(0, 8)} columns={[{ key: "referenceNumber", header: "Reference" }, { key: "transactionType", header: "Type", render: (row) => row.transactionType.replaceAll("_", " ") }, { key: "currentLevel", header: "Level" }, { key: "status", header: "Status" }]} /></SectionCard>
    </>
  );
}

function TenantDashboard({ lease, invoices, receipts, maintenance, documents, notifications }: { lease: LeaseRecord | null; invoices: InvoiceRecord[]; receipts: ReceiptRecord[]; maintenance: MaintenanceRequestRecord[]; documents: DocumentRecord[]; notifications: NotificationRecord[] }) {
  const due = invoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);
  return (
    <>
      <SectionCard title="Tenant Dashboard" eyebrow="My Account"><div className="grid gap-4 md:grid-cols-3"><StatCard label="Current lease" value={lease?.leaseNumber ?? "No lease"} change={lease?.status ?? "Not active"} tone="success" /><StatCard label="Rent due" value={money(due)} change="Open invoices" tone={due > 0 ? "warning" : "success"} /><StatCard label="Notifications" value={count(notifications.length)} change="Inbox" tone="success" /></div></SectionCard>
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Payment History"><DataTable rows={receipts.slice(0, 6)} columns={[{ key: "receiptNumber", header: "Receipt" }, { key: "receiptDate", header: "Date" }, { key: "amount", header: "Amount", render: (row) => money(row.amount) }]} /></SectionCard>
        <SectionCard title="Maintenance Requests"><DataTable rows={maintenance.slice(0, 6)} columns={[{ key: "requestNumber", header: "Request" }, { key: "category", header: "Category" }, { key: "status", header: "Status" }]} /></SectionCard>
      </div>
      <SectionCard title="Documents"><DataTable rows={documents.slice(0, 8)} columns={[{ key: "documentTitle", header: "Document" }, { key: "documentType", header: "Type", render: (row) => row.documentType.replaceAll("_", " ") }, { key: "expiryDate", header: "Expiry", render: (row) => row.expiryDate ?? "No expiry" }]} /></SectionCard>
    </>
  );
}

function OwnerDashboard({ properties, income, expenses, units, occupied, statement }: { properties: PropertyRecord[]; income: number; expenses: number; units: UnitRecord[]; occupied: number; statement: AccountingEntryRecord[] }) {
  const occupancy = units.length ? Math.round((occupied / units.length) * 100) : 0;
  return (
    <>
      <SectionCard title="Owner Dashboard" eyebrow="Owner Statement"><div className="grid gap-4 md:grid-cols-3"><StatCard label="Properties owned" value={count(properties.length)} change="Mapped portfolio" tone="success" /><StatCard label="Rent income" value={money(income)} change="Owner ledger" tone="success" /><StatCard label="Expenses" value={money(expenses)} change="Property expenses" tone={expenses > income ? "danger" : "warning"} /><StatCard label="Net payable" value={money(income - expenses)} change="Income minus expense" tone="success" /><StatCard label="Occupancy" value={`${occupancy}%`} change={`${occupied}/${units.length} units`} tone="success" /></div></SectionCard>
      <SectionCard title="Owner Statement"><DataTable rows={statement.slice(0, 10)} columns={[{ key: "entryDate", header: "Date" }, { key: "sourceReference", header: "Reference" }, { key: "description", header: "Description" }, { key: "creditAmount", header: "Credit", render: (row) => money(row.creditAmount) }, { key: "debitAmount", header: "Debit", render: (row) => money(row.debitAmount) }]} /></SectionCard>
    </>
  );
}
