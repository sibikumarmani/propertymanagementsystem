"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { leaseApi, maintenanceApi, ownerApi, propertyApi, purchaseExpenseApi, rentBillingApi, tenantApi, unitApi, vendorApi } from "@/lib/api";
import type { InvoiceRecord, LeaseRecord, MaintenanceRequestRecord, MaintenanceWorkOrderRecord, OwnerRecord, PropertyExpenseRecord, PropertyRecord, ReceiptRecord, SecurityDepositRecord, TenantRecord, UnitRecord, VendorInvoiceRecord, VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type ReportRow = { id: string } & Record<string, string | number | null>;

const reports = [
  "Property list",
  "Unit availability report",
  "Occupancy report",
  "Lease expiry report",
  "Tenant list",
  "Rent demand report",
  "Rent collection report",
  "Outstanding rent report",
  "Maintenance request report",
  "Vendor work order report",
  "Expense report",
  "Owner statement",
  "Security deposit report",
  "Invoice report",
  "Receipt report",
];

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}
function id(value: string | number | null | undefined) { return value == null ? null : String(value); }
function label(value: string | null | undefined) { return value ? value.replaceAll("_", " ") : "Not set"; }
function money(value: number | null | undefined) { return (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }

async function safeData<T>(request: Promise<{ data: { data: T } }>, fallback: T): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch {
    return fallback;
  }
}

