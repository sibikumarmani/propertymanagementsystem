"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { tenantApi } from "@/lib/api";
import type { TenantAttachmentRecord, TenantOptionsRecord, TenantRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type TenantFormState = Omit<TenantRecord, "id" | "companyId" | "companyName" | "companyCode" | "displayName">;

const fallbackOptions: TenantOptionsRecord = {
  tenantTypes: ["INDIVIDUAL", "FAMILY", "COMPANY", "RETAIL", "OFFICE", "WAREHOUSE", "CO_LIVING", "STUDENT"],
  idProofTypes: ["AADHAAR", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "PAN", "TRADE_LICENSE", "GST_CERTIFICATE", "COMPANY_INCORPORATION_CERTIFICATE", "OTHER"],
  kycStatuses: ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"],
  blacklistStatuses: ["CLEAR", "UNDER_REVIEW", "BLACKLISTED"],
  tenantStatuses: ["DRAFT", "PENDING_KYC", "APPROVED", "ACTIVE", "INACTIVE", "BLACKLISTED"],
  kycStages: ["CREATED", "ID_PROOF_UPLOADED", "ADDRESS_PROOF_UPLOADED", "FINANCIAL_DOCUMENTS_UPLOADED", "KYC_VERIFIED", "APPROVED"],
};

const defaultForm: TenantFormState = {
  tenantCode: "",
  tenantType: "INDIVIDUAL",
  firstName: "",
  lastName: "",
  companyNameValue: "",
  phoneNumber: "",
  email: "",
  alternatePhone: "",
  dateOfBirthOrRegistration: "",
  idProofType: "",
  idProofNumber: "",
  taxNumber: "",
  gstNumber: "",
  emergencyContact: "",
  employerDetails: "",
  currentAddress: "",
  permanentAddress: "",
  kycStatus: "NOT_STARTED",
  blacklistStatus: "CLEAR",
  tenantStatus: "DRAFT",
  kycStage: "CREATED",
  idProofAttachments: [],
  addressProofAttachments: [],
  financialAttachments: [],
};

function prettify(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return value.replaceAll("_", " ");
}

function formatFileSize(bytes: number | null) {
  if (bytes == null || Number.isNaN(bytes)) {
    return "Unknown size";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<TenantAttachmentRecord>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("File could not be read."));
        return;
      }
      resolve({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        dataUrl: reader.result,
        fileSize: file.size,
      });
    };
    reader.onerror = () => reject(new Error(`File ${file.name} could not be read.`));
    reader.readAsDataURL(file);
  });
}

