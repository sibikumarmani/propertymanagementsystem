"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { buildingApi, propertyApi } from "@/lib/api";
import type { BuildingRecord, PropertyRecord } from "@/lib/types";
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

type BuildingFormState = {
  propertyId: string;
  buildingCode: string;
  buildingName: string;
  numberOfFloors: string;
  amenitiesSummary: string;
  description: string;
  status: string;
};

const defaultForm: BuildingFormState = {
  propertyId: "",
  buildingCode: "",
  buildingName: "",
  numberOfFloors: "",
  amenitiesSummary: "",
  description: "",
  status: "ACTIVE",
};

export default function BuildingsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompany = user?.activeCompany;
  const activeCompanyId = activeCompany?.id ? String(activeCompany.id) : null;
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [editingBuilding, setEditingBuilding] = useState<BuildingRecord | null>(null);
  const [draft, setDraft] = useState<BuildingFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const availableProperties = useMemo(
    () => properties.filter((property) => property.companyId === activeCompanyId && property.status === "ACTIVE"),
    [activeCompanyId, properties],
  );

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const [buildingResponse, propertyResponse] = await Promise.all([buildingApi.getBuildings(), propertyApi.getProperties()]);
        if (cancelled) {
          return;
        }
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
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Buildings could not be loaded."));
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

  async function handleSave() {
    if (!draft.propertyId) {
      setFormError("Property is required.");
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        propertyId: Number(draft.propertyId),
        buildingCode: draft.buildingCode,
        buildingName: draft.buildingName,
        numberOfFloors: toNumber(draft.numberOfFloors),
        amenitiesSummary: draft.amenitiesSummary || null,
        description: draft.description || null,
        status: draft.status,
      };
      if (editingBuilding) {
        await buildingApi.updateBuilding(editingBuilding.id, payload);
      } else {
        await buildingApi.createBuilding(payload);
      }
      setIsDrawerOpen(false);
      setEditingBuilding(null);
      setDraft(defaultForm);
      const refreshed = await buildingApi.getBuildings();
      setBuildings((refreshed.data.data as Array<BuildingRecord & { id: number | string; companyId: number | string; propertyId: number | string }>).map((building) => ({
        ...building,
        id: String(building.id),
        companyId: String(building.companyId),
        propertyId: String(building.propertyId),
      })));
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Building could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Building / block management" subtitle="Create blocks, towers, or buildings under each property and keep structural and amenity details organized.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <SectionCard title="Building register" eyebrow="Property Management">
        <div className="mb-4 flex justify-end">
          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={() => { setEditingBuilding(null); setDraft(defaultForm); setFormError(null); setIsDrawerOpen(true); }} type="button">
            Create building
          </button>
        </div>
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading buildings...</div>
        ) : (
          <DataTable
            rows={buildings}
            columns={[
              { key: "buildingCode", header: "Code" },
              { key: "buildingName", header: "Building" },
              { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" },
              { key: "numberOfFloors", header: "Floors", render: (row) => row.numberOfFloors ?? "Not set" },
              { key: "status", header: "Status", render: (row) => formatOptionLabel(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => { setEditingBuilding(row); setDraft({ propertyId: row.propertyId, buildingCode: row.buildingCode, buildingName: row.buildingName, numberOfFloors: row.numberOfFloors == null ? "" : String(row.numberOfFloors), amenitiesSummary: row.amenitiesSummary || "", description: row.description || "", status: row.status }); setFormError(null); setIsDrawerOpen(true); }} type="button">Edit</button>
                    <button className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={async () => { try { await buildingApi.deleteBuilding(row.id); setBuildings((current) => current.filter((item) => item.id !== row.id)); } catch (deleteError: unknown) { setError(readError(deleteError, "Building could not be deleted.")); } }} type="button">Delete</button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer description="Map each building or block to a property before floors and units are created beneath it." open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingBuilding ? editingBuilding.buildingName : "Create building"}>
        <div className="grid gap-4">
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <CompanyContextBanner companyName={activeCompany?.companyName} />
          <label className="grid gap-2 text-sm font-medium">
            Property
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, propertyId: event.target.value }))} value={draft.propertyId}>
              <option value="">Select property</option>
              {availableProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.propertyName} ({property.propertyCode})
                </option>
              ))}
            </select>
          </label>
          {(["buildingCode", "buildingName", "numberOfFloors"] as const).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-medium">
              {field.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}
              <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} value={draft[field]} />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-medium">
            Amenities
            <textarea className="field min-h-[110px] w-full rounded-3xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, amenitiesSummary: event.target.value }))} value={draft.amenitiesSummary} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <textarea className="field min-h-[110px] w-full rounded-3xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} value={draft.description} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Status
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
              {["ACTIVE", "INACTIVE"].map((option) => (
                <option key={option} value={option}>
                  {formatOptionLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} onClick={handleSave} type="button">
            {isSaving ? "Saving..." : editingBuilding ? "Update building" : "Create building"}
          </button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}