export default function ReportsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [activeReport, setActiveReport] = useState(reports[0]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [deposits, setDeposits] = useState<SecurityDepositRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequestRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrderRecord[]>([]);
  const [vendorInvoices, setVendorInvoices] = useState<VendorInvoiceRecord[]>([]);
  const [expenses, setExpenses] = useState<PropertyExpenseRecord[]>([]);
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [propertyData, unitData, tenantData, leaseData, invoiceData, receiptData, depositData, maintenanceData, workOrderData, vendorInvoiceData, expenseData, ownerData, vendorData] = await Promise.all([
      safeData(propertyApi.getProperties(), []),
      safeData(unitApi.getUnits(), []),
      safeData(tenantApi.getTenants(), []),
      safeData(leaseApi.getLeases(), []),
      safeData(rentBillingApi.getInvoices(), []),
      safeData(rentBillingApi.getReceipts(), []),
      safeData(rentBillingApi.getSecurityDeposits(), []),
      safeData(maintenanceApi.getRequests(), []),
      safeData(maintenanceApi.getWorkOrders(), []),
      safeData(purchaseExpenseApi.getInvoices(), []),
      safeData(purchaseExpenseApi.getExpenses(), []),
      safeData(ownerApi.getOwners(), []),
      safeData(vendorApi.getVendors(), []),
    ]);
    setProperties((propertyData as Array<PropertyRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: id(item.branchId), propertyManagerUserId: id(item.propertyManagerUserId), documentAttachments: item.documentAttachments ?? [] })));
    setUnits((unitData as Array<UnitRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: item.photoAttachments ?? [], documentAttachments: item.documentAttachments ?? [] })));
    setTenants((tenantData as Array<TenantRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
    setLeases((leaseData as Array<LeaseRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), renewedFromLeaseId: id(item.renewedFromLeaseId) })));
    setInvoices((invoiceData as Array<InvoiceRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), leaseId: id(item.leaseId), rentScheduleId: id(item.rentScheduleId), tenantId: String(item.tenantId), propertyId: id(item.propertyId), unitId: id(item.unitId) })));
    setReceipts((receiptData as Array<ReceiptRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), invoiceId: id(item.invoiceId), tenantId: String(item.tenantId) })));
    setDeposits((depositData as Array<SecurityDepositRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), leaseId: String(item.leaseId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), depositInvoiceId: id(item.depositInvoiceId), depositReceiptId: id(item.depositReceiptId) })));
    setMaintenance((maintenanceData as Array<MaintenanceRequestRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), assignedVendorId: id(item.assignedVendorId), assignedUserId: id(item.assignedUserId), attachments: item.attachments ?? [] })));
    setWorkOrders((workOrderData as Array<MaintenanceWorkOrderRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), maintenanceRequestId: String(item.maintenanceRequestId), vendorId: id(item.vendorId), technicianUserId: id(item.technicianUserId) })));
    setVendorInvoices((vendorInvoiceData as Array<VendorInvoiceRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), purchaseOrderId: id(item.purchaseOrderId), vendorId: String(item.vendorId), propertyId: String(item.propertyId), unitId: id(item.unitId) })));
    setExpenses((expenseData as Array<PropertyExpenseRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), vendorInvoiceId: id(item.vendorInvoiceId), vendorId: id(item.vendorId), propertyId: String(item.propertyId), unitId: id(item.unitId) })));
    setOwners((ownerData as Array<OwnerRecord & { id: number | string; propertyIds: Array<number | string> }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyIds: item.propertyIds.map(String) })));
    setVendors((vendorData as Array<VendorRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
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
        if (!cancelled) setError(readError(loadError, "Reports data could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient, loadAll]);

  const report = useMemo(() => buildReport(activeReport, { properties, units, tenants, leases, invoices, receipts, deposits, maintenance, workOrders, vendorInvoices, expenses, owners, vendors }), [activeReport, properties, units, tenants, leases, invoices, receipts, deposits, maintenance, workOrders, vendorInvoices, expenses, owners, vendors]);

  return (
    <AppShell title="Reports Center" subtitle="Operational, leasing, finance, maintenance, owner, and vendor reports">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? (
        <div className="rounded-[28px] border border-line bg-[color:var(--surface-soft)] px-6 py-10 text-sm text-[color:var(--foreground-muted)]">Loading reports...</div>
      ) : (
        <div className="grid gap-6">
          <SectionCard title="Required Reports" eyebrow="Catalog">
            <div className="flex flex-wrap gap-2">
              {reports.map((name) => <button key={name} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeReport === name ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveReport(name)}>{name}</button>)}
            </div>
          </SectionCard>
          <SectionCard title={activeReport} eyebrow="Live Extract" action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => window.print()}>Print</button>}>
            <DataTable rows={report.rows} columns={report.columns} />
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}

function buildReport(name: string, data: { properties: PropertyRecord[]; units: UnitRecord[]; tenants: TenantRecord[]; leases: LeaseRecord[]; invoices: InvoiceRecord[]; receipts: ReceiptRecord[]; deposits: SecurityDepositRecord[]; maintenance: MaintenanceRequestRecord[]; workOrders: MaintenanceWorkOrderRecord[]; vendorInvoices: VendorInvoiceRecord[]; expenses: PropertyExpenseRecord[]; owners: OwnerRecord[]; vendors: VendorRecord[] }) {
  const propertyRows = data.properties.map((p) => ({ id: p.id, code: p.propertyCode, property: p.propertyName, type: label(p.propertyType), city: p.city ?? "", status: label(p.status) }));
  const unitRows = data.units.map((u) => ({ id: u.id, unit: u.unitNumber, property: u.propertyName ?? "", type: label(u.unitType), status: label(u.unitStatus), rent: money(u.baseRent) }));
  const occupancyRows = data.properties.map((p) => {
    const units = data.units.filter((u) => u.propertyId === p.id);
    const occupied = units.filter((u) => u.unitStatus === "OCCUPIED").length;
    return { id: p.id, property: p.propertyName, totalUnits: units.length, occupied, available: units.filter((u) => u.unitStatus === "AVAILABLE").length, occupancy: `${units.length ? Math.round((occupied / units.length) * 100) : 0}%` };
  });
  const reports: Record<string, { rows: ReportRow[]; columns: Array<{ key: string; header: string }> }> = {
    "Property list": { rows: propertyRows, columns: cols("code", "property", "type", "city", "status") },
    "Unit availability report": { rows: unitRows, columns: cols("unit", "property", "type", "status", "rent") },
    "Occupancy report": { rows: occupancyRows, columns: cols("property", "totalUnits", "occupied", "available", "occupancy") },
    "Lease expiry report": { rows: data.leases.map((l) => ({ id: l.id, lease: l.leaseNumber, tenant: l.tenantDisplayName ?? "", property: l.propertyName ?? "", unit: l.unitNumber ?? "", expiry: l.leaseEndDate, status: label(l.status) })), columns: cols("lease", "tenant", "property", "unit", "expiry", "status") },
    "Tenant list": { rows: data.tenants.map((t) => ({ id: t.id, code: t.tenantCode, tenant: t.displayName, phone: t.phoneNumber, email: t.email ?? "", status: label(t.tenantStatus) })), columns: cols("code", "tenant", "phone", "email", "status") },
    "Rent demand report": { rows: data.invoices.map((i) => ({ id: i.id, invoice: i.invoiceNumber, tenant: i.tenantDisplayName ?? "", date: i.invoiceDate, dueDate: i.dueDate, amount: money(i.totalAmount), status: label(i.status) })), columns: cols("invoice", "tenant", "date", "dueDate", "amount", "status") },
    "Rent collection report": { rows: data.receipts.map((r) => ({ id: r.id, receipt: r.receiptNumber, tenant: r.tenantDisplayName ?? "", date: r.receiptDate, mode: label(r.paymentMode), amount: money(r.amount) })), columns: cols("receipt", "tenant", "date", "mode", "amount") },
    "Outstanding rent report": { rows: data.invoices.filter((i) => i.dueAmount > 0).map((i) => ({ id: i.id, invoice: i.invoiceNumber, tenant: i.tenantDisplayName ?? "", dueDate: i.dueDate, outstanding: money(i.dueAmount), status: label(i.status) })), columns: cols("invoice", "tenant", "dueDate", "outstanding", "status") },
    "Maintenance request report": { rows: data.maintenance.map((m) => ({ id: m.id, request: m.requestNumber, tenant: m.tenantDisplayName ?? "", property: m.propertyName ?? "", priority: label(m.priority), status: label(m.status) })), columns: cols("request", "tenant", "property", "priority", "status") },
    "Vendor work order report": { rows: data.workOrders.map((w) => ({ id: w.id, workOrder: w.workOrderNumber, request: w.requestNumber ?? "", vendor: w.vendorName ?? "", technician: w.technicianName ?? "", status: label(w.status) })), columns: cols("workOrder", "request", "vendor", "technician", "status") },
    "Expense report": { rows: data.expenses.map((e) => ({ id: e.id, expense: e.expenseNumber, property: e.propertyName ?? "", vendor: e.vendorName ?? "", type: label(e.expenseType), amount: money(e.amount), status: label(e.status) })), columns: cols("expense", "property", "vendor", "type", "amount", "status") },
    "Owner statement": { rows: data.owners.map((o) => ({ id: o.id, owner: o.ownerName, properties: o.propertiesOwnedSummary, payout: label(o.payoutFrequency), stage: label(o.statementStage), status: label(o.ownerStatus) })), columns: cols("owner", "properties", "payout", "stage", "status") },
    "Security deposit report": { rows: data.deposits.map((d) => ({ id: d.id, deposit: d.depositNumber, tenant: d.tenantDisplayName ?? "", property: d.propertyName ?? "", collected: money(d.collectedAmount), refundable: money(d.refundableAmount), status: label(d.status) })), columns: cols("deposit", "tenant", "property", "collected", "refundable", "status") },
    "Invoice report": { rows: data.vendorInvoices.map((i) => ({ id: i.id, invoice: i.invoiceNumber, vendor: i.vendorName ?? "", property: i.propertyName ?? "", amount: money(i.invoiceAmount), balance: money(i.balanceAmount), status: label(i.status) })), columns: cols("invoice", "vendor", "property", "amount", "balance", "status") },
    "Receipt report": { rows: data.receipts.map((r) => ({ id: r.id, receipt: r.receiptNumber, invoice: r.invoiceNumber ?? "", tenant: r.tenantDisplayName ?? "", date: r.receiptDate, amount: money(r.amount), status: label(r.status) })), columns: cols("receipt", "invoice", "tenant", "date", "amount", "status") },
  };
  return reports[name] ?? reports["Property list"];
}

function cols(...keys: string[]) {
  return keys.map((key) => ({ key, header: label(key.replace(/([A-Z])/g, " $1")) }));
}