export default function TenantsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [options, setOptions] = useState<TenantOptionsRecord>(fallbackOptions);
  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [draft, setDraft] = useState<TenantFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadTenants() {
    const response = await tenantApi.getTenants();
    setTenants(
      (
        response.data.data as Array<
          Omit<TenantRecord, "id" | "companyId"> & {
            id: number | string;
            companyId: number | string;
          }
        >
      ).map((tenant) => ({
        ...tenant,
        id: String(tenant.id),
        companyId: String(tenant.companyId),
        idProofAttachments: Array.isArray(tenant.idProofAttachments) ? tenant.idProofAttachments : [],
        addressProofAttachments: Array.isArray(tenant.addressProofAttachments) ? tenant.addressProofAttachments : [],
        financialAttachments: Array.isArray(tenant.financialAttachments) ? tenant.financialAttachments : [],
      })),
    );
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const [tenantResponse, optionResponse] = await Promise.all([tenantApi.getTenants(), tenantApi.getOptions()]);
        if (cancelled) {
          return;
        }
        setTenants(
          (
            tenantResponse.data.data as Array<
              Omit<TenantRecord, "id" | "companyId"> & {
                id: number | string;
                companyId: number | string;
              }
            >
          ).map((tenant) => ({
            ...tenant,
            id: String(tenant.id),
            companyId: String(tenant.companyId),
            idProofAttachments: Array.isArray(tenant.idProofAttachments) ? tenant.idProofAttachments : [],
            addressProofAttachments: Array.isArray(tenant.addressProofAttachments) ? tenant.addressProofAttachments : [],
            financialAttachments: Array.isArray(tenant.financialAttachments) ? tenant.financialAttachments : [],
          })),
        );
        setOptions({
          tenantTypes: optionResponse.data.data.tenantTypes ?? fallbackOptions.tenantTypes,
          idProofTypes: optionResponse.data.data.idProofTypes ?? fallbackOptions.idProofTypes,
          kycStatuses: optionResponse.data.data.kycStatuses ?? fallbackOptions.kycStatuses,
          blacklistStatuses: optionResponse.data.data.blacklistStatuses ?? fallbackOptions.blacklistStatuses,
          tenantStatuses: optionResponse.data.data.tenantStatuses ?? fallbackOptions.tenantStatuses,
          kycStages: optionResponse.data.data.kycStages ?? fallbackOptions.kycStages,
        });
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Tenants could not be loaded."));
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

  async function handleAttachmentUpload(event: ChangeEvent<HTMLInputElement>, field: "idProofAttachments" | "addressProofAttachments" | "financialAttachments") {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
      setDraft((current) => ({
        ...current,
        [field]: [...current[field], ...uploaded],
      }));
      setFormError(null);
    } catch (uploadError) {
      setFormError(uploadError instanceof Error ? uploadError.message : "Files could not be uploaded.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        tenantCode: draft.tenantCode,
        tenantType: draft.tenantType,
        firstName: draft.firstName,
        lastName: draft.lastName,
        companyName: draft.companyNameValue,
        phoneNumber: draft.phoneNumber,
        email: draft.email,
        alternatePhone: draft.alternatePhone,
        dateOfBirthOrRegistration: draft.dateOfBirthOrRegistration || null,
        idProofType: draft.idProofType,
        idProofNumber: draft.idProofNumber,
        taxNumber: draft.taxNumber,
        gstNumber: draft.gstNumber,
        emergencyContact: draft.emergencyContact,
        employerDetails: draft.employerDetails,
        currentAddress: draft.currentAddress,
        permanentAddress: draft.permanentAddress,
        kycStatus: draft.kycStatus,
        blacklistStatus: draft.blacklistStatus,
        tenantStatus: draft.tenantStatus,
        kycStage: draft.kycStage,
        idProofAttachments: draft.idProofAttachments,
        addressProofAttachments: draft.addressProofAttachments,
        financialAttachments: draft.financialAttachments,
      };

      if (editingTenant) {
        await tenantApi.updateTenant(editingTenant.id, payload);
      } else {
        await tenantApi.createTenant(payload);
      }

      setIsDrawerOpen(false);
      setDraft(defaultForm);
      setEditingTenant(null);
      await loadTenants();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Tenant could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Tenant management"
      subtitle="Maintain tenant masters, track KYC readiness, and approve customers before occupancy or lease activation."
    >
      <SectionCard
        title="Tenant directory"
        eyebrow="Customer Management"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditingTenant(null);
              setDraft(defaultForm);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            Add Tenant
          </button>
        }
      >
        <div className="mb-5 rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-4 text-sm text-[color:var(--foreground-muted)]">
          <p className="font-semibold text-brand-strong">{user?.activeCompany?.companyName ?? "Active company"} tenant onboarding</p>
          <p className="mt-1">KYC flow: Create Tenant → Upload ID Proof → Upload Address Proof → Upload Financial / Employment Documents → Verify KYC → Approve Tenant</p>
        </div>

        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading tenants...</div>
        ) : (
          <DataTable
            rows={tenants}
            columns={[
              { key: "tenantCode", header: "Tenant Code" },
              { key: "displayName", header: "Tenant", render: (row) => row.displayName },
              { key: "tenantType", header: "Type", render: (row) => prettify(row.tenantType) },
              { key: "phoneNumber", header: "Phone" },
              { key: "kycStage", header: "KYC Stage", render: (row) => prettify(row.kycStage) },
              { key: "kycStatus", header: "KYC Status", render: (row) => prettify(row.kycStatus) },
              { key: "idProofAttachments", header: "ID Docs", render: (row) => String(row.idProofAttachments.length) },
              { key: "addressProofAttachments", header: "Address Docs", render: (row) => String(row.addressProofAttachments.length) },
              { key: "financialAttachments", header: "Financial Docs", render: (row) => String(row.financialAttachments.length) },
              { key: "tenantStatus", header: "Tenant Status", render: (row) => prettify(row.tenantStatus) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingTenant(row);
                        setDraft({
                          tenantCode: row.tenantCode,
                          tenantType: row.tenantType,
                          firstName: row.firstName ?? "",
                          lastName: row.lastName ?? "",
                          companyNameValue: row.companyNameValue ?? "",
                          phoneNumber: row.phoneNumber,
                          email: row.email ?? "",
                          alternatePhone: row.alternatePhone ?? "",
                          dateOfBirthOrRegistration: row.dateOfBirthOrRegistration ?? "",
                          idProofType: row.idProofType ?? "",
                          idProofNumber: row.idProofNumber ?? "",
                          taxNumber: row.taxNumber ?? "",
                          gstNumber: row.gstNumber ?? "",
                          emergencyContact: row.emergencyContact ?? "",
                          employerDetails: row.employerDetails ?? "",
                          currentAddress: row.currentAddress ?? "",
                          permanentAddress: row.permanentAddress ?? "",
                          kycStatus: row.kycStatus,
                          blacklistStatus: row.blacklistStatus,
                          tenantStatus: row.tenantStatus,
                          kycStage: row.kycStage,
                          idProofAttachments: row.idProofAttachments,
                          addressProofAttachments: row.addressProofAttachments,
                          financialAttachments: row.financialAttachments,
                        });
                        setFormError(null);
                        setIsDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={async () => {
                        try {
                          await tenantApi.deleteTenant(row.id);
                          await loadTenants();
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Tenant could not be deleted."));
                        }
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        eyebrow={editingTenant ? "Edit Tenant" : "New Tenant"}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        title={editingTenant ? editingTenant.displayName : "Create tenant"}
        description="Capture the tenant master, then move the KYC stage forward as documents arrive and verification completes."
        widthClassName="sm:max-w-5xl"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Tenant code</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, tenantCode: event.target.value }))} value={draft.tenantCode} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Tenant type</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, tenantType: event.target.value }))} value={draft.tenantType}>
              {options.tenantTypes.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">First name</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))} value={draft.firstName ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Last name</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))} value={draft.lastName ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Company name</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, companyNameValue: event.target.value }))} value={draft.companyNameValue ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Phone number</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, phoneNumber: event.target.value }))} value={draft.phoneNumber} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Alternate phone</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, alternatePhone: event.target.value }))} value={draft.alternatePhone ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Email</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} value={draft.email ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Date of birth / registration</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, dateOfBirthOrRegistration: event.target.value }))} type="date" value={draft.dateOfBirthOrRegistration ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">ID proof type</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, idProofType: event.target.value }))} value={draft.idProofType ?? ""}>
              <option value="">Select ID proof type</option>
              {options.idProofTypes.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">ID proof number</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, idProofNumber: event.target.value }))} value={draft.idProofNumber ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Tax number</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, taxNumber: event.target.value }))} value={draft.taxNumber ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">GST number</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, gstNumber: event.target.value }))} value={draft.gstNumber ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Emergency contact</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, emergencyContact: event.target.value }))} value={draft.emergencyContact ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Employer details</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, employerDetails: event.target.value }))} value={draft.employerDetails ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Current address</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, currentAddress: event.target.value }))} value={draft.currentAddress ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Permanent address</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, permanentAddress: event.target.value }))} value={draft.permanentAddress ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">KYC status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, kycStatus: event.target.value }))} value={draft.kycStatus}>
              {options.kycStatuses.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">KYC stage</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, kycStage: event.target.value }))} value={draft.kycStage}>
              {options.kycStages.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Blacklist status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, blacklistStatus: event.target.value }))} value={draft.blacklistStatus}>
              {options.blacklistStatuses.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Tenant status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, tenantStatus: event.target.value }))} value={draft.tenantStatus}>
              {options.tenantStatuses.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">ID proof documents</span>
            <input accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={(event) => void handleAttachmentUpload(event, "idProofAttachments")} type="file" />
            <div className="mt-3 grid gap-2">
              {draft.idProofAttachments.length === 0 ? (
                <p className="text-sm text-[color:var(--foreground-muted)]">No ID proof documents uploaded yet.</p>
              ) : (
                draft.idProofAttachments.map((attachment, index) => (
                  <div key={`${attachment.fileName}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-strong">{attachment.fileName}</p>
                      <p className="text-xs text-[color:var(--foreground-muted)]">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong" href={attachment.dataUrl} rel="noreferrer" target="_blank">
                        Open
                      </a>
                      <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => setDraft((current) => ({ ...current, idProofAttachments: current.idProofAttachments.filter((_, itemIndex) => itemIndex !== index) }))} type="button">
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Address proof documents</span>
            <input accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={(event) => void handleAttachmentUpload(event, "addressProofAttachments")} type="file" />
            <div className="mt-3 grid gap-2">
              {draft.addressProofAttachments.length === 0 ? (
                <p className="text-sm text-[color:var(--foreground-muted)]">No address proof documents uploaded yet.</p>
              ) : (
                draft.addressProofAttachments.map((attachment, index) => (
                  <div key={`${attachment.fileName}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-strong">{attachment.fileName}</p>
                      <p className="text-xs text-[color:var(--foreground-muted)]">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong" href={attachment.dataUrl} rel="noreferrer" target="_blank">
                        Open
                      </a>
                      <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => setDraft((current) => ({ ...current, addressProofAttachments: current.addressProofAttachments.filter((_, itemIndex) => itemIndex !== index) }))} type="button">
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Financial / employment documents</span>
            <input accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.xls,.xlsx" className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={(event) => void handleAttachmentUpload(event, "financialAttachments")} type="file" />
            <div className="mt-3 grid gap-2">
              {draft.financialAttachments.length === 0 ? (
                <p className="text-sm text-[color:var(--foreground-muted)]">No financial or employment documents uploaded yet.</p>
              ) : (
                draft.financialAttachments.map((attachment, index) => (
                  <div key={`${attachment.fileName}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-strong">{attachment.fileName}</p>
                      <p className="text-xs text-[color:var(--foreground-muted)]">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong" href={attachment.dataUrl} rel="noreferrer" target="_blank">
                        Open
                      </a>
                      <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => setDraft((current) => ({ ...current, financialAttachments: current.financialAttachments.filter((_, itemIndex) => itemIndex !== index) }))} type="button">
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </label>
          {formError ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingTenant ? "Update Tenant" : "Create Tenant"}
            </button>
          </div>
        </form>
      </SidebarDrawer>
    </AppShell>
  );
}
