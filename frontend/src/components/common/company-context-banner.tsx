type CompanyContextBannerProps = {
  companyName?: string | null;
};

export function CompanyContextBanner({ companyName }: CompanyContextBannerProps) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      Company
      <input
        className="field w-full rounded-2xl px-4 py-3 text-[color:var(--foreground-muted)] ring-0 disabled:cursor-not-allowed disabled:opacity-75"
        disabled
        readOnly
        value={companyName || "No active company selected"}
      />
    </label>
  );
}
