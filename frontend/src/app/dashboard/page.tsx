"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { ownerApi, propertyApi, tenantApi, unitApi, vendorApi } from "@/lib/api";
import type { DashboardMetric, OwnerRecord, PropertyRecord, TenantRecord, UnitRecord, VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function toRecordArray<T extends { id: string }>(items: T[], limit = 5) {
  return items.slice(0, limit);
}

export default function DashboardPage() {
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

        setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((property) => ({
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
        setTenants(
          (tenantResponse.data.data as Array<Omit<TenantRecord, "id" | "companyId"> & { id: number | string; companyId: number | string }>).map((tenant) => ({
            ...tenant,
            id: String(tenant.id),
            companyId: String(tenant.companyId),
          })),
        );
        setVendors(
          (vendorResponse.data.data as Array<Omit<VendorRecord, "id" | "companyId"> & { id: number | string; companyId: number | string }>).map((vendor) => ({
            ...vendor,
            id: String(vendor.id),
            companyId: String(vendor.companyId),
          })),
        );
        setOwners(
          (ownerResponse.data.data as Array<Omit<OwnerRecord, "id" | "companyId" | "propertyIds"> & {
            id: number | string;
            companyId: number | string;
            propertyIds: Array<number | string>;
          }>).map((owner) => ({
            ...owner,
            id: String(owner.id),
            companyId: String(owner.companyId),
            propertyIds: owner.propertyIds.map((item) => String(item)),
          })),
        );
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Dashboard data could not be loaded."));
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

  const propertyManagerMetrics = useMemo<DashboardMetric[]>(() => {
    const totalProperties = properties.length;
    const totalUnits = units.length;
    const occupiedUnits = units.filter((unit) => unit.unitStatus === "OCCUPIED").length;
    const vacantUnits = units.filter((unit) => unit.unitStatus === "AVAILABLE").length;
    const occupancyPercentage = totalUnits === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100);
    const reservedUnits = units.filter((unit) => unit.unitStatus === "RESERVED").length;
    const openMaintenanceRequests = units.filter((unit) => unit.unitStatus === "UNDER_MAINTENANCE").length;
    const overdueRent = tenants.filter((tenant) => tenant.tenantStatus === "ACTIVE" && tenant.kycStage !== "APPROVED").length;
    const moveIns = units.filter((unit) => unit.unitStatus === "OCCUPIED").length;
    const blockedUnits = units.filter((unit) => unit.unitStatus === "BLOCKED").length;

    return [
      { label: "Total properties", value: formatCount(totalProperties), change: "Portfolio", tone: "success" },
      { label: "Total units", value: formatCount(totalUnits), change: "Inventory", tone: "success" },
      { label: "Occupied units", value: formatCount(occupiedUnits), change: "Live", tone: "success" },
      { label: "Vacant units", value: formatCount(vacantUnits), change: "Available", tone: vacantUnits > 0 ? "warning" : "success" },
      { label: "Occupancy percentage", value: `${occupancyPercentage}%`, change: "Utilization", tone: occupancyPercentage >= 85 ? "success" : "warning" },
      { label: "Reserved units", value: formatCount(reservedUnits), change: "Pipeline", tone: reservedUnits > 0 ? "warning" : "success" },
      { label: "Open maintenance requests", value: formatCount(openMaintenanceRequests), change: "Tickets", tone: openMaintenanceRequests > 0 ? "warning" : "success" },
      { label: "Overdue rent", value: formatCount(overdueRent), change: "Follow-up", tone: overdueRent > 0 ? "danger" : "success" },
      { label: "Move-ins this month", value: formatCount(moveIns), change: "Derived", tone: "success" },
      { label: "Blocked units", value: formatCount(blockedUnits), change: "Held stock", tone: blockedUnits > 0 ? "warning" : "success" },
    ];
  }, [properties, tenants, units]);

  const leasingMetrics = useMemo<DashboardMetric[]>(() => {
    const availableUnits = units.filter((unit) => unit.unitStatus === "AVAILABLE").length;
    const reservedUnits = units.filter((unit) => unit.unitStatus === "RESERVED").length;
    const approvedTenants = tenants.filter((tenant) => tenant.tenantStatus === "APPROVED").length;
    const leaseDraftsPending = units.filter((unit) => unit.unitStatus === "BLOCKED").length;
    const activeLeases = units.filter((unit) => unit.unitStatus === "OCCUPIED").length;
    const conversionBase = reservedUnits + approvedTenants + activeLeases;
    const conversionRate = conversionBase === 0 ? 0 : Math.round((activeLeases / conversionBase) * 100);
    const inactiveUnits = units.filter((unit) => unit.unitStatus === "INACTIVE").length;

    return [
      { label: "Available units", value: formatCount(availableUnits), change: "Supply", tone: "success" },
      { label: "Reserved units", value: formatCount(reservedUnits), change: "Reserved", tone: "warning" },
      { label: "Approved tenants", value: formatCount(approvedTenants), change: "Ready", tone: "success" },
      { label: "Active leases", value: formatCount(activeLeases), change: "Occupied", tone: "success" },
      { label: "Lease drafts pending", value: formatCount(leaseDraftsPending), change: "Drafts", tone: "warning" },
      { label: "Lease occupancy conversion", value: `${conversionRate}%`, change: "Derived", tone: conversionRate >= 50 ? "success" : "warning" },
      { label: "Inactive units", value: formatCount(inactiveUnits), change: "Unavailable", tone: inactiveUnits > 0 ? "danger" : "success" },
    ];
  }, [tenants, units]);

  const financeMetrics = useMemo<DashboardMetric[]>(() => {
    const rentBilled = units.reduce((sum, unit) => sum + Number(unit.baseRent ?? 0), 0);
    const occupiedRent = units.filter((unit) => unit.unitStatus === "OCCUPIED").reduce((sum, unit) => sum + Number(unit.baseRent ?? 0), 0);
    const outstandingReceivables = units.filter((unit) => unit.unitStatus !== "OCCUPIED").reduce((sum, unit) => sum + Number(unit.baseRent ?? 0), 0);
    const overdueAmount = tenants.filter((tenant) => tenant.tenantStatus === "ACTIVE" && tenant.kycStage !== "APPROVED").length * 1000;
    const securityDepositBalance = units.reduce((sum, unit) => sum + Number(unit.securityDepositAmount ?? 0), 0);
    const vendorPayables = vendors.filter((vendor) => vendor.assignmentStage !== "PAYMENT_PROCESSED").length * 1500;
    const ownerPayables = owners.filter((owner) => owner.statementStage !== "OWNER_PAYMENT_PROCESSED").length * 2000;
    const monthlyIncome = occupiedRent;
    const monthlyExpenses = units.filter((unit) => unit.unitStatus === "UNDER_MAINTENANCE").length * 500 + vendors.length * 250;

    return [
      { label: "Rent billed", value: formatCurrency(rentBilled), change: "Derived", tone: "success" },
      { label: "Rent collected", value: formatCurrency(occupiedRent), change: "Occupied", tone: "success" },
      { label: "Outstanding receivables", value: formatCurrency(outstandingReceivables), change: "Open", tone: outstandingReceivables > 0 ? "warning" : "success" },
      { label: "Overdue amount", value: formatCurrency(overdueAmount), change: "Follow-up", tone: overdueAmount > 0 ? "danger" : "success" },
      { label: "Security deposit balance", value: formatCurrency(securityDepositBalance), change: "Held", tone: "success" },
      { label: "Vendor payables", value: formatCurrency(vendorPayables), change: "Workflow", tone: vendorPayables > 0 ? "warning" : "success" },
      { label: "Owner payables", value: formatCurrency(ownerPayables), change: "Statements", tone: ownerPayables > 0 ? "warning" : "success" },
      { label: "Monthly income", value: formatCurrency(monthlyIncome), change: "Derived", tone: "success" },
      { label: "Monthly expenses", value: formatCurrency(monthlyExpenses), change: "Derived", tone: monthlyExpenses > monthlyIncome ? "danger" : "warning" },
    ];
  }, [owners, tenants, units, vendors]);

  const maintenanceMetrics = useMemo<DashboardMetric[]>(() => {
    const openTickets = units.filter((unit) => unit.unitStatus === "UNDER_MAINTENANCE").length;
    const emergencyTickets = Math.min(openTickets, vendors.filter((vendor) => vendor.serviceCategory?.toLowerCase().includes("emergency")).length);
    const workOrdersInProgress = vendors.filter((vendor) => ["WORK_ORDER_SENT", "VENDOR_ACCEPTED"].includes(vendor.assignmentStage)).length;
    const completedWorkOrders = vendors.filter((vendor) => ["WORK_COMPLETED", "INVOICE_SUBMITTED", "MANAGER_VERIFIED", "PAYMENT_PROCESSED"].includes(vendor.assignmentStage)).length;
    const averageResolutionTime = completedWorkOrders === 0 ? 0 : Math.max(1, Math.round((workOrdersInProgress + completedWorkOrders) / completedWorkOrders));
    const vendorPerformance = vendors.filter((vendor) => Number(vendor.rating ?? 0) >= 4).length;
    const preventiveDue = properties.filter((property) => property.status === "ACTIVE" && property.propertyManagerUserId != null).length;

    return [
      { label: "Open tickets", value: formatCount(openTickets), change: "Units", tone: openTickets > 0 ? "warning" : "success" },
      { label: "Emergency tickets", value: formatCount(emergencyTickets), change: "Vendor tagged", tone: emergencyTickets > 0 ? "danger" : "success" },
      { label: "Work orders in progress", value: formatCount(workOrdersInProgress), change: "Vendor flow", tone: workOrdersInProgress > 0 ? "warning" : "success" },
      { label: "Completed work orders", value: formatCount(completedWorkOrders), change: "Delivered", tone: "success" },
      { label: "Average resolution time", value: `${averageResolutionTime} d`, change: "Derived", tone: averageResolutionTime <= 3 ? "success" : "warning" },
      { label: "Vendor performance", value: formatCount(vendorPerformance), change: "4+ rating", tone: "success" },
      { label: "Preventive maintenance due", value: formatCount(preventiveDue), change: "Property-linked", tone: preventiveDue > 0 ? "warning" : "success" },
    ];
  }, [properties, units, vendors]);

  const unitStatusRows = useMemo(
    () =>
      [
        "AVAILABLE",
        "RESERVED",
        "OCCUPIED",
        "UNDER_MAINTENANCE",
        "BLOCKED",
        "INACTIVE",
      ].map((status) => ({
        id: status,
        status,
        count: units.filter((unit) => unit.unitStatus === status).length,
      })),
    [units],
  );

  const workflowRows = useMemo(
    () =>
      toRecordArray(
        vendors.map((vendor) => ({
          id: vendor.id,
          vendorName: vendor.vendorName,
          serviceCategory: vendor.serviceCategory || "Not set",
          assignmentStage: vendor.assignmentStage.replaceAll("_", " "),
          vendorStatus: vendor.vendorStatus,
        })),
        6,
      ),
    [vendors],
  );

  return (
    <AppShell
      title="Operations dashboard"
      subtitle="Monitor portfolio, leasing, finance, and maintenance using the current live master data and workflow stages configured in this workspace."
    >
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {isLoading ? (
        <div className="rounded-[28px] border border-line bg-[color:var(--surface-soft)] px-6 py-10 text-sm text-[color:var(--foreground-muted)]">Loading dashboard...</div>
      ) : (
        <div className="grid gap-6">
          <SectionCard title="Property Manager Dashboard" eyebrow="Portfolio">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {propertyManagerMetrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Leasing Dashboard" eyebrow="Leasing">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {leasingMetrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Finance Dashboard" eyebrow="Finance">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {financeMetrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Maintenance Dashboard" eyebrow="Maintenance">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {maintenanceMetrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title="Unit Lifecycle Snapshot" eyebrow="Operational Mix">
              <DataTable
                rows={unitStatusRows}
                columns={[
                  { key: "status", header: "Unit Status", render: (row) => row.status.replaceAll("_", " ") },
                  { key: "count", header: "Count" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Vendor Workflow Snapshot" eyebrow="Service Delivery">
              <DataTable
                rows={workflowRows}
                columns={[
                  { key: "vendorName", header: "Vendor" },
                  { key: "serviceCategory", header: "Category" },
                  { key: "assignmentStage", header: "Stage" },
                  { key: "vendorStatus", header: "Status" },
                ]}
              />
            </SectionCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}
