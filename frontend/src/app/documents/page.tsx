"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { documentApi, leaseApi, propertyApi, rentBillingApi, tenantApi, unitApi, vendorApi } from "@/lib/api";
import type { DocumentOptionsRecord, DocumentRecord, InvoiceRecord, LeaseRecord, PropertyRecord, TenantRecord, UnitRecord, VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type FormState = {
  documentNumber: string;
  documentTitle: string;
  documentType: string;
  fileName: string;
  contentType: string;
  fileSize: string;
  dataUrl: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  leaseId: string;
  vendorId: string;
  invoiceId: string;
  expiryDate: string;
  previousDocumentId: string;
  status: string;
  accessLevel: string;
  remarks: string;
};

const defaultOptions: DocumentOptionsRecord = {
  documentTypes: ["LEASE_AGREEMENT", "TENANT_ID_PROOF", "OWNER_DOCUMENT", "PROPERTY_TAX_DOCUMENT", "INSURANCE_DOCUMENT", "VENDOR_CONTRACT", "INVOICE_PDF", "RECEIPT_PDF"],
  statuses: ["ACTIVE", "SUPERSEDED", "EXPIRED", "ARCHIVED"],
  accessLevels: ["INTERNAL", "RESTRICTED", "CONFIDENTIAL"],
};

const defaults: FormState = {
  documentNumber: "",
  documentTitle: "",
  documentType: "LEASE_AGREEMENT",
  fileName: "",
  contentType: "",
  fileSize: "",
  dataUrl: "",
  propertyId: "",
  unitId: "",
  tenantId: "",
  leaseId: "",
  vendorId: "",
  invoiceId: "",
  expiryDate: "",
  previousDocumentId: "",
  status: "ACTIVE",
  accessLevel: "INTERNAL",
  remarks: "",
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

function toId(value: string) {
  return value ? Number(value) : null;
}

function label(value: string | null | undefined) {
  return value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set";
}

function formatSize(value: number | null | undefined) {
  if (!value) {
    return "Not set";
  }
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function DocumentsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [options, setOptions] = useState<DocumentOptionsRecord>(defaultOptions);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [draft, setDraft] = useState<FormState>(defaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCompany = user?.activeCompany;
  const expiringDocuments = useMemo(() => documents.filter((item) => item.expired || item.expiringSoon), [documents]);

  async function loadAll() {
    const [optionResponse, documentResponse, propertyResponse, unitResponse, tenantResponse, leaseResponse, vendorResponse, invoiceResponse] = await Promise.all([
      documentApi.getOptions(),
      documentApi.getDocuments(),
      propertyApi.getProperties(),
      unitApi.getUnits(),
      tenantApi.getTenants(),
      leaseApi.getLeases(),
      vendorApi.getVendors(),
      rentBillingApi.getInvoices(),
    ]);
    setOptions(optionResponse.data.data as DocumentOptionsRecord);
    setDocuments((documentResponse.data.data as Array<DocumentRecord & { id: number | string; companyId: number | string }>).map((item) => ({
      ...item,
      id: String(item.id),
      companyId: String(item.companyId),
      propertyId: normalizeId(item.propertyId),
      unitId: normalizeId(item.unitId),
      tenantId: normalizeId(item.tenantId),
      leaseId: normalizeId(item.leaseId),
      vendorId: normalizeId(item.vendorId),
      invoiceId: normalizeId(item.invoiceId),
      previousDocumentId: normalizeId(item.previousDocumentId),
    })));
    setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: normalizeId(item.branchId), propertyManagerUserId: normalizeId(item.propertyManagerUserId), documentAttachments: [] })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: [], documentAttachments: [] })));
    setTenants((tenantResponse.data.data as Array<TenantRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), idProofAttachments: [], addressProofAttachments: [], financialAttachments: [] })));
    setLeases((leaseResponse.data.data as Array<LeaseRecord & { id: number | string; companyId: number | string; tenantId: number | string; propertyId: number | string; unitId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), renewedFromLeaseId: normalizeId(item.renewedFromLeaseId) })));
    setVendors((vendorResponse.data.data as Array<VendorRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
    setInvoices((invoiceResponse.data.data as Array<InvoiceRecord & { id: number | string; companyId: number | string; leaseId: number | string | null; tenantId: number | string; propertyId: number | string | null; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), leaseId: normalizeId(item.leaseId), tenantId: String(item.tenantId), propertyId: normalizeId(item.propertyId), unitId: normalizeId(item.unitId), rentScheduleId: normalizeId(item.rentScheduleId) })));
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
        if (!cancelled) setError(readError(loadError, "Document management data could not be loaded."));
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
    setEditingId(null);
    setFormError(null);
    setDrawerOpen(true);
  }

  function openVersion(row: DocumentRecord) {
    setDraft({
      ...defaults,
      documentNumber: row.documentNumber,
      documentTitle: row.documentTitle,
      documentType: row.documentType,
      propertyId: row.propertyId ?? "",
      unitId: row.unitId ?? "",
      tenantId: row.tenantId ?? "",
      leaseId: row.leaseId ?? "",
      vendorId: row.vendorId ?? "",
      invoiceId: row.invoiceId ?? "",
      previousDocumentId: row.id,
      accessLevel: row.accessLevel,
      remarks: row.remarks ?? "",
    });
    setEditingId(null);
    setFormError(null);
    setDrawerOpen(true);
  }

  function openEdit(row: DocumentRecord) {
    setEditingId(row.id);
    setFormError(null);
    setDraft({
      documentNumber: row.documentNumber,
      documentTitle: row.documentTitle,
      documentType: row.documentType,
      fileName: row.fileName,
      contentType: row.contentType,
      fileSize: row.fileSize == null ? "" : String(row.fileSize),
      dataUrl: row.dataUrl,
      propertyId: row.propertyId ?? "",
      unitId: row.unitId ?? "",
      tenantId: row.tenantId ?? "",
      leaseId: row.leaseId ?? "",
      vendorId: row.vendorId ?? "",
      invoiceId: row.invoiceId ?? "",
      expiryDate: row.expiryDate ?? "",
      previousDocumentId: row.previousDocumentId ?? "",
      status: row.status,
      accessLevel: row.accessLevel,
      remarks: row.remarks ?? "",
    });
    setDrawerOpen(true);
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: String(file.size),
        dataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        documentNumber: draft.documentNumber,
        documentTitle: draft.documentTitle,
        documentType: draft.documentType,
        fileName: draft.fileName,
        contentType: draft.contentType,
        fileSize: draft.fileSize ? Number(draft.fileSize) : null,
        dataUrl: draft.dataUrl,
        propertyId: toId(draft.propertyId),
        unitId: toId(draft.unitId),
        tenantId: toId(draft.tenantId),
        leaseId: toId(draft.leaseId),
        vendorId: toId(draft.vendorId),
        invoiceId: toId(draft.invoiceId),
        expiryDate: draft.expiryDate || null,
        previousDocumentId: editingId ? null : toId(draft.previousDocumentId),
        status: draft.status,
        accessLevel: draft.accessLevel,
        remarks: draft.remarks || null,
      };
      if (editingId) await documentApi.updateDocument(editingId, payload);
      else await documentApi.createDocument(payload);
      await loadAll();
      setDrawerOpen(false);
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Document could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await documentApi.deleteDocument(id);
      await loadAll();
    } catch (deleteError: unknown) {
      setError(readError(deleteError, "Document could not be deleted."));
    }
  }

  async function download(row: DocumentRecord) {
    try {
      const response = await documentApi.downloadDocument(row.id);
      const documentRecord = response.data.data as DocumentRecord;
      downloadDataUrl(documentRecord.dataUrl, documentRecord.fileName);
    } catch (downloadError: unknown) {
      setError(readError(downloadError, "Document could not be downloaded."));
    }
  }

  const columns = [
    { key: "documentTitle", header: "Document", render: (row: DocumentRecord) => <div><div className="font-semibold">{row.documentTitle}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.documentNumber} · v{row.versionNumber} · {label(row.documentType)}</div></div> },
    { key: "mapping", header: "Mapped To", render: (row: DocumentRecord) => [row.propertyName, row.unitNumber, row.tenantName, row.leaseNumber, row.vendorName, row.invoiceNumber].filter(Boolean).join(" / ") || "Not mapped" },
    { key: "expiryDate", header: "Expiry", render: (row: DocumentRecord) => <span className={row.expired ? "font-semibold text-red-600" : row.expiringSoon ? "font-semibold text-amber-600" : ""}>{row.expiryDate ?? "No expiry"}</span> },
    { key: "fileSize", header: "File", render: (row: DocumentRecord) => <div><div>{row.fileName}</div><div className="text-xs text-[color:var(--foreground-muted)]">{formatSize(row.fileSize)}</div></div> },
    { key: "status", header: "Status", render: (row: DocumentRecord) => `${label(row.status)} · ${label(row.accessLevel)}` },
    { key: "actions", header: "Actions", render: (row: DocumentRecord) => <div className="flex flex-wrap gap-2"><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => download(row)}>Download</button><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => openVersion(row)}>New version</button><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => openEdit(row)}>Edit</button><button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={() => remove(row.id)}>Delete</button></div> },
  ];

  return (
    <AppShell title="Document Management" subtitle="Upload, map, version, expire, and download operational documents">
      <div className="space-y-6">
        <CompanyContextBanner companyName={activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Property Setup</p>
            <h1 className="text-3xl font-semibold tracking-tight">Document Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Centralize agreements, ID proofs, owner records, tax documents, insurance papers, vendor contracts, invoices, and receipts with expiry tracking and controlled access.</p>
          </div>
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" onClick={openCreate}>Upload Document</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SectionCard title="Documents">
            <p className="text-3xl font-semibold">{documents.length}</p>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Stored files with active company access</p>
          </SectionCard>
          <SectionCard title="Expiry Attention">
            <p className="text-3xl font-semibold">{expiringDocuments.length}</p>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Expired or due within 30 days</p>
          </SectionCard>
          <SectionCard title="Versioned Files">
            <p className="text-3xl font-semibold">{documents.filter((item) => item.versionNumber > 1 || item.previousDocumentId).length}</p>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Uploaded as document revisions</p>
          </SectionCard>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <SectionCard title="Document Register" action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadAll()}>Refresh</button>}>
          {isLoading ? <p className="text-sm text-[color:var(--foreground-muted)]">Loading documents...</p> : <DataTable columns={columns} rows={documents} />}
        </SectionCard>
      </div>

      <SidebarDrawer
        description="Upload a file, map it to one or more business records, and set expiry or access controls."
        eyebrow="Document"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        title={editingId ? "Edit Document" : draft.previousDocumentId ? "Upload New Version" : "Upload Document"}
      >
        <div className="space-y-5">
          {formError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</div> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Document Number" value={draft.documentNumber} onChange={(value) => setDraft((current) => ({ ...current, documentNumber: value }))} />
            <TextInput label="Title" value={draft.documentTitle} onChange={(value) => setDraft((current) => ({ ...current, documentTitle: value }))} />
            <SelectInput label="Type" options={options.documentTypes} value={draft.documentType} onChange={(value) => setDraft((current) => ({ ...current, documentType: value }))} />
            <TextInput label="Expiry Date" type="date" value={draft.expiryDate} onChange={(value) => setDraft((current) => ({ ...current, expiryDate: value }))} />
            <SelectInput label="Status" options={options.statuses} value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} />
            <SelectInput label="Access Level" options={options.accessLevels} value={draft.accessLevel} onChange={(value) => setDraft((current) => ({ ...current, accessLevel: value }))} />
          </div>

          <div className="rounded-2xl border border-dashed border-line p-4">
            <label className="text-sm font-semibold text-brand-strong">Upload Document</label>
            <input className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={handleUpload} type="file" />
            {draft.fileName ? <p className="mt-2 text-xs text-[color:var(--foreground-muted)]">{draft.fileName} · {formatSize(Number(draft.fileSize))}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput allowEmpty label="Property" options={properties.map((item) => ({ value: item.id, label: item.propertyName }))} value={draft.propertyId} onChange={(value) => setDraft((current) => ({ ...current, propertyId: value }))} />
            <SelectInput allowEmpty label="Unit" options={units.map((item) => ({ value: item.id, label: item.unitNumber }))} value={draft.unitId} onChange={(value) => setDraft((current) => ({ ...current, unitId: value }))} />
            <SelectInput allowEmpty label="Tenant" options={tenants.map((item) => ({ value: item.id, label: item.displayName }))} value={draft.tenantId} onChange={(value) => setDraft((current) => ({ ...current, tenantId: value }))} />
            <SelectInput allowEmpty label="Lease" options={leases.map((item) => ({ value: item.id, label: item.leaseNumber }))} value={draft.leaseId} onChange={(value) => setDraft((current) => ({ ...current, leaseId: value }))} />
            <SelectInput allowEmpty label="Vendor" options={vendors.map((item) => ({ value: item.id, label: item.vendorName }))} value={draft.vendorId} onChange={(value) => setDraft((current) => ({ ...current, vendorId: value }))} />
            <SelectInput allowEmpty label="Invoice" options={invoices.map((item) => ({ value: item.id, label: item.invoiceNumber }))} value={draft.invoiceId} onChange={(value) => setDraft((current) => ({ ...current, invoiceId: value }))} />
          </div>

          <TextareaInput label="Remarks" value={draft.remarks} onChange={(value) => setDraft((current) => ({ ...current, remarks: value }))} />

          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-2 text-sm font-semibold" onClick={() => setDrawerOpen(false)} type="button">Cancel</button>
            <button className="btn-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={save} type="button">{isSaving ? "Saving..." : "Save Document"}</button>
          </div>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function TextInput({ label: inputLabel, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-sm font-semibold text-brand-strong">
      {inputLabel}
      <input className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}

function SelectInput({ label: inputLabel, options, value, onChange, allowEmpty = false }: { label: string; options: string[] | Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void; allowEmpty?: boolean }) {
  const normalizedOptions = options.map((option) => (typeof option === "string" ? { value: option, label: label(option) } : option));
  return (
    <label className="block text-sm font-semibold text-brand-strong">
      {inputLabel}
      <select className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value}>
        {allowEmpty ? <option value="">Not mapped</option> : null}
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextareaInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-brand-strong">
      {inputLabel}
      <textarea className="field mt-2 min-h-28 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}
