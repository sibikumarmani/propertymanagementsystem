"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { UserMenuOverrideFields } from "@/components/admin/menu-access-fields";
import { useForm, useWatch } from "react-hook-form";
import { Camera } from "lucide-react";
import { z } from "zod";

const userSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().trim().optional(),
  password: z.string().trim().optional(),
  roleIds: z.array(z.string()).min(1, "At least one role is required"),
  companyIds: z.array(z.string()).min(1, "At least one company is required"),
  defaultCompanyId: z.string().min(1, "Default company is required"),
  menuAccessOverrides: z.record(z.string(), z.enum(["INHERIT", "ALLOW", "DENY"])),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  emailVerified: z.boolean(),
  avatarImage: z.string().nullable(),
}).superRefine((values, context) => {
  if (values.password && values.password.length > 0 && values.password.length < 8) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 8 characters",
      path: ["password"],
    });
  }
  if (values.defaultCompanyId && !values.companyIds.includes(values.defaultCompanyId)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Default company must be one of the selected companies",
      path: ["defaultCompanyId"],
    });
  }
});

export type UserFormValues = z.infer<typeof userSchema>;
type UserFormInput = z.input<typeof userSchema>;

type UserFormProps = {
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel: () => void;
  initialValues?: UserFormValues;
  roleOptions: Array<{ id: string; roleName: string }>;
  companyOptions: Array<{ id: string; companyName: string; companyCode?: string | null; status?: string }>;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  isEditing?: boolean;
};

const defaultValues: UserFormInput = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  roleIds: [],
  companyIds: [],
  defaultCompanyId: "",
  menuAccessOverrides: {},
  status: "ACTIVE",
  emailVerified: true,
  avatarImage: null,
};

function getInitials(fullName: string) {
  const initials = fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "US";
}

export function UserForm({
  onSubmit,
  onCancel,
  initialValues,
  roleOptions,
  companyOptions,
  submitLabel = "Save",
  isSubmitting = false,
  error,
  isEditing = false,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialValues ?? defaultValues,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const avatarImage = useWatch({ control, name: "avatarImage" });
  const fullName = useWatch({ control, name: "fullName" }) ?? "";
  const selectedCompanies = useWatch({ control, name: "companyIds" }) ?? [];
  const menuAccessOverrides = useWatch({ control, name: "menuAccessOverrides" }) ?? {};

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setValue("avatarImage", reader.result, { shouldDirty: true, shouldValidate: true });
        setUploadFeedback("Profile image selected. Save the user to keep it.");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="md:col-span-2 rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            {avatarImage ? (
              <Image
                alt="User avatar preview"
                className="h-24 w-24 rounded-full object-cover shadow-lg"
                height={96}
                src={avatarImage}
                unoptimized
                width={96}
              />
            ) : (
              <div className="topbar-shade flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg">
                {getInitials(fullName)}
              </div>
            )}
            <button
              className="btn-secondary absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-brand shadow-md transition hover:bg-[color:var(--brand-soft)]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              ref={fileInputRef}
              type="file"
            />
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-brand-strong">User profile image</p>
            <p className="text-xs leading-5 text-[color:var(--foreground-muted)]">
              Upload an image during create or edit. It will be saved with the user record.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-[color:var(--surface-muted)]"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Upload Image
              </button>
              {avatarImage ? (
                <button
                  className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  onClick={() => {
                    setValue("avatarImage", null, { shouldDirty: true, shouldValidate: true });
                    setUploadFeedback("Profile image removed. Save the user to keep this change.");
                  }}
                  type="button"
                >
                  Remove Image
                </button>
              ) : null}
            </div>
            {uploadFeedback ? <p className="text-xs text-[color:var(--foreground-muted)]">{uploadFeedback}</p> : null}
          </div>
        </div>
      </div>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Full Name</span>
        <input {...register("fullName")} className="field w-full rounded-2xl px-4 py-3 ring-0" type="text" />
        <span className="mt-2 block text-xs text-rose-600">{errors.fullName?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Email</span>
        <input {...register("email")} className="field w-full rounded-2xl px-4 py-3 ring-0" type="email" />
        <span className="mt-2 block text-xs text-rose-600">{errors.email?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Phone Number</span>
        <input {...register("phone")} className="field w-full rounded-2xl px-4 py-3 ring-0" type="text" />
        <span className="mt-2 block text-xs text-rose-600">{errors.phone?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">{isEditing ? "New Password (Optional)" : "Password"}</span>
        <input
          {...register("password")}
          className="field w-full rounded-2xl px-4 py-3 ring-0"
          placeholder={isEditing ? "Leave blank to keep the current password" : "Minimum 8 characters"}
          type="password"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.password?.message}</span>
      </label>

      <div className="rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
        <span className="mb-3 block text-sm font-semibold text-brand-strong">Roles</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {roleOptions.map((role) => (
            <label key={role.id} className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
              <input {...register("roleIds")} className="h-4 w-4" type="checkbox" value={role.id} />
              <span className="text-sm font-semibold text-brand-strong">{role.roleName.replaceAll("_", " ")}</span>
            </label>
          ))}
        </div>
        <span className="mt-2 block text-xs text-rose-600">{errors.roleIds?.message}</span>
      </div>

      <div className="rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
        <span className="mb-3 block text-sm font-semibold text-brand-strong">Companies</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {companyOptions.map((company) => (
            <label key={company.id} className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
              <input {...register("companyIds")} className="h-4 w-4" type="checkbox" value={company.id} />
              <span className="text-sm font-semibold text-brand-strong">{company.companyName}</span>
            </label>
          ))}
        </div>
        <span className="mt-2 block text-xs text-rose-600">{errors.companyIds?.message}</span>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Default Company</span>
        <select {...register("defaultCompanyId")} className="field w-full rounded-2xl px-4 py-3 ring-0">
          <option value="">Select default company</option>
          {companyOptions
            .filter((company) => selectedCompanies.includes(company.id))
            .map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.defaultCompanyId?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
        <select {...register("status")} className="field w-full rounded-2xl px-4 py-3 ring-0">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.status?.message}</span>
      </label>

      <div className="md:col-span-2">
        <span className="mb-3 block text-sm font-semibold text-brand-strong">User Menu Overrides</span>
        <p className="mb-4 text-xs leading-5 text-[color:var(--foreground-muted)]">
          Role access is applied first. Set a menu to Allow or Deny here only when this specific user needs an override.
        </p>
        <UserMenuOverrideFields
          onChange={(menuKey, value) => {
            const nextValues = {
              ...menuAccessOverrides,
              [menuKey]: value,
            };
            setValue("menuAccessOverrides", nextValues, { shouldDirty: true, shouldValidate: true });
          }}
          values={menuAccessOverrides as Record<string, "INHERIT" | "ALLOW" | "DENY">}
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
        <input {...register("emailVerified")} className="h-4 w-4" type="checkbox" />
        <span className="text-sm font-semibold text-brand-strong">Email verified</span>
      </label>

      {error ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
        <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
