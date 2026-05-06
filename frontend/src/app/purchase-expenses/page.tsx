"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { propertyApi, purchaseExpenseApi, unitApi, vendorApi } from "@/lib/api";
import type { PropertyExpenseRecord, PropertyRecord, PurchaseExpenseOptionsRecord, PurchaseOrderRecord, PurchaseRequestRecord, UnitRecord, VendorInvoiceRecord, VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type ActiveTab = "requests" | "orders" | "invoices" | "expenses";
type FormState = Record<string, string>;

const defaultOptions: PurchaseExpenseOptionsRecord = {
  expenseTypes: ["REPAIR_EXPENSE", "CLEANING_EXPENSE", "SECURITY_EXPENSE", "UTILITY_EXPENSE", "MANAGEMENT_FEE", "INSURANCE", "TAX", "COMMON_AREA_MAINTENANCE"],
  requestStatuses: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "CANCELLED"],
  orderStatuses: ["DRAFT", "SUBMITTED", "APPROVED", "ISSUED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
  invoiceStatuses: ["DRAFT", "SUBMITTED", "APPROVED", "POSTED", "CANCELLED"],
  expenseStatuses: ["RECORDED", "APPROVED", "POSTED", "CANCELLED"],
  approvalStatuses: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "NOT_REQUIRED"],
  paymentStatuses: ["UNPAID", "PARTIALLY_PAID", "PAID", "ON_HOLD", "CANCELLED"],
};

const defaults: Record<ActiveTab, FormState> = {
  requests: { requestNumber: "", propertyId: "", unitId: "", expenseType: "REPAIR_EXPENSE", description: "", estimatedAmount: "", status: "DRAFT", approvalStatus: "PENDING_APPROVAL" },
  orders: { purchaseOrderNumber: "", purchaseRequestId: "", vendorId: "", propertyId: "", unitId: "", orderDate: "", expectedDeliveryDate: "", totalAmount: "", status: "DRAFT", approvalStatus: "PENDING_APPROVAL", remarks: "" },
  invoices: { invoiceNumber: "", purchaseOrderId: "", vendorId: "", propertyId: "", unitId: "", invoiceDate: "", dueDate: "", invoiceAmount: "", paidAmount: "", paymentStatus: "UNPAID", approvalStatus: "PENDING_APPROVAL", status: "DRAFT", remarks: "" },
  expenses: { expenseNumber: "", vendorInvoiceId: "", vendorId: "", propertyId: "", unitId: "", expenseDate: "", expenseType: "REPAIR_EXPENSE", amount: "", description: "", approvalStatus: "PENDING_APPROVAL", paymentStatus: "UNPAID", status: "RECORDED" },
};

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function label(value: string | null | undefined) {
  return value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set";
}

