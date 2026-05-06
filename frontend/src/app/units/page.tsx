"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { buildingApi, floorApi, propertyApi, unitApi } from "@/lib/api";
import type { BuildingRecord, FloorRecord, PropertyRecord, UnitAttachmentRecord, UnitOptionsRecord, UnitRecord } from "@/lib/types";
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
  return new Promise<UnitAttachmentRecord>((resolve, reject) => {
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

type UnitFormState = {
  propertyId: string;
  buildingId: string;
  floorId: string;
  unitCode: string;
  unitNumber: string;
  unitType: string;
  areaValue: string;
  areaUnit: string;
  baseRent: string;
  securityDepositAmount: string;
  unitStatus: string;
  availabilityDate: string;
  photoAttachments: UnitAttachmentRecord[];
  documentAttachments: UnitAttachmentRecord[];
};

const fallbackOptions: UnitOptionsRecord = {
  unitTypes: ["STUDIO", "1_BHK", "2_BHK", "3_BHK", "OFFICE", "SHOP", "WAREHOUSE", "PARKING", "STORAGE"],
  unitStatuses: ["AVAILABLE", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE", "BLOCKED", "INACTIVE"],
  areaUnits: ["SQ_FT", "SQ_M"],
};

const defaultForm: UnitFormState = {
  propertyId: "",
  buildingId: "",
  floorId: "",
  unitCode: "",
  unitNumber: "",
  unitType: "STUDIO",
  areaValue: "",
  areaUnit: "SQ_FT",
  baseRent: "",
  securityDepositAmount: "",
  unitStatus: "AVAILABLE",
  availabilityDate: "",
  photoAttachments: [],
  documentAttachments: [],
};

export default function UnitsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompany = user?.activeCompany;
  const activeCompanyId = activeCompany?.id ? String(activeCompany.id) : null;

  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [floors, setFloors] = useState<FloorRecord[]>([]);
  const [options, setOptions] = useState<UnitOptionsRecord>(fallbackOptions);
  const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null);
  const [draft, setDraft] = useState<UnitFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const availableProperties = useMemo(
    () => properties.filter((property) => property.companyId === activeCompanyId && property.status === "ACTIVE"),
    [activeCompanyId, properties],
  );
  const availableBuildings = useMemo(
    () => buildings.filter((building) => building.propertyId === draft.propertyId && (building.status === "ACTIVE" || building.id === draft.buildingId)),
    [buildings, draft.buildingId, draft.propertyId],
  );
  const availableFloors = useMemo(
    () => floors.filter((floor) => floor.buildingId === draft.buildingId && (floor.status === "ACTIVE" || floor.id === draft.floorId)),
    [draft.buildingId, draft.floorId, floors],
  );

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const [unitResponse, propertyResponse, buildingResponse, floorResponse, optionResponse] = await Promise.all([
          unitApi.getUnits(),
          propertyApi.getProperties(),
          buildingApi.getBuildings(),
          floorApi.getFloors(),
          unitApi.getOptions(),
        ]);
        if (cancelled) {
          return;
        }

        setUnits((unitResponse.data.data as Array<UnitRecord & {
          id: number | string;
          companyId: number | string;
          propertyId: number | string;
          buildingId: number | string;
          floorId: number | string;
        }>).map((unit) => ({
          ...unit,
          id: String(unit.id),
          companyId: String(unit.companyId),
          propertyId: String(unit.propertyId),
          buildingId: String(unit.buildingId),
          floorId: String(unit.floorId),
          photoAttachments: Array.isArray(unit.photoAttachments) ? unit.photoAttachments : [],
          documentAttachments: Array.isArray(unit.documentAttachments) ? unit.documentAttachments : [],
        })));
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
        setBuildings((buildingResponse.data.data as Array<BuildingRecord & {
          id: number | string;
          companyId: number | string;
          propertyId: number | string;
        }>).map((building) => ({
          ...building,
          id: String(building.id),
          companyId: String(building.companyId),
          propertyId: String(building.propertyId),
        })));
        setFloors((floorResponse.data.data as Array<FloorRecord & {
          id: number | string;
          companyId: number | string;
          propertyId: number | string;
          buildingId: number | string;
        }>).map((floor) => ({
          ...floor,
          id: String(floor.id),
          companyId: String(floor.companyId),
          propertyId: String(floor.propertyId),
          buildingId: String(floor.buildingId),
        })));
        setOptions({
          unitTypes: optionResponse.data.data.unitTypes ?? fallbackOptions.unitTypes,
          unitStatuses: optionResponse.data.data.unitStatuses ?? fallbackOptions.unitStatuses,
          areaUnits: optionResponse.data.data.areaUnits ?? fallbackOptions.areaUnits,
        });
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Units could not be loaded."));
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

  async function handleAttachmentUpload(event: ChangeEvent<HTMLInputElement>, kind: "photoAttachments" | "documentAttachments") {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
      setDraft((current) => ({ ...current, [kind]: [...current[kind], ...uploaded] }));
      setFormError(null);
    } catch (uploadError) {
      setFormError(uploadError instanceof Error ? uploadError.message : "Files could not be uploaded.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSave() {
    if (!draft.propertyId || !draft.buildingId || !draft.floorId) {
      setFormError("Property, building, and floor are required.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        propertyId: Number(draft.propertyId),
        buildingId: Number(draft.buildingId),
        floorId: Number(draft.floorId),
        unitCode: draft.unitCode,
        unitNumber: draft.unitNumber,
        unitType: draft.unitType,
        areaValue: toNumber(draft.areaValue),
        areaUnit: draft.areaUnit,
        baseRent: toNumber(draft.baseRent),
        securityDepositAmount: toNumber(draft.securityDepositAmount),
        unitStatus: draft.unitStatus,
        availabilityDate: draft.availabilityDate || null,
        photoAttachments: draft.photoAttachments,
        documentAttachments: draft.documentAttachments,
      };

      if (editingUnit) {
        await unitApi.updateUnit(editingUnit.id, payload);
      } else {
        await unitApi.createUnit(payload);
      }

      setIsDrawerOpen(false);
      setEditingUnit(null);
      setDraft(defaultForm);

      const refreshed = await unitApi.getUnits();
      setUnits((refreshed.data.data as Array<UnitRecord & {
        id: number | string;
        companyId: number | string;
        propertyId: number | string;
        buildingId: number | string;
        floorId: number | string;
      }>).map((unit) => ({
        ...unit,
        id: String(unit.id),
        companyId: String(unit.companyId),
        propertyId: String(unit.propertyId),
        buildingId: String(unit.buildingId),
        floorId: String(unit.floorId),
        photoAttachments: Array.isArray(unit.photoAttachments) ? unit.photoAttachments : [],
        documentAttachments: Array.isArray(unit.documentAttachments) ? unit.documentAttachments : [],
      })));
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Unit could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Unit management" subtitle="Manage rentable units with enforced property, building, and floor linkage plus commercial and availability details.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <SectionCard title="Unit register" eyebrow="Property Management">
        <div className="mb-4 flex justify-end">
          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditingUnit(null);
              setDraft(defaultForm);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            Create unit
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading units...</div>
        ) : (
          <DataTable
            rows={units}
            columns={[
              { key: "unitCode", header: "Code" },
              { key: "unitNumber", header: "Unit No." },
              { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" },
              { key: "buildingName", header: "Building", render: (row) => row.buildingName || "Not set" },
              { key: "floorName", header: "Floor", render: (row) => row.floorName || "Not set" },
              { key: "unitType", header: "Type", render: (row) => formatOptionLabel(row.unitType) },
              { key: "unitStatus", header: "Status", render: (row) => formatOptionLabel(row.unitStatus) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line px-3 py-2 text-xs font-semibold"
                      onClick={() => {
                        setEditingUnit(row);
                        setDraft({
                          propertyId: row.propertyId,
                          buildingId: row.buildingId,
                          floorId: row.floorId,
                          unitCode: row.unitCode,
                          unitNumber: row.unitNumber,
                          unitType: row.unitType,
                          areaValue: row.areaValue == null ? "" : String(row.areaValue),
                          areaUnit: row.areaUnit,
                          baseRent: row.baseRent == null ? "" : String(row.baseRent),
                          securityDepositAmount: row.securityDepositAmount == null ? "" : String(row.securityDepositAmount),
                          unitStatus: row.unitStatus,
                          availabilityDate: row.availabilityDate || "",
                          photoAttachments: row.photoAttachments || [],
                          documentAttachments: row.documentAttachments || [],
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
                          await unitApi.deleteUnit(row.id);
                          setUnits((current) => current.filter((item) => item.id !== row.id));
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Unit could not be deleted."));
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
        description="Create units only from registered property, building, and floor masters so availability and reporting stay structured."
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingUnit ? rowTitle(editingUnit) : "Create unit"}
      >
        <div className="grid gap-4">
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <CompanyContextBanner companyName={activeCompany?.companyName} />

          <label className="grid gap-2 text-sm font-medium">
            Property
            <select
              className="field w-full rounded-2xl px-4 py-3 ring-0"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  propertyId: event.target.value,
                  buildingId: "",
                  floorId: "",
                }))
              }
              value={draft.propertyId}
            >
              <option value="">Select property</option>
              {availableProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.propertyName} ({property.propertyCode})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Building
            <select
              className="field w-full rounded-2xl px-4 py-3 ring-0"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  buildingId: event.target.value,
                  floorId: "",
                }))
              }
              value={draft.buildingId}
            >
              <option value="">Select building</option>
              {availableBuildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingName} ({building.buildingCode})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Floor
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, floorId: event.target.value }))} value={draft.floorId}>
              <option value="">Select floor</option>
              {availableFloors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.floorName} ({floor.floorCode})
                </option>
              ))}
            </select>
          </label>

          {(["unitCode", "unitNumber", "areaValue", "baseRent", "securityDepositAmount"] as const).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-medium">
              {field.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}
              <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} value={draft[field]} />
            </label>
          ))}

          <label className="grid gap-2 text-sm font-medium">
            Unit Type
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, unitType: event.target.value }))} value={draft.unitType}>
              {options.unitTypes.map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Area Unit
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, areaUnit: event.target.value }))} value={draft.areaUnit}>
              {options.areaUnits.map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Unit Status
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, unitStatus: event.target.value }))} value={draft.unitStatus}>
              {options.unitStatuses.map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Availability Date
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, availabilityDate: event.target.value }))} type="date" value={draft.availabilityDate} />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Unit Photos
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={(event) => void handleAttachmentUpload(event, "photoAttachments")} type="file" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Documents
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={(event) => void handleAttachmentUpload(event, "documentAttachments")} type="file" />
          </label>

          {[...draft.photoAttachments, ...draft.documentAttachments].length ? (
            <div className="grid gap-3">
              {[...draft.photoAttachments, ...draft.documentAttachments].map((attachment, index) => (
                <div key={`${attachment.fileName}-${index}`} className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 text-sm">
                  <p className="font-semibold text-[color:var(--foreground)]">{attachment.fileName}</p>
                  <p className="text-[color:var(--foreground-muted)]">{formatFileSize(attachment.fileSize)}</p>
                </div>
              ))}
            </div>
          ) : null}

          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} onClick={handleSave} type="button">
            {isSaving ? "Saving..." : editingUnit ? "Update unit" : "Create unit"}
          </button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function rowTitle(unit: UnitRecord) {
  return `${unit.unitNumber} (${unit.unitCode})`;
}
