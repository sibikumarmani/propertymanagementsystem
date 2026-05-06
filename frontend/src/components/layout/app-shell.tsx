"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useIsClient } from "@/hooks/use-is-client";
import { accountApi } from "@/lib/api";
import { getMenuKeyForPath, hasAdminRole, hasMenuAccess } from "@/lib/access";
import { navigationGroups } from "@/lib/navigation";
import { useAppStore } from "@/store/app-store";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { MenuBar } from "@/components/layout/menu-bar";
import { TopBar } from "@/components/layout/top-bar";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, hasHydrated, user, clearAuth, updateUser, pendingCompanySelectionToken } = useAppStore();
  const isClient = useIsClient();
  const isAdminUser = hasAdminRole(user?.roles);
  const currentMenuKey = getMenuKeyForPath(pathname);
  const hasResolvedMenuAccess = Array.isArray(user?.menuAccessKeys);
  const visibleNavigationGroups = useMemo(
    () =>
      navigationGroups
        .filter((group) => !group.adminOnly || isAdminUser)
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => (!item.adminOnly || isAdminUser) && (!hasResolvedMenuAccess || hasMenuAccess(user?.menuAccessKeys, item.key))),
        }))
        .filter((group) => group.items.length > 0),
    [hasResolvedMenuAccess, isAdminUser, user?.menuAccessKeys],
  );
  const fallbackHref = visibleNavigationGroups[0]?.items[0]?.href ?? "/login";
  const userInitials = user?.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "PA";

  useEffect(() => {
    if (!isClient || !hasHydrated) {
      return;
    }

    if (!accessToken) {
      if (pendingCompanySelectionToken) {
        router.replace("/select-company");
        return;
      }
      router.replace("/login");
    }
  }, [accessToken, hasHydrated, isClient, pendingCompanySelectionToken, router]);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }

    if (hasResolvedMenuAccess && currentMenuKey && !hasMenuAccess(user?.menuAccessKeys, currentMenuKey)) {
      router.replace(fallbackHref);
    }
  }, [accessToken, currentMenuKey, fallbackHref, hasHydrated, hasResolvedMenuAccess, isClient, pathname, router, user?.menuAccessKeys]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    async function syncProfile() {
      try {
        const response = await accountApi.getProfile();
        if (cancelled) {
          return;
        }

        const profile = response.data.data;
        updateUser({
          fullName: profile.fullName,
          userCode: profile.userCode,
          email: profile.email,
          phone: profile.phone,
          roles: profile.roles,
          menuAccessKeys: profile.menuAccessKeys,
          activeCompany: profile.activeCompany,
          avatarImage: profile.avatarImage,
        });
      } catch {
        return;
      }
    }

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken, updateUser]);

  if (!isClient || !hasHydrated || !accessToken || (hasResolvedMenuAccess && currentMenuKey && !hasMenuAccess(user?.menuAccessKeys, currentMenuKey))) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="panel rounded-[28px] px-8 py-6 text-sm font-semibold text-brand-strong">Checking session...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-x-0 top-0 z-40 overflow-visible">
        <TopBar
          appName="Property Management Administration"
          avatarLabel={userInitials}
          userName={user?.fullName ?? "User"}
          userEmail={user?.email ?? ""}
          userCode={user?.userCode ?? ""}
          avatarImage={user?.avatarImage ?? null}
          userRole={[...(user?.roles ?? []), user?.activeCompany?.companyName].filter(Boolean).join(" • ") || user?.email || "Member"}
          onProfileSave={async ({ fullName, avatarImage }) => {
            const response = await accountApi.updateProfile({ fullName, avatarImage });
            const profile = response.data.data;
            updateUser({
              fullName: profile.fullName,
              userCode: profile.userCode,
              email: profile.email,
              phone: profile.phone,
              roles: profile.roles,
              menuAccessKeys: profile.menuAccessKeys,
              activeCompany: profile.activeCompany,
              avatarImage: profile.avatarImage,
            });
          }}
          onPasswordChange={async ({ currentPassword, newPassword }) => {
            await accountApi.changePassword({ currentPassword, newPassword });
          }}
          onLogout={() => {
            clearAuth();
            router.replace("/login");
          }}
        />
        <MenuBar key={pathname} groups={visibleNavigationGroups} />
      </div>

      <LayoutWrapper title={title} subtitle={subtitle}>
        {children}
      </LayoutWrapper>

      <Link
        href="/agent"
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-[color:var(--on-brand)] shadow-[0_20px_45px_rgba(16,39,56,0.26)] transition hover:-translate-y-0.5 hover:brightness-105"
      >
        <Sparkles className="h-4 w-4" />
        <span>Agent</span>
      </Link>
    </div>
  );
}
