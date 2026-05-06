"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { buildingApi, floorApi, propertyApi } from "@/lib/api";
import type { BuildingRecord, FloorRecord, PropertyRecord } from "@/lib/types";
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

type FloorFormState = {
  propertyId: string;
  buildingId: string;
  floorCode: string;
  floorName: string;
  floorNumber: string;
  status: string;
};

const defaultForm: FloorFormState = {
  propertyId: "",
  buildingId: "",
  floorCode: "",
  floorName: "",
  floorNumber: "",
  status: "ACTIVE",
};

export default function FloorsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompany = user?.activeCompany;
  const activeCompanyId = activeCompany?.id ? String(activeCompany.id) : null;
  const [floors, setFloors] = useState<FloorRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [editingFloor, setEditingFloor] = useState<FloorRecord | null>(null);
  const [draft, setDraft] = useState<FloorFormState>(defaultForm);
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

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const [floorResponse, buildingResponse, propertyResponse] = await Promise.all([floorApi.getFloors(), buildingApi.getBuildings(), propertyApi.getProperties()]);
        if (cancelled) {
          return;
        }
        setFloors((floorResponse.data.data as Array<FloorRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string }>).map((floor) => ({
          ...floor,
          id: String(floor.id),
          companyId: String(floor.companyId),
          propertyId: String(floor.propertyId),
          buildingId: String(floor.buildingId),
        })));
        setBuildings((buildingResponse.data.data as Array<BuildingRecord & { id: number | string; companyId: number | string; propertyId: number | string }>).map((building) => ({
          ...building,
          id: String(building.id),
          companyId: String(building.companyId),
          propertyId: String(building.propertyId),
        })));
        setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((property) => ({
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
          setError(readError(loadError, "Floors could not be loaded."));
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

  async function handleSave() {
    if (!draft.buildingId || !draft.floorNumber.trim()) {
      setFormError("Building and floor number are required.");
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        buildingId: Number(draft.buildingId),
        floorCode: draft.floorCode,
        floorName: draft.floorName,
        floorNumber: Number(draft.floorNumber),
        status: draft.status,
      };
      if (editingFloor) {
        await floorApi.updateFloor(editingFloor.id, payload);
      } else {
        await floorApi.createFloor(payload);
      }
      setIsDrawerOpen(false);
      setEditingFloor(null);
      setDraft(defaultForm);
      const refreshed = await floorApi.getFloors();
      setFloors((refreshed.data.data as Array<FloorRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string }>).map((floor) => ({
        ...floor,
        id: String(floor.id),
        companyId: String(floor.companyId),
        propertyId: String(floor.propertyId),
        buildingId: String(floor.buildingId),
      })));
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Floor could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Floor management" subtitle="Create floors inside each building and keep numbering and status controlled from master data.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <SectionCard title="Floor register" eyebrow="Property Management">
        <div className="mb-4 flex justify-end">
          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={() => { setEditingFloor(null); setDraft(defaultForm); setFormError(null); setIsDrawerOpen(true); }} type="button">
            Create floor
          </button>
        </div>
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading floors...</div>
        ) : (
          <DataTable
            rows={floors}
            columns={[
              { key: "floorCode", header: "Code" },
              { key: "floorName", header: "Floor" },
              { key: "floorNumber", header: "Number" },
              { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" },
              { key: "buildingName", header: "Building", render: (row) => row.buildingName || "Not set" },
              { key: "status", header: "Status", render: (row) => formatOptionLabel(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => { setEditingFloor(row); setDraft({ propertyId: row.propertyId, buildingId: row.buildingId, floorCode: row.floorCode, floorName: row.floorName, floorNumber: String(row.floorNumber), status: row.status }); setFormError(null); setIsDrawerOpen(true); }} type="button">Edit</button>
                    <button className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={async () => { try { await floorApi.deleteFloor(row.id); setFloors((current) => current.filter((item) => item.id !== row.id)); } catch (deleteError: unknown) { setError(readError(deleteError, "Floor could not be deleted.")); } }} type="button">Delete</button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer description="Floors are created under buildings, and the building determines the property context automatically." open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingFloor ? editingFloor.floorName : "Create floor"}>
        <div className="grid gap-4">
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <CompanyContextBanner companyName={activeCompany?.companyName} />
          <label className="grid gap-2 text-sm font-medium">
            Property
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, propertyId: event.target.value, buildingId: "" }))} value={draft.propertyId}>
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
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, buildingId: event.target.value }))} value={draft.buildingId}>
              <option value="">Select building</option>
              {availableBuildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingName} ({building.buildingCode})
                </option>
              ))}
            </select>
          </label>
          {(["floorCode", "floorName", "floorNumber"] as const).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-medium">
              {field.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}
              <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} value={draft[field]} />
            </label>
          ))}
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
            {isSaving ? "Saving..." : editingFloor ? "Update floor" : "Create floor"}
          </button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}
