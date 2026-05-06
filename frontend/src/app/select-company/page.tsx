"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return "Company selection could not be completed.";
}

export default function SelectCompanyPage() {
  const router = useRouter();
  const {
    hasHydrated,
    accessToken,
    pendingCompanySelectionToken,
    availableCompanies,
    user,
    setAuth,
    clearAuth,
  } = useAppStore();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCompanyId = useMemo(
    () => availableCompanies.find((company) => company.defaultCompany)?.id ?? availableCompanies[0]?.id ?? null,
    [availableCompanies],
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (accessToken) {
      router.replace("/users");
      return;
    }
    if (!pendingCompanySelectionToken || availableCompanies.length === 0) {
      router.replace("/login");
      return;
    }
  }, [accessToken, availableCompanies.length, hasHydrated, pendingCompanySelectionToken, router]);

  async function handleContinue() {
    const resolvedCompanyId = selectedCompanyId ?? defaultCompanyId;
    if (!pendingCompanySelectionToken || !resolvedCompanyId) {
      setError("Select a company to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await authApi.selectCompany({
        selectionToken: pendingCompanySelectionToken,
        companyId: resolvedCompanyId,
      });
      const auth = response.data.data;
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });
      router.replace("/users");
    } catch (error: unknown) {
      setError(readError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="page-surface w-full max-w-2xl rounded-none px-8 py-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand">Select Company</p>
        <h1 className="display-font text-3xl font-semibold text-brand-strong">Choose your active company</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--foreground-muted)]">
          Welcome, {user?.fullName ?? "User"}. Select the company you want to work with for this session.
        </p>

        <div className="mt-8 grid gap-3">
          {availableCompanies.map((company) => (
            <label
              key={company.id}
              className={`flex items-center justify-between rounded-[24px] border px-5 py-4 transition ${
                selectedCompanyId === company.id
                  ? "border-[color:var(--brand)] bg-[color:var(--brand-tint)]"
                  : "border-line bg-[color:var(--surface-raised)]"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-brand-strong">{company.companyName}</p>
                <p className="mt-1 text-xs text-[color:var(--foreground-muted)]">
                  {company.companyCode || "No company code"}
                  {company.defaultCompany ? " • Default company" : ""}
                </p>
              </div>
              <input
                checked={(selectedCompanyId ?? defaultCompanyId) === company.id}
                className="h-4 w-4"
                name="company"
                onChange={() => setSelectedCompanyId(company.id)}
                type="radio"
              />
            </label>
          ))}
        </div>

        {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            className="rounded-full border border-line bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
            onClick={() => {
              clearAuth();
              router.replace("/login");
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="topbar-shade rounded-full px-5 py-3 text-sm font-semibold text-white" onClick={() => void handleContinue()} type="button">
            {isSubmitting ? "Continuing..." : "Continue"}
          </button>
        </div>
      </section>
    </main>
  );
}