function normalizeId(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

function toNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toId(value: string) {
  return value ? Number(value) : null;
}

function money(value: number | null | undefined) {
  return value == null ? "0" : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function PurchaseExpensesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("requests");
  const [options, setOptions] = useState<PurchaseExpenseOptionsRecord>(defaultOptions);
  const [requests, setRequests] = useState<PurchaseRequestRecord[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoiceRecord[]>([]);
  const [expenses, setExpenses] = useState<PropertyExpenseRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [draft, setDraft] = useState<FormState>(defaults.requests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUnits = useMemo(() => units.filter((unit) => !draft.propertyId || unit.propertyId === draft.propertyId), [draft.propertyId, units]);

  async function loadAll() {
    const [optionResponse, requestResponse, orderResponse, invoiceResponse, expenseResponse, propertyResponse, unitResponse, vendorResponse] = await Promise.all([
      purchaseExpenseApi.getOptions(),
      purchaseExpenseApi.getRequests(),
      purchaseExpenseApi.getOrders(),
      purchaseExpenseApi.getInvoices(),
      purchaseExpenseApi.getExpenses(),
      propertyApi.getProperties(),
      unitApi.getUnits(),
      vendorApi.getVendors(),
    ]);
    setOptions(optionResponse.data.data as PurchaseExpenseOptionsRecord);
    setRequests((requestResponse.data.data as Array<PurchaseRequestRecord & { id: number | string; companyId: number | string; propertyId: number | string; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId) })));
    setOrders((orderResponse.data.data as Array<PurchaseOrderRecord & { id: number | string; companyId: number | string; purchaseRequestId: number | string | null; vendorId: number | string; propertyId: number | string; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), purchaseRequestId: normalizeId(item.purchaseRequestId), vendorId: String(item.vendorId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId) })));
    setInvoices((invoiceResponse.data.data as Array<VendorInvoiceRecord & { id: number | string; companyId: number | string; purchaseOrderId: number | string | null; vendorId: number | string; propertyId: number | string; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), purchaseOrderId: normalizeId(item.purchaseOrderId), vendorId: String(item.vendorId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId) })));
    setExpenses((expenseResponse.data.data as Array<PropertyExpenseRecord & { id: number | string; companyId: number | string; vendorInvoiceId: number | string | null; vendorId: number | string | null; propertyId: number | string; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), vendorInvoiceId: normalizeId(item.vendorInvoiceId), vendorId: normalizeId(item.vendorId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId) })));
    setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: normalizeId(item.branchId), propertyManagerUserId: normalizeId(item.propertyManagerUserId), documentAttachments: Array.isArray(item.documentAttachments) ? item.documentAttachments : [] })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: [], documentAttachments: [] })));
    setVendors((vendorResponse.data.data as Array<VendorRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
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
        if (!cancelled) setError(readError(loadError, "Purchase and expense data could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  function openCreate(tab: ActiveTab) {
    setActiveTab(tab);
    setEditingId(null);
    setDraft(defaults[tab]);
    setFormError(null);
    setDrawerOpen(true);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      if (activeTab === "requests") {
        if (!draft.propertyId) throw new Error("Property is required.");
        const payload = { requestNumber: draft.requestNumber, propertyId: Number(draft.propertyId), unitId: toId(draft.unitId), expenseType: draft.expenseType, description: draft.description, estimatedAmount: toNumber(draft.estimatedAmount), status: draft.status, approvalStatus: draft.approvalStatus };
        if (editingId) {
          await purchaseExpenseApi.updateRequest(editingId, payload);
        } else {
          await purchaseExpenseApi.createRequest(payload);
        }
      } else if (activeTab === "orders") {
        if (!draft.vendorId || !draft.propertyId) throw new Error("Vendor and property are required.");
        const payload = { purchaseOrderNumber: draft.purchaseOrderNumber, purchaseRequestId: toId(draft.purchaseRequestId), vendorId: Number(draft.vendorId), propertyId: Number(draft.propertyId), unitId: toId(draft.unitId), orderDate: draft.orderDate, expectedDeliveryDate: draft.expectedDeliveryDate || null, totalAmount: toNumber(draft.totalAmount), status: draft.status, approvalStatus: draft.approvalStatus, remarks: draft.remarks || null };
        if (editingId) {
          await purchaseExpenseApi.updateOrder(editingId, payload);
        } else {
          await purchaseExpenseApi.createOrder(payload);
        }
      } else if (activeTab === "invoices") {
        if (!draft.vendorId || !draft.propertyId) throw new Error("Vendor and property are required.");
        const payload = { invoiceNumber: draft.invoiceNumber, purchaseOrderId: toId(draft.purchaseOrderId), vendorId: Number(draft.vendorId), propertyId: Number(draft.propertyId), unitId: toId(draft.unitId), invoiceDate: draft.invoiceDate, dueDate: draft.dueDate || null, invoiceAmount: toNumber(draft.invoiceAmount), paidAmount: toNumber(draft.paidAmount), paymentStatus: draft.paymentStatus, approvalStatus: draft.approvalStatus, status: draft.status, remarks: draft.remarks || null };
        if (editingId) {
          await purchaseExpenseApi.updateInvoice(editingId, payload);
        } else {
          await purchaseExpenseApi.createInvoice(payload);
        }
      } else {
        if (!draft.propertyId) throw new Error("Property is required.");
        const payload = { expenseNumber: draft.expenseNumber, vendorInvoiceId: toId(draft.vendorInvoiceId), vendorId: toId(draft.vendorId), propertyId: Number(draft.propertyId), unitId: toId(draft.unitId), expenseDate: draft.expenseDate, expenseType: draft.expenseType, amount: toNumber(draft.amount), description: draft.description || null, approvalStatus: draft.approvalStatus, paymentStatus: draft.paymentStatus, status: draft.status };
        if (editingId) {
          await purchaseExpenseApi.updateExpense(editingId, payload);
        } else {
          await purchaseExpenseApi.createExpense(payload);
        }
      }
      setDrawerOpen(false);
      setEditingId(null);
      await loadAll();
    } catch (saveError: unknown) {
      setFormError(saveError instanceof Error ? saveError.message : readError(saveError, "Record could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Purchase and expense management" subtitle="Control purchase requests, purchase orders, vendor invoices, property expenses, approvals, allocations, and vendor payment tracking.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["requests", "orders", "invoices", "expenses"] as const).map((tab) => (
          <button key={tab} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? "bg-brand-strong text-white" : "border border-line bg-[color:var(--surface-raised)]"}`} onClick={() => setActiveTab(tab)} type="button">
            {tab === "requests" ? "Purchase Requests" : tab === "orders" ? "Purchase Orders" : tab === "invoices" ? "Vendor Invoices" : "Property Expenses"}
          </button>
        ))}
      </div>

      <SectionCard title={activeTab === "requests" ? "Purchase requests" : activeTab === "orders" ? "Purchase orders" : activeTab === "invoices" ? "Vendor invoices" : "Property expenses"} eyebrow="Purchase & Expense" action={<button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={() => openCreate(activeTab)} type="button">Create</button>}>
        {isLoading ? <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading purchase and expense records...</div> : renderTable()}
      </SectionCard>

      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit record" : "Create record"}>
        <div className="grid gap-4">
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <CompanyContextBanner companyName={user?.activeCompany?.companyName} />
          {renderForm()}
          <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} onClick={save} type="button">{isSaving ? "Saving..." : "Save"}</button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );

  function renderTable() {
    if (activeTab === "requests") {
      return <DataTable rows={requests} columns={[{ key: "requestNumber", header: "Request" }, { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" }, { key: "expenseType", header: "Type", render: (row) => label(row.expenseType) }, { key: "estimatedAmount", header: "Estimate", render: (row) => money(row.estimatedAmount) }, { key: "approvalStatus", header: "Approval", render: (row) => label(row.approvalStatus) }, { key: "status", header: "Status", render: (row) => label(row.status) }, { key: "actions", header: "Actions", render: (row) => rowActions(row.id, "requests", { requestNumber: row.requestNumber, propertyId: row.propertyId, unitId: row.unitId || "", expenseType: row.expenseType, description: row.description, estimatedAmount: String(row.estimatedAmount), status: row.status, approvalStatus: row.approvalStatus }) }]} />;
    }
    if (activeTab === "orders") {
      return <DataTable rows={orders} columns={[{ key: "purchaseOrderNumber", header: "PO" }, { key: "vendorName", header: "Vendor", render: (row) => row.vendorName || "Not set" }, { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" }, { key: "orderDate", header: "Order Date" }, { key: "totalAmount", header: "Amount", render: (row) => money(row.totalAmount) }, { key: "approvalStatus", header: "Approval", render: (row) => label(row.approvalStatus) }, { key: "status", header: "Status", render: (row) => label(row.status) }, { key: "actions", header: "Actions", render: (row) => rowActions(row.id, "orders", { purchaseOrderNumber: row.purchaseOrderNumber, purchaseRequestId: row.purchaseRequestId || "", vendorId: row.vendorId, propertyId: row.propertyId, unitId: row.unitId || "", orderDate: row.orderDate, expectedDeliveryDate: row.expectedDeliveryDate || "", totalAmount: String(row.totalAmount), status: row.status, approvalStatus: row.approvalStatus, remarks: row.remarks || "" }) }]} />;
    }
    if (activeTab === "invoices") {
      return <DataTable rows={invoices} columns={[{ key: "invoiceNumber", header: "Invoice" }, { key: "vendorName", header: "Vendor", render: (row) => row.vendorName || "Not set" }, { key: "invoiceDate", header: "Invoice Date" }, { key: "invoiceAmount", header: "Amount", render: (row) => money(row.invoiceAmount) }, { key: "paidAmount", header: "Paid", render: (row) => money(row.paidAmount) }, { key: "paymentStatus", header: "Payment", render: (row) => label(row.paymentStatus) }, { key: "status", header: "Status", render: (row) => label(row.status) }, { key: "actions", header: "Actions", render: (row) => rowActions(row.id, "invoices", { invoiceNumber: row.invoiceNumber, purchaseOrderId: row.purchaseOrderId || "", vendorId: row.vendorId, propertyId: row.propertyId, unitId: row.unitId || "", invoiceDate: row.invoiceDate, dueDate: row.dueDate || "", invoiceAmount: String(row.invoiceAmount), paidAmount: String(row.paidAmount), paymentStatus: row.paymentStatus, approvalStatus: row.approvalStatus, status: row.status, remarks: row.remarks || "" }) }]} />;
    }
    return <DataTable rows={expenses} columns={[{ key: "expenseNumber", header: "Expense" }, { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" }, { key: "unitNumber", header: "Unit", render: (row) => row.unitNumber || "Property" }, { key: "expenseType", header: "Type", render: (row) => label(row.expenseType) }, { key: "amount", header: "Amount", render: (row) => money(row.amount) }, { key: "paymentStatus", header: "Payment", render: (row) => label(row.paymentStatus) }, { key: "status", header: "Status", render: (row) => label(row.status) }, { key: "actions", header: "Actions", render: (row) => rowActions(row.id, "expenses", { expenseNumber: row.expenseNumber, vendorInvoiceId: row.vendorInvoiceId || "", vendorId: row.vendorId || "", propertyId: row.propertyId, unitId: row.unitId || "", expenseDate: row.expenseDate, expenseType: row.expenseType, amount: String(row.amount), description: row.description || "", approvalStatus: row.approvalStatus, paymentStatus: row.paymentStatus, status: row.status }) }]} />;
  }

  function rowActions(id: string, tab: ActiveTab, values: FormState) {
    return (
      <div className="flex gap-2">
        <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong" onClick={() => { setActiveTab(tab); setEditingId(id); setDraft(values); setFormError(null); setDrawerOpen(true); }} type="button">Edit</button>
        <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" onClick={async () => { await deleteRecord(tab, id); }} type="button">Delete</button>
      </div>
    );
  }

  async function deleteRecord(tab: ActiveTab, id: string) {
    try {
      if (tab === "requests") await purchaseExpenseApi.deleteRequest(id);
      if (tab === "orders") await purchaseExpenseApi.deleteOrder(id);
      if (tab === "invoices") await purchaseExpenseApi.deleteInvoice(id);
      if (tab === "expenses") await purchaseExpenseApi.deleteExpense(id);
      await loadAll();
    } catch (deleteError: unknown) {
      setError(readError(deleteError, "Record could not be deleted."));
    }
  }

  function renderForm() {
    const commonProperty = <SelectInput labelName="Property" value={draft.propertyId || ""} onChange={(value) => setDraft((current) => ({ ...current, propertyId: value, unitId: "" }))} options={properties.map((property) => ({ value: property.id, label: property.propertyName }))} />;
    const commonUnit = <SelectInput labelName="Unit Allocation" value={draft.unitId || ""} onChange={(value) => setDraft((current) => ({ ...current, unitId: value }))} options={filteredUnits.map((unit) => ({ value: unit.id, label: `${unit.unitNumber} (${unit.unitCode})` }))} optionalLabel="Property-level" />;
    if (activeTab === "requests") {
      return <><TextInput labelName="Request Number" field="requestNumber" /><>{commonProperty}</><>{commonUnit}</><SelectInput labelName="Expense Type" value={draft.expenseType || ""} onChange={(value) => setDraft((current) => ({ ...current, expenseType: value }))} options={options.expenseTypes.map((item) => ({ value: item, label: label(item) }))} /><TextInput labelName="Estimated Amount" field="estimatedAmount" type="number" /><SelectInput labelName="Approval Status" value={draft.approvalStatus || ""} onChange={(value) => setDraft((current) => ({ ...current, approvalStatus: value }))} options={options.approvalStatuses.map((item) => ({ value: item, label: label(item) }))} /><SelectInput labelName="Status" value={draft.status || ""} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} options={options.requestStatuses.map((item) => ({ value: item, label: label(item) }))} /><TextareaInput labelName="Description" field="description" /></>;
    }
    if (activeTab === "orders") {
      return <><TextInput labelName="Purchase Order Number" field="purchaseOrderNumber" /><SelectInput labelName="Purchase Request" value={draft.purchaseRequestId || ""} onChange={(value) => setDraft((current) => ({ ...current, purchaseRequestId: value }))} options={requests.map((item) => ({ value: item.id, label: item.requestNumber }))} optionalLabel="Direct purchase" /><SelectInput labelName="Vendor" value={draft.vendorId || ""} onChange={(value) => setDraft((current) => ({ ...current, vendorId: value }))} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.vendorName }))} /><>{commonProperty}</><>{commonUnit}</><TextInput labelName="Order Date" field="orderDate" type="date" /><TextInput labelName="Expected Delivery Date" field="expectedDeliveryDate" type="date" /><TextInput labelName="Total Amount" field="totalAmount" type="number" /><SelectInput labelName="Approval Status" value={draft.approvalStatus || ""} onChange={(value) => setDraft((current) => ({ ...current, approvalStatus: value }))} options={options.approvalStatuses.map((item) => ({ value: item, label: label(item) }))} /><SelectInput labelName="Status" value={draft.status || ""} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} options={options.orderStatuses.map((item) => ({ value: item, label: label(item) }))} /><TextareaInput labelName="Remarks" field="remarks" /></>;
    }
    if (activeTab === "invoices") {
      return <><TextInput labelName="Invoice Number" field="invoiceNumber" /><SelectInput labelName="Purchase Order" value={draft.purchaseOrderId || ""} onChange={(value) => setDraft((current) => ({ ...current, purchaseOrderId: value }))} options={orders.map((item) => ({ value: item.id, label: item.purchaseOrderNumber }))} optionalLabel="Without PO" /><SelectInput labelName="Vendor" value={draft.vendorId || ""} onChange={(value) => setDraft((current) => ({ ...current, vendorId: value }))} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.vendorName }))} /><>{commonProperty}</><>{commonUnit}</><TextInput labelName="Invoice Date" field="invoiceDate" type="date" /><TextInput labelName="Due Date" field="dueDate" type="date" /><TextInput labelName="Invoice Amount" field="invoiceAmount" type="number" /><TextInput labelName="Paid Amount" field="paidAmount" type="number" /><SelectInput labelName="Payment Status" value={draft.paymentStatus || ""} onChange={(value) => setDraft((current) => ({ ...current, paymentStatus: value }))} options={options.paymentStatuses.map((item) => ({ value: item, label: label(item) }))} /><SelectInput labelName="Approval Status" value={draft.approvalStatus || ""} onChange={(value) => setDraft((current) => ({ ...current, approvalStatus: value }))} options={options.approvalStatuses.map((item) => ({ value: item, label: label(item) }))} /><SelectInput labelName="Status" value={draft.status || ""} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} options={options.invoiceStatuses.map((item) => ({ value: item, label: label(item) }))} /><TextareaInput labelName="Remarks" field="remarks" /></>;
    }
    return <><TextInput labelName="Expense Number" field="expenseNumber" /><SelectInput labelName="Vendor Invoice" value={draft.vendorInvoiceId || ""} onChange={(value) => setDraft((current) => ({ ...current, vendorInvoiceId: value }))} options={invoices.map((item) => ({ value: item.id, label: item.invoiceNumber }))} optionalLabel="Manual expense" /><SelectInput labelName="Vendor" value={draft.vendorId || ""} onChange={(value) => setDraft((current) => ({ ...current, vendorId: value }))} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.vendorName }))} optionalLabel="No vendor" /><>{commonProperty}</><>{commonUnit}</><TextInput labelName="Expense Date" field="expenseDate" type="date" /><SelectInput labelName="Expense Type" value={draft.expenseType || ""} onChange={(value) => setDraft((current) => ({ ...current, expenseType: value }))} options={options.expenseTypes.map((item) => ({ value: item, label: label(item) }))} /><TextInput labelName="Amount" field="amount" type="number" /><SelectInput labelName="Payment Status" value={draft.paymentStatus || ""} onChange={(value) => setDraft((current) => ({ ...current, paymentStatus: value }))} options={options.paymentStatuses.map((item) => ({ value: item, label: label(item) }))} /><SelectInput labelName="Approval Status" value={draft.approvalStatus || ""} onChange={(value) => setDraft((current) => ({ ...current, approvalStatus: value }))} options={options.approvalStatuses.map((item) => ({ value: item, label: label(item) }))} /><SelectInput labelName="Status" value={draft.status || ""} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} options={options.expenseStatuses.map((item) => ({ value: item, label: label(item) }))} /><TextareaInput labelName="Description" field="description" /></>;
  }

  function TextInput({ labelName, field, type = "text" }: { labelName: string; field: string; type?: string }) {
    return <label className="grid gap-2 text-sm font-medium">{labelName}<input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} type={type} value={draft[field] || ""} /></label>;
  }

  function TextareaInput({ labelName, field }: { labelName: string; field: string }) {
    return <label className="grid gap-2 text-sm font-medium">{labelName}<textarea className="field min-h-[110px] w-full rounded-3xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} value={draft[field] || ""} /></label>;
  }
}

function SelectInput({ labelName, value, onChange, options, optionalLabel = "Select" }: { labelName: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; optionalLabel?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {labelName}
      <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{optionalLabel}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
