"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { branchApi, ownerApi, propertyApi, userApi } from "@/lib/api";
import type { BranchRecord, OwnerRecord, PropertyAttachmentRecord, PropertyRecord, UserRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function formatOptionLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function propertyFieldLabel(field: keyof PropertyFormState) {
  if (field === "totalBuildings") {
    return "Total blocks / buildings";
  }
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
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
  return new Promise<PropertyAttachmentRecord>((resolve, reject) => {
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

type PropertyFormState = {
  branchId: string;
  propertyCode: string;
  propertyName: string;
  propertyType: string;
  ownershipType: string;
  ownerReference: string;
  ownershipDetails: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  totalBuildings: string;
  totalUnits: string;
  propertyManagerUserId: string;
  amenitiesSummary: string;
  documentAttachments: PropertyAttachmentRecord[];
  status: string;
};

const defaultForm: PropertyFormState = {
  branchId: "",
  propertyCode: "",
  propertyName: "",
  propertyType: "APARTMENT",
  ownershipType: "OWN",
  ownerReference: "",
  ownershipDetails: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  totalBuildings: "",
  totalUnits: "",
  propertyManagerUserId: "",
  amenitiesSummary: "",
  documentAttachments: [],
  status: "ACTIVE",
};

const propertyTypes = [
  "APARTMENT",
  "VILLA",
  "COMMERCIAL_BUILDING",
  "OFFICE_SPACE",
  "RETAIL",
  "WAREHOUSE",
  "LAND",
  "MIXED_USE_PROPERTY",
] as const;
const ownershipTypes = ["OWN", "MANAGED", "LEASED", "JOINT_VENTURE"] as const;
const propertyStatuses = ["ACTIVE", "INACTIVE", "UNDER_MAINTENANCE"] as const;

export default function PropertiesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompany = user?.activeCompany;
  const activeCompanyId = activeCompany?.id ? String(activeCompany.id) : null;

  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [draft, setDraft] = useState<PropertyFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const availableBranches = useMemo(
    () => branches.filter((branch) => branch.companyId === activeCompanyId && branch.status === "ACTIVE"),
    [activeCompanyId, branches],
  );

  const managerOptions = useMemo(
    () =>
      users.filter(
        (item) =>
          item.status === "ACTIVE" &&
          item.companies.some((company) => company.id === activeCompanyId && company.status === "ACTIVE"),
      ),
    [activeCompanyId, users],
  );

  const ownerOptions = useMemo(
    () => owners.filter((owner) => owner.companyId === activeCompanyId && owner.ownerStatus === "ACTIVE"),
    [activeCompanyId, owners],
  );

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const [propertyResponse, branchResponse, ownerResponse, userResponse] = await Promise.all([
          propertyApi.getProperties(),
          branchApi.getBranches(),
          ownerApi.getOwners(),
          userApi.getUsers(),
        ]);
        if (cancelled) {
          return;
        }

        setProperties((propertyResponse.data.data as Array<PropertyRecord & {
          id: number | string;
          companyId: number | string;
          branchId: number | string | null;
          propertyManagerUserId: number | string | null;
        }>).map((property) => ({
          ...property,
          id: String(property.id),
          companyId: String(property.companyId),
          branchId: property.branchId == null ? null : String(property.branchId),
          propertyManagerUserId: property.propertyManagerUserId == null ? null : String(property.propertyManagerUserId),
          documentAttachments: Array.isArray(property.documentAttachments) ? property.documentAttachments : [],
        })));
        setBranches((branchResponse.data.data as Array<BranchRecord & { id: number | string; companyId: number | string }>).map((branch) => ({
          ...branch,
          id: String(branch.id),
          companyId: String(branch.companyId),
        })));
        setOwners((ownerResponse.data.data as Array<OwnerRecord & {
          id: number | string;
          companyId: number | string;
          propertyIds: Array<number | string>;
        }>).map((owner) => ({
          ...owner,
          id: String(owner.id),
          companyId: String(owner.companyId),
          propertyIds: owner.propertyIds.map((item) => String(item)),
        })));
        setUsers((userResponse.data.data as UserRecord[]).map((item) => ({
          ...item,
          id: String(item.id),
          roles: item.roles.map((role) => ({ ...role, id: String(role.id) })),
          companies: item.companies.map((company) => ({ ...company, id: String(company.id) })),
          defaultCompanyId: item.defaultCompanyId == null ? null : String(item.defaultCompanyId),
        })));
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Properties could not be loaded."));
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

  function toNumber(value: string) {
    if (!value.trim()) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function handleAttachmentUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
      setDraft((current) => ({
        ...current,
        documentAttachments: [...current.documentAttachments, ...uploaded],
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
        branchId: draft.branchId ? Number(draft.branchId) : null,
        propertyCode: draft.propertyCode,
        propertyName: draft.propertyName,
        propertyType: draft.propertyType,
        ownershipType: draft.ownershipType,
        ownerReference: draft.ownerReference || null,
        ownershipDetails: draft.ownershipDetails || null,
        address: draft.address || null,
        city: draft.city || null,
        state: draft.state || null,
        country: draft.country || null,
        pincode: draft.pincode || null,
        totalFloors: toNumber(draft.totalBuildings),
        totalUnits: toNumber(draft.totalUnits),
        propertyManagerUserId: draft.propertyManagerUserId ? Number(draft.propertyManagerUserId) : null,
        amenitiesSummary: draft.amenitiesSummary || null,
        documentAttachments: draft.documentAttachments,
        status: draft.status,
      };

      if (editingProperty) {
        await propertyApi.updateProperty(editingProperty.id, payload);
      } else {
        await propertyApi.createProperty(payload);
      }

      setIsDrawerOpen(false);
      setEditingProperty(null);
      setDraft(defaultForm);

      const refreshed = await propertyApi.getProperties();
      setProperties((refreshed.data.data as Array<PropertyRecord & {
        id: number | string;
        companyId: number | string;
        branchId: number | string | null;
        propertyManagerUserId: number | string | null;
      }>).map((property) => ({
        ...property,
        id: String(property.id),
        companyId: String(property.companyId),
        branchId: property.branchId == null ? null : String(property.branchId),
        propertyManagerUserId: property.propertyManagerUserId == null ? null : String(property.propertyManagerUserId),
        documentAttachments: Array.isArray(property.documentAttachments) ? property.documentAttachments : [],
      })));
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Property could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Property master" subtitle="Maintain company-linked property masters, ownership details, operating managers, and core portfolio status.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <SectionCard title="Portfolio register" eyebrow="Property Management">
        <div className="mb-4 flex justify-end">
          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditingProperty(null);
              setDraft(defaultForm);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            Create property
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading properties...</div>
        ) : (
          <DataTable
            rows={properties}
            columns={[
              { key: "propertyCode", header: "Code" },
              { key: "propertyName", header: "Property" },
              { key: "propertyType", header: "Type", render: (row) => formatOptionLabel(row.propertyType) },
              { key: "branchName", header: "Branch", render: (row) => row.branchName || "Head office" },
              { key: "ownerReference", header: "Owner", render: (row) => row.ownerReference || "Not linked" },
              { key: "propertyManagerName", header: "Property Manager", render: (row) => row.propertyManagerName || "Not set" },
              { key: "status", header: "Status", render: (row) => formatOptionLabel(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line px-3 py-2 text-xs font-semibold"
                      onClick={() => {
                        setEditingProperty(row);
                        setDraft({
                          branchId: row.branchId || "",
                          propertyCode: row.propertyCode,
                          propertyName: row.propertyName,
                          propertyType: row.propertyType,
                          ownershipType: row.ownershipType,
                          ownerReference: row.ownerReference || "",
                          ownershipDetails: row.ownershipDetails || "",
                          address: row.address || "",
                          city: row.city || "",
                          state: row.state || "",
                          country: row.country || "",
                          pincode: row.pincode || "",
                          totalBuildings: row.totalFloors == null ? "" : String(row.totalFloors),
                          totalUnits: row.totalUnits == null ? "" : String(row.totalUnits),
                          propertyManagerUserId: row.propertyManagerUserId || "",
                          amenitiesSummary: row.amenitiesSummary || "",
                          documentAttachments: row.documentAttachments || [],
                          status: row.status,
                        });
                        setFormError(null);
                        setIsDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={async () => {
                        try {
                          await propertyApi.deleteProperty(row.id);
                          setProperties((current) => current.filter((item) => item.id !== row.id));
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Property could not be deleted."));
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
        description="Capture the core property master, map it to the company structure, and keep ownership and manager references current."
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingProperty ? editingProperty.propertyName : "Create property"}
      >
        <div className="grid gap-4">
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <CompanyContextBanner companyName={activeCompany?.companyName} />

          <label className="grid gap-2 text-sm font-medium">
            Branch
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, branchId: event.target.value }))} value={draft.branchId}>
              <option value="">Head office / none</option>
              {availableBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </label>

          {(["propertyCode", "propertyName", "address", "city", "state", "country", "pincode", "totalBuildings", "totalUnits"] as const).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-medium">
              {propertyFieldLabel(field)}
              <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} value={draft[field]} />
            </label>
          ))}

          <label className="grid gap-2 text-sm font-medium">
            Property Type
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, propertyType: event.target.value }))} value={draft.propertyType}>
              {propertyTypes.map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Ownership Type
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, ownershipType: event.target.value }))} value={draft.ownershipType}>
              {ownershipTypes.map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Owner
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, ownerReference: event.target.value }))} value={draft.ownerReference}>
              <option value="">Not linked</option>
              {ownerOptions.map((owner) => (
                <option key={owner.id} value={owner.ownerCode}>
                  {owner.ownerName} ({owner.ownerCode})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Property Manager
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, propertyManagerUserId: event.target.value }))} value={draft.propertyManagerUserId}>
              <option value="">Not assigned</option>
              {managerOptions.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName}
                </option>
              ))}
            </select>
          </label>

          {(["ownershipDetails", "amenitiesSummary"] as const).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-medium">
              {field === "ownershipDetails" ? "Ownership Details" : "Amenities"}
              <textarea
                className="field min-h-[110px] w-full rounded-3xl px-4 py-3 ring-0"
                onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                value={draft[field]}
              />
            </label>
          ))}

          <label className="grid gap-2 text-sm font-medium">
            Property Status
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
              {propertyStatuses.map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Documents
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={handleAttachmentUpload} type="file" />
          </label>

          {draft.documentAttachments.length ? (
            <div className="grid gap-3">
              {draft.documentAttachments.map((attachment, index) => (
                <div key={`${attachment.fileName}-${index}`} className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 text-sm">
                  <p className="font-semibold text-[color:var(--foreground)]">{attachment.fileName}</p>
                  <p className="text-[color:var(--foreground-muted)]">{formatFileSize(attachment.fileSize)}</p>
                </div>
              ))}
            </div>
          ) : null}

          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} onClick={handleSave} type="button">
            {isSaving ? "Saving..." : editingProperty ? "Update property" : "Create property"}
          </button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}
