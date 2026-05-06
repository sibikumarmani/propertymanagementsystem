"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { ownerApi, propertyApi, tenantApi, unitApi, vendorApi } from "@/lib/api";
import type { OwnerRecord, PropertyRecord, TenantRecord, UnitRecord, VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function ReportCatalog({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item} className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-4 text-sm font-medium text-[color:var(--foreground)]">
          {item}
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const [propertyResponse, unitResponse, tenantResponse, vendorResponse, ownerResponse] = await Promise.all([
          propertyApi.getProperties(),
          unitApi.getUnits(),
          tenantApi.getTenants(),
          vendorApi.getVendors(),
          ownerApi.getOwners(),
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
        setTenants((tenantResponse.data.data as Array<Omit<TenantRecord, "id" | "companyId"> & { id: number | string; companyId: number | string }>).map((tenant) => ({
          ...tenant,
          id: String(tenant.id),
          companyId: String(tenant.companyId),
        })));
        setVendors((vendorResponse.data.data as Array<Omit<VendorRecord, "id" | "companyId"> & { id: number | string; companyId: number | string }>).map((vendor) => ({
          ...vendor,
          id: String(vendor.id),
          companyId: String(vendor.companyId),
        })));
        setOwners((ownerResponse.data.data as Array<Omit<OwnerRecord, "id" | "companyId" | "propertyIds"> & {
          id: number | string;
          companyId: number | string;
          propertyIds: Array<number | string>;
        }>).map((owner) => ({
          ...owner,
          id: String(owner.id),
          companyId: String(owner.companyId),
          propertyIds: owner.propertyIds.map((item) => String(item)),
        })));
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Reports data could not be loaded."));
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

  const propertySnapshot = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        propertyCode: property.propertyCode,
        propertyName: property.propertyName,
        ownershipType: property.ownershipType,
        units: units.filter((unit) => unit.propertyId === property.id).length,
        occupied: units.filter((unit) => unit.propertyId === property.id && unit.unitStatus === "OCCUPIED").length,
      })),
    [properties, units],
  );

  const availabilitySnapshot = useMemo(
    () =>
      units.map((unit) => ({
        id: unit.id,
        unitCode: unit.unitCode,
        propertyName: unit.propertyName || "Not set",
        unitStatus: unit.unitStatus.replaceAll("_", " "),
        baseRent: unit.baseRent == null ? "Not set" : String(unit.baseRent),
      })),
    [units],
  );

  const financeSnapshot = useMemo(
    () =>
      owners.map((owner) => ({
        id: owner.id,
        ownerName: owner.ownerName,
        payoutFrequency: owner.payoutFrequency.replaceAll("_", " "),
        statementStage: owner.statementStage.replaceAll("_", " "),
        propertiesOwnedSummary: owner.propertiesOwnedSummary || "Not linked",
      })),
    [owners],
  );

  const tenantSnapshot = useMemo(
    () =>
      tenants.map((tenant) => ({
        id: tenant.id,
        tenantCode: tenant.tenantCode,
        tenantName: tenant.displayName,
        tenantStatus: tenant.tenantStatus.replaceAll("_", " "),
        kycStatus: tenant.kycStatus.replaceAll("_", " "),
      })),
    [tenants],
  );

  const maintenanceSnapshot = useMemo(
    () =>
      vendors.map((vendor) => ({
        id: vendor.id,
        vendorName: vendor.vendorName,
        serviceCategory: vendor.serviceCategory || "Not set",
        contractStatus: vendor.contractStatus.replaceAll("_", " "),
        assignmentStage: vendor.assignmentStage.replaceAll("_", " "),
      })),
    [vendors],
  );

  return (
    <AppShell
      title="Reports center"
      subtitle="Review operational report catalogs and live summary extracts for property, leasing, finance, and maintenance functions."
    >
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? (
        <div className="rounded-[28px] border border-line bg-[color:var(--surface-soft)] px-6 py-10 text-sm text-[color:var(--foreground-muted)]">Loading reports...</div>
      ) : (
        <div className="grid gap-6">
          <SectionCard title="Property Reports" eyebrow="22.1">
            <ReportCatalog
              items={[
                "Property list",
                "Unit availability report",
                "Occupancy report",
                "Vacancy report",
                "Property performance report",
                "Rent roll report",
              ]}
            />
          </SectionCard>

          <SectionCard title="Leasing Reports" eyebrow="22.2">
            <ReportCatalog
              items={[
                "Lease expiry report",
                "Lease renewal report",
                "Lease amendment report",
                "Move-in / move-out report",
              ]}
            />
          </SectionCard>

          <SectionCard title="Finance Reports" eyebrow="22.3">
            <ReportCatalog
              items={[
                "Rent collection report",
                "Outstanding rent report",
                "Tenant ledger",
                "Owner statement",
                "Security deposit report",
                "Income and expense report",
                "Vendor payable report",
                "Tax report",
              ]}
            />
          </SectionCard>

          <SectionCard title="Maintenance Reports" eyebrow="22.4">
            <ReportCatalog
              items={[
                "Maintenance ticket report",
                "Work order report",
                "Technician performance report",
                "Vendor performance report",
                "Preventive maintenance report",
                "Maintenance cost report",
              ]}
            />
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Property List Snapshot" eyebrow="Live Extract">
              <DataTable
                rows={propertySnapshot}
                columns={[
                  { key: "propertyCode", header: "Code" },
                  { key: "propertyName", header: "Property" },
                  { key: "ownershipType", header: "Ownership" },
                  { key: "units", header: "Units" },
                  { key: "occupied", header: "Occupied" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Unit Availability Snapshot" eyebrow="Live Extract">
              <DataTable
                rows={availabilitySnapshot}
                columns={[
                  { key: "unitCode", header: "Unit" },
                  { key: "propertyName", header: "Property" },
                  { key: "unitStatus", header: "Status" },
                  { key: "baseRent", header: "Base Rent" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Owner Statement Snapshot" eyebrow="Live Extract">
              <DataTable
                rows={financeSnapshot}
                columns={[
                  { key: "ownerName", header: "Owner" },
                  { key: "payoutFrequency", header: "Payout" },
                  { key: "statementStage", header: "Stage" },
                  { key: "propertiesOwnedSummary", header: "Properties" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Tenant Ledger Snapshot" eyebrow="Live Extract">
              <DataTable
                rows={tenantSnapshot}
                columns={[
                  { key: "tenantCode", header: "Tenant Code" },
                  { key: "tenantName", header: "Tenant" },
                  { key: "tenantStatus", header: "Status" },
                  { key: "kycStatus", header: "KYC" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Vendor Performance Snapshot" eyebrow="Live Extract">
              <DataTable
                rows={maintenanceSnapshot}
                columns={[
                  { key: "vendorName", header: "Vendor" },
                  { key: "serviceCategory", header: "Category" },
                  { key: "contractStatus", header: "Contract" },
                  { key: "assignmentStage", header: "Workflow" },
                ]}
              />
            </SectionCard>
          </div>

          <SectionCard title="Coverage Note" eyebrow="Current Scope">
            <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
              The dashboard and report widgets above use the live modules currently implemented in this repo: properties, units, leases, tenants, vendors, and owners.
              Lease-document, rent-ledger, maintenance-ticket, and technician-specific metrics are surfaced as report placeholders for the next module slices.
            </p>
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}
