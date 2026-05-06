package com.company.pms.security;

import java.util.List;
import java.util.Set;

public final class MenuPermission {

    public static final String USERS = "users";
    public static final String DASHBOARD = "dashboard";
    public static final String REPORTS = "reports";
    public static final String ROLES = "roles";
    public static final String COMPANIES = "companies";
    public static final String BRANCHES = "branches";
    public static final String PROPERTIES = "properties";
    public static final String BUILDINGS = "buildings";
    public static final String FLOORS = "floors";
    public static final String UNITS = "units";
    public static final String LEASES = "leases";
    public static final String RENT_BILLING = "rent-billing";
    public static final String MAINTENANCE = "maintenance";
    public static final String UTILITIES = "utilities";
    public static final String ASSETS = "assets";
    public static final String INSPECTIONS = "inspections";
    public static final String PURCHASE_EXPENSES = "purchase-expenses";
    public static final String TENANTS = "tenants";
    public static final String VENDORS = "vendors";
    public static final String OWNERS = "owners";

    private static final List<String> ALL_MENU_KEYS = List.of(
        DASHBOARD,
        REPORTS,
        USERS,
        ROLES,
        COMPANIES,
        BRANCHES,
        PROPERTIES,
        BUILDINGS,
        FLOORS,
        UNITS,
        LEASES,
        RENT_BILLING,
        MAINTENANCE,
        UTILITIES,
        ASSETS,
        INSPECTIONS,
        PURCHASE_EXPENSES,
        TENANTS,
        VENDORS,
        OWNERS
    );

    private static final Set<String> ALL_MENU_KEY_SET = Set.copyOf(ALL_MENU_KEYS);

    private MenuPermission() {
    }

    public static List<String> allMenuKeys() {
        return ALL_MENU_KEYS;
    }

    public static boolean isValid(String menuKey) {
        return ALL_MENU_KEY_SET.contains(menuKey);
    }
}
