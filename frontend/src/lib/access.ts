"use client";

export const ADMIN_ROLE = "ADMIN";

export function hasAdminRole(roles: string[] | null | undefined) {
  return (roles ?? []).some((role) => role.toUpperCase() === ADMIN_ROLE);
}

export function hasMenuAccess(menuAccessKeys: string[] | null | undefined, menuKey: string) {
  return (menuAccessKeys ?? []).includes(menuKey);
}

export function getMenuKeyForPath(pathname: string) {
  const routeMap = [
    { route: "/dashboard", menuKey: "dashboard" },
    { route: "/reports", menuKey: "reports" },
    { route: "/notifications", menuKey: "notifications" },
    { route: "/users", menuKey: "users" },
    { route: "/user-access", menuKey: "users" },
    { route: "/roles", menuKey: "roles" },
    { route: "/role-access", menuKey: "roles" },
    { route: "/approvals", menuKey: "approvals" },
    { route: "/audit-logs", menuKey: "audit-logs" },
    { route: "/companies", menuKey: "companies" },
    { route: "/branches", menuKey: "branches" },
    { route: "/properties", menuKey: "properties" },
    { route: "/buildings", menuKey: "buildings" },
    { route: "/floors", menuKey: "floors" },
    { route: "/leases", menuKey: "leases" },
    { route: "/rent-billing", menuKey: "rent-billing" },
    { route: "/accounting", menuKey: "accounting" },
    { route: "/maintenance", menuKey: "maintenance" },
    { route: "/utilities", menuKey: "utilities" },
    { route: "/assets", menuKey: "assets" },
    { route: "/inspections", menuKey: "inspections" },
    { route: "/purchase-expenses", menuKey: "purchase-expenses" },
    { route: "/documents", menuKey: "documents" },
    { route: "/units", menuKey: "units" },
    { route: "/tenants", menuKey: "tenants" },
    { route: "/vendors", menuKey: "vendors" },
    { route: "/owners", menuKey: "owners" },
  ];

  return routeMap.find(({ route }) => pathname === route || pathname.startsWith(`${route}/`))?.menuKey ?? null;
}
