"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { documentApi, leaseApi, maintenanceApi, notificationApi, rentBillingApi, tenantApi } from "@/lib/api";
import type { DocumentRecord, InvoiceRecord, LeaseRecord, MaintenanceRequestRecord, NotificationRecord, ReceiptRecord, TenantRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}
function id(value: string | number | null | undefined) { return value == null ? null : String(value); }
function money(value: number | null | undefined) { return (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function sameEmail(a?: string | null, b?: string | null) { return !!a && !!b && a.toLowerCase() === b.toLowerCase(); }
function downloadDataUrl(dataUrl: string, fileName: string) { const link = document.createElement("a"); link.href = dataUrl; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); }
async function safeData<T>(request: Promise<{ data: { data: T } }>, fallback: T): Promise<T> { try { return (await request).data.data; } catch { return fallback; } }

export default function TenantPortalPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequestRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [requestText, setRequestText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [tenantData, leaseData, invoiceData, receiptData, maintenanceData, documentData, notificationData] = await Promise.all([
      safeData(tenantApi.getTenants(), []), safeData(leaseApi.getLeases(), []), safeData(rentBillingApi.getInvoices(), []), safeData(rentBillingApi.getReceipts(), []), safeData(maintenanceApi.getRequests(), []), safeData(documentApi.getDocuments(), []), safeData(notificationApi.getMyNotifications(), []),
    ]);
    setTenants((tenantData as Array<TenantRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
    setLeases((leaseData as Array<LeaseRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), renewedFromLeaseId: id(item.renewedFromLeaseId) })));
    setInvoices((invoiceData as Array<InvoiceRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), leaseId: id(item.leaseId), rentScheduleId: id(item.rentScheduleId), propertyId: id(item.propertyId), unitId: id(item.unitId) })));
    setReceipts((receiptData as Array<ReceiptRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), invoiceId: id(item.invoiceId) })));
    setMaintenance((maintenanceData as Array<MaintenanceRequestRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), assignedVendorId: id(item.assignedVendorId), assignedUserId: id(item.assignedUserId), attachments: item.attachments ?? [] })));
    setDocuments((documentData as Array<DocumentRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: id(item.tenantId), leaseId: id(item.leaseId), propertyId: id(item.propertyId), unitId: id(item.unitId), vendorId: id(item.vendorId), invoiceId: id(item.invoiceId), previousDocumentId: id(item.previousDocumentId) })));
    setNotifications((notificationData as Array<NotificationRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), recipientUserId: id(item.recipientUserId), entityId: id(item.entityId), deliveries: item.deliveries ?? [] })));
  }, []);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) return;
    let cancelled = false;
    async function run() { try { setIsLoading(true); await loadAll(); if (!cancelled) setError(null); } catch (loadError) { if (!cancelled) setError(readError(loadError, "Tenant portal data could not be loaded.")); } finally { if (!cancelled) setIsLoading(false); } }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient, loadAll]);

  const tenant = useMemo(() => tenants.find((item) => sameEmail(item.email, user?.email)) ?? null, [tenants, user?.email]);
  const tenantLeases = tenant ? leases.filter((item) => item.tenantId === tenant.id) : [];
  const currentLease = tenantLeases.find((item) => item.status === "ACTIVE") ?? tenantLeases[0] ?? null;
  const tenantInvoices = tenant ? invoices.filter((item) => item.tenantId === tenant.id) : [];
  const tenantReceipts = tenant ? receipts.filter((item) => item.tenantId === tenant.id) : [];
  const tenantRequests = tenant ? maintenance.filter((item) => item.tenantId === tenant.id) : [];
  const tenantDocuments = tenant ? documents.filter((item) => item.tenantId === tenant.id || item.leaseId === currentLease?.id) : [];
  const rentDue = tenantInvoices.reduce((sum, item) => sum + item.dueAmount, 0);

  async function payRent(invoice: InvoiceRecord) {
    try {
      await rentBillingApi.createReceipt({ receiptNumber: `PAY-${invoice.invoiceNumber}-${Date.now()}`, invoiceId: Number(invoice.id), tenantId: Number(invoice.tenantId), receiptDate: new Date().toISOString().slice(0, 10), paymentMode: "ONLINE_PAYMENT_GATEWAY", amount: invoice.dueAmount, referenceNumber: `ONLINE-${Date.now()}`, remarks: "Tenant portal payment" });
      await loadAll();
    } catch (payError) { setError(readError(payError, "Rent payment could not be posted.")); }
  }

  async function raiseRequest() {
    if (!tenant || !currentLease || !requestText.trim()) return;
    try {
      await maintenanceApi.createRequest({ requestNumber: `MR-${tenant.tenantCode}-${Date.now()}`, tenantId: Number(tenant.id), propertyId: Number(currentLease.propertyId), unitId: Number(currentLease.unitId), category: "GENERAL", priority: "MEDIUM", description: requestText, status: "OPEN", approvalStatus: "NOT_REQUIRED", attachments: [] });
      setRequestText("");
      await loadAll();
    } catch (requestError) { setError(readError(requestError, "Maintenance request could not be raised.")); }
  }

  return (
    <AppShell title="Tenant Portal" subtitle="Lease, rent, receipts, maintenance, documents, and notifications">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? <div className="panel rounded-[28px] p-8 text-sm">Loading tenant portal...</div> : !tenant ? <SectionCard title="Tenant profile not linked"><p className="text-sm text-[color:var(--foreground-muted)]">No tenant record matches {user?.email}.</p></SectionCard> : (
        <div className="space-y-6">
          <SectionCard title="Tenant Summary"><div className="grid gap-4 md:grid-cols-3"><StatCard label="Current lease" value={currentLease?.leaseNumber ?? "No lease"} change={currentLease?.status ?? "Not active"} tone="success" /><StatCard label="Rent due" value={money(rentDue)} change="Open invoices" tone={rentDue > 0 ? "warning" : "success"} /><StatCard label="Notifications" value={String(notifications.length)} change="Inbox" tone="success" /></div></SectionCard>
          <SectionCard title="Rent Invoices"><DataTable rows={tenantInvoices} columns={[{ key: "invoiceNumber", header: "Invoice" }, { key: "dueDate", header: "Due" }, { key: "dueAmount", header: "Due Amount", render: (row) => money(row.dueAmount) }, { key: "status", header: "Status" }, { key: "pay", header: "Pay", render: (row) => row.dueAmount > 0 ? <button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => payRent(row)}>Pay rent</button> : "Paid" }]} /></SectionCard>
          <div className="grid gap-6 xl:grid-cols-2"><SectionCard title="Payment History"><DataTable rows={tenantReceipts} columns={[{ key: "receiptNumber", header: "Receipt" }, { key: "receiptDate", header: "Date" }, { key: "amount", header: "Amount", render: (row) => money(row.amount) }, { key: "download", header: "Download", render: (row) => row.pdfDocument ? <button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => downloadDataUrl(row.pdfDocument ?? "", `${row.receiptNumber}.pdf`)}>Download</button> : "No PDF" }]} /></SectionCard><SectionCard title="Maintenance Requests"><div className="mb-4 flex gap-2"><input className="field w-full rounded-2xl px-4 py-2 ring-0" onChange={(e) => setRequestText(e.target.value)} placeholder="Describe the issue" value={requestText} /><button className="btn-primary rounded-full px-4 text-sm" onClick={raiseRequest}>Raise</button></div><DataTable rows={tenantRequests} columns={[{ key: "requestNumber", header: "Request" }, { key: "category", header: "Category" }, { key: "status", header: "Status" }]} /></SectionCard></div>
          <SectionCard title="Documents"><DataTable rows={tenantDocuments} columns={[{ key: "documentTitle", header: "Document" }, { key: "documentType", header: "Type" }, { key: "download", header: "Download", render: (row) => <button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => downloadDataUrl(row.dataUrl, row.fileName)}>Download</button> }]} /></SectionCard>
          <SectionCard title="Notifications"><DataTable rows={notifications} columns={[{ key: "title", header: "Title" }, { key: "message", header: "Message" }, { key: "read", header: "Status", render: (row) => row.read ? "Read" : "Unread" }]} /></SectionCard>
        </div>
      )}
    </AppShell>
  );
}
