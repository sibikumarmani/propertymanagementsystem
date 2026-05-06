"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { accountingApi, maintenanceApi, ownerApi, propertyApi, unitApi } from "@/lib/api";
import type { AccountingEntryRecord, MaintenanceRequestRecord, OwnerRecord, PropertyRecord, UnitRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) { if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message; return fallback; }
function id(value: string | number | null | undefined) { return value == null ? null : String(value); }
function sameEmail(a?: string | null, b?: string | null) { return !!a && !!b && a.toLowerCase() === b.toLowerCase(); }
function money(value: number | null | undefined) { return (value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
async function safeData<T>(request: Promise<{ data: { data: T } }>, fallback: T): Promise<T> { try { return (await request).data.data; } catch { return fallback; } }

export default function OwnerPortalPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [entries, setEntries] = useState<AccountingEntryRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [ownerData, propertyData, unitData, entryData, maintenanceData] = await Promise.all([safeData(ownerApi.getOwners(), []), safeData(propertyApi.getProperties(), []), safeData(unitApi.getUnits(), []), safeData(accountingApi.getEntries(), []), safeData(maintenanceApi.getRequests(), [])]);
    setOwners((ownerData as Array<OwnerRecord & { id: number | string; propertyIds: Array<number | string> }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyIds: item.propertyIds.map(String) })));
    setProperties((propertyData as Array<PropertyRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: id(item.branchId), propertyManagerUserId: id(item.propertyManagerUserId), documentAttachments: item.documentAttachments ?? [] })));
    setUnits((unitData as Array<UnitRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: item.photoAttachments ?? [], documentAttachments: item.documentAttachments ?? [] })));
    setEntries((entryData as Array<AccountingEntryRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), partyId: id(item.partyId), propertyId: id(item.propertyId), unitId: id(item.unitId), sourceId: String(item.sourceId) })));
    setMaintenance((maintenanceData as Array<MaintenanceRequestRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId), assignedVendorId: id(item.assignedVendorId), assignedUserId: id(item.assignedUserId), attachments: item.attachments ?? [] })));
  }, []);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) return;
    let cancelled = false;
    async function run() { try { setIsLoading(true); await loadAll(); if (!cancelled) setError(null); } catch (loadError) { if (!cancelled) setError(readError(loadError, "Owner portal data could not be loaded.")); } finally { if (!cancelled) setIsLoading(false); } }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient, loadAll]);

  const owner = useMemo(() => owners.find((item) => sameEmail(item.email, user?.email)) ?? null, [owners, user?.email]);
  const propertyIds = owner?.propertyIds ?? [];
  const ownerProperties = properties.filter((item) => propertyIds.includes(item.id));
  const ownerUnits = units.filter((item) => propertyIds.includes(item.propertyId));
  const occupied = ownerUnits.filter((item) => item.unitStatus === "OCCUPIED").length;
  const ownerEntries = owner ? entries.filter((item) => item.partyType === "OWNER" && item.partyId === owner.id) : [];
  const propertyExpenses = entries.filter((item) => propertyIds.includes(item.propertyId ?? "") && item.accountType === "EXPENSE");
  const income = ownerEntries.reduce((sum, item) => sum + item.creditAmount, 0);
  const expenses = propertyExpenses.reduce((sum, item) => sum + item.debitAmount, 0);
  const maintenanceExpenses = maintenance.filter((item) => propertyIds.includes(item.propertyId));

  return (
    <AppShell title="Owner Portal" subtitle="Properties, occupancy, income, expenses, statements, reports, and maintenance costs">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? <div className="panel rounded-[28px] p-8 text-sm">Loading owner portal...</div> : !owner ? <SectionCard title="Owner profile not linked"><p className="text-sm text-[color:var(--foreground-muted)]">No owner record matches {user?.email}.</p></SectionCard> : (
        <div className="space-y-6">
          <SectionCard title="Owner Summary"><div className="grid gap-4 md:grid-cols-3"><StatCard label="Properties owned" value={String(ownerProperties.length)} change="Mapped portfolio" tone="success" /><StatCard label="Occupancy" value={`${ownerUnits.length ? Math.round((occupied / ownerUnits.length) * 100) : 0}%`} change={`${occupied}/${ownerUnits.length} units`} tone="success" /><StatCard label="Net payable" value={money(income - expenses)} change="Income minus expenses" tone="success" /><StatCard label="Rent income" value={money(income)} change="Owner ledger" tone="success" /><StatCard label="Expenses" value={money(expenses)} change="Property expenses" tone={expenses > income ? "danger" : "warning"} /></div></SectionCard>
          <div className="grid gap-6 xl:grid-cols-2"><SectionCard title="Properties"><DataTable rows={ownerProperties} columns={[{ key: "propertyCode", header: "Code" }, { key: "propertyName", header: "Property" }, { key: "city", header: "City" }, { key: "status", header: "Status" }]} /></SectionCard><SectionCard title="Occupancy"><DataTable rows={ownerUnits} columns={[{ key: "unitNumber", header: "Unit" }, { key: "propertyName", header: "Property" }, { key: "unitStatus", header: "Status" }, { key: "baseRent", header: "Rent", render: (row) => money(row.baseRent) }]} /></SectionCard></div>
          <SectionCard title="Owner Statement" action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => window.print()}>Download reports</button>}><DataTable rows={ownerEntries} columns={[{ key: "entryDate", header: "Date" }, { key: "sourceReference", header: "Reference" }, { key: "description", header: "Description" }, { key: "creditAmount", header: "Credit", render: (row) => money(row.creditAmount) }, { key: "debitAmount", header: "Debit", render: (row) => money(row.debitAmount) }]} /></SectionCard>
          <SectionCard title="Maintenance Expenses"><DataTable rows={maintenanceExpenses} columns={[{ key: "requestNumber", header: "Request" }, { key: "propertyName", header: "Property" }, { key: "priority", header: "Priority" }, { key: "actualCost", header: "Actual Cost", render: (row) => money(row.actualCost) }, { key: "status", header: "Status" }]} /></SectionCard>
        </div>
      )}
    </AppShell>
  );
}
