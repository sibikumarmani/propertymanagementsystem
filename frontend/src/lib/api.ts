import axios from "axios";
import { useAppStore } from "@/store/app-store";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
  timeout: 10_000,
});

const publicApi = axios.create({
  baseURL,
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const inMemoryToken = useAppStore.getState().accessToken;

    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
      return config;
    }

    const persisted = window.localStorage.getItem("pms-auth-store");
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted) as {
          state?: { accessToken?: string | null };
        };
        const persistedToken = parsed.state?.accessToken;
        if (persistedToken) {
          config.headers.Authorization = `Bearer ${persistedToken}`;
        }
      } catch {
        window.localStorage.removeItem("pms-auth-store");
      }
    }
  }

  return config;
});

export const authApi = {
  login: (payload: { email: string; password: string }) => publicApi.post("/auth/login", payload),
  selectCompany: (payload: { selectionToken: string; companyId: number }) => publicApi.post("/auth/select-company", payload),
  register: (payload: { fullName: string; email: string; password: string }) => publicApi.post("/auth/register", payload),
  verifyEmail: (payload: { email: string; code: string }) => publicApi.post("/auth/verify-email", payload),
  resendVerificationCode: (payload: { email: string }) => publicApi.post("/auth/resend-verification-code", payload),
  verificationStatus: (payload: { email: string }) => publicApi.post("/auth/verification-status", payload),
  forgotPassword: (payload: { email: string }) => publicApi.post("/auth/forgot-password", payload),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => publicApi.post("/auth/reset-password", payload),
  refresh: (payload: { refreshToken: string }) => publicApi.post("/auth/refresh", payload),
};

export const accountApi = {
  getProfile: () => api.get("/account/me"),
  updateProfile: (payload: { fullName: string; avatarImage: string | null }) => api.put("/account/me", payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => api.post("/account/change-password", payload),
};

export const userApi = {
  getUsers: () => api.get("/users"),
  createUser: (payload: {
    fullName: string;
    email: string;
    phone?: string | null;
    password: string;
    status: string;
    emailVerified: boolean;
    avatarImage: string | null;
    roleIds: number[];
    companyIds: number[];
    defaultCompanyId: number;
    menuAccessOverrides: Array<{ menuKey: string; allowed: boolean }>;
  }) => api.post("/users", payload),
  updateUser: (
    id: string,
    payload: {
      fullName: string;
      email: string;
      phone?: string | null;
      password?: string;
      status: string;
      emailVerified: boolean;
      avatarImage: string | null;
      roleIds: number[];
      companyIds: number[];
      defaultCompanyId: number;
      menuAccessOverrides: Array<{ menuKey: string; allowed: boolean }>;
    },
  ) => api.put(`/users/${id}`, payload),
  getLatestResetCode: (id: string) => api.get(`/users/${id}/latest-reset-code`),
};

export const roleApi = {
  getRoles: () => api.get("/roles"),
  createRole: (payload: { roleName: string; description?: string | null; defaultRole: boolean; status: string; menuAccessKeys: string[] }) =>
    api.post("/roles", payload),
  updateRole: (id: string, payload: { roleName: string; description?: string | null; defaultRole: boolean; status: string; menuAccessKeys: string[] }) =>
    api.put(`/roles/${id}`, payload),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
};

export const companyApi = {
  getCompanies: () => api.get("/companies"),
  createCompany: (payload: {
    companyName: string;
    companyCode?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    gstNumber?: string | null;
    taxNumber?: string | null;
    defaultCompany: boolean;
    status: string;
  }) => api.post("/companies", payload),
  updateCompany: (
    id: string,
    payload: {
      companyName: string;
      companyCode?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postalCode?: string | null;
      gstNumber?: string | null;
      taxNumber?: string | null;
      defaultCompany: boolean;
      status: string;
    },
  ) => api.put(`/companies/${id}`, payload),
  deleteCompany: (id: string) => api.delete(`/companies/${id}`),
};

export const branchApi = {
  getBranches: () => api.get("/branches"),
  createBranch: (payload: {
    companyId: number;
    branchName: string;
    branchCode?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    status: string;
  }) => api.post("/branches", payload),
  updateBranch: (
    id: string,
    payload: {
      companyId: number;
      branchName: string;
      branchCode?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postalCode?: string | null;
      status: string;
    },
  ) => api.put(`/branches/${id}`, payload),
  deleteBranch: (id: string) => api.delete(`/branches/${id}`),
};

export const propertyApi = {
  getProperties: () => api.get("/properties"),
  createProperty: (payload: {
    branchId?: number | null;
    propertyCode: string;
    propertyName: string;
    propertyType: string;
    ownershipType: string;
    ownerReference?: string | null;
    ownershipDetails?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
    totalFloors?: number | null;
    totalUnits?: number | null;
    propertyManagerUserId?: number | null;
    amenitiesSummary?: string | null;
    documentAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    status: string;
  }) => api.post("/properties", payload),
  updateProperty: (
    id: string,
    payload: {
      branchId?: number | null;
      propertyCode: string;
      propertyName: string;
      propertyType: string;
      ownershipType: string;
      ownerReference?: string | null;
      ownershipDetails?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      pincode?: string | null;
      totalFloors?: number | null;
      totalUnits?: number | null;
      propertyManagerUserId?: number | null;
      amenitiesSummary?: string | null;
      documentAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
      status: string;
    },
  ) => api.put(`/properties/${id}`, payload),
  deleteProperty: (id: string) => api.delete(`/properties/${id}`),
};

export const buildingApi = {
  getBuildings: () => api.get("/buildings"),
  createBuilding: (payload: {
    propertyId: number;
    buildingCode: string;
    buildingName: string;
    numberOfFloors?: number | null;
    amenitiesSummary?: string | null;
    description?: string | null;
    status: string;
  }) => api.post("/buildings", payload),
  updateBuilding: (
    id: string,
    payload: {
      propertyId: number;
      buildingCode: string;
      buildingName: string;
      numberOfFloors?: number | null;
      amenitiesSummary?: string | null;
      description?: string | null;
      status: string;
    },
  ) => api.put(`/buildings/${id}`, payload),
  deleteBuilding: (id: string) => api.delete(`/buildings/${id}`),
};

export const floorApi = {
  getFloors: () => api.get("/floors"),
  createFloor: (payload: {
    buildingId: number;
    floorCode: string;
    floorName: string;
    floorNumber: number;
    status: string;
  }) => api.post("/floors", payload),
  updateFloor: (
    id: string,
    payload: {
      buildingId: number;
      floorCode: string;
      floorName: string;
      floorNumber: number;
      status: string;
    },
  ) => api.put(`/floors/${id}`, payload),
  deleteFloor: (id: string) => api.delete(`/floors/${id}`),
};

export const unitApi = {
  getUnits: () => api.get("/units"),
  getOptions: () => api.get("/units/options"),
  createUnit: (payload: {
    propertyId: number;
    buildingId: number;
    floorId: number;
    unitCode: string;
    unitNumber: string;
    unitType: string;
    areaValue?: number | null;
    areaUnit: string;
    baseRent?: number | null;
    securityDepositAmount?: number | null;
    unitStatus: string;
    availabilityDate?: string | null;
    photoAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    documentAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
  }) => api.post("/units", payload),
  updateUnit: (
    id: string,
    payload: {
      propertyId: number;
      buildingId: number;
      floorId: number;
      unitCode: string;
      unitNumber: string;
      unitType: string;
      areaValue?: number | null;
      areaUnit: string;
      baseRent?: number | null;
      securityDepositAmount?: number | null;
      unitStatus: string;
      availabilityDate?: string | null;
      photoAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
      documentAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    },
  ) => api.put(`/units/${id}`, payload),
  deleteUnit: (id: string) => api.delete(`/units/${id}`),
};

export const tenantApi = {
  getTenants: () => api.get("/tenants"),
  getOptions: () => api.get("/tenants/options"),
  createTenant: (payload: {
    tenantCode: string;
    tenantType: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    phoneNumber: string;
    email?: string | null;
    alternatePhone?: string | null;
    dateOfBirthOrRegistration?: string | null;
    idProofType?: string | null;
    idProofNumber?: string | null;
    taxNumber?: string | null;
    gstNumber?: string | null;
    emergencyContact?: string | null;
    employerDetails?: string | null;
    currentAddress?: string | null;
    permanentAddress?: string | null;
    kycStatus: string;
    blacklistStatus: string;
    tenantStatus: string;
    kycStage: string;
    idProofAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    addressProofAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    financialAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
  }) => api.post("/tenants", payload),
  updateTenant: (
    id: string,
    payload: {
      tenantCode: string;
      tenantType: string;
      firstName?: string | null;
      lastName?: string | null;
      companyName?: string | null;
      phoneNumber: string;
      email?: string | null;
      alternatePhone?: string | null;
      dateOfBirthOrRegistration?: string | null;
      idProofType?: string | null;
      idProofNumber?: string | null;
      taxNumber?: string | null;
      gstNumber?: string | null;
      emergencyContact?: string | null;
      employerDetails?: string | null;
      currentAddress?: string | null;
      permanentAddress?: string | null;
      kycStatus: string;
      blacklistStatus: string;
      tenantStatus: string;
      kycStage: string;
      idProofAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
      addressProofAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
      financialAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    },
  ) => api.put(`/tenants/${id}`, payload),
  deleteTenant: (id: string) => api.delete(`/tenants/${id}`),
};

export const leaseApi = {
  getLeases: () => api.get("/leases"),
  getOptions: () => api.get("/leases/options"),
  getRenewals: (id: string) => api.get(`/leases/${id}/renewals`),
  createLease: (payload: {
    leaseNumber: string;
    tenantId: number;
    unitId: number;
    leaseStartDate: string;
    leaseEndDate: string;
    rentAmount: number;
    securityDepositAmount: number;
    billingCycle: string;
    dueDay: number;
    gracePeriodDays?: number | null;
    lateFeeRule?: string | null;
    agreementDocument?: { fileName: string; contentType: string; dataUrl: string; fileSize?: number | null } | null;
    status: string;
  }) => api.post("/leases", payload),
  updateLease: (
    id: string,
    payload: {
      leaseNumber: string;
      tenantId: number;
      unitId: number;
      leaseStartDate: string;
      leaseEndDate: string;
      rentAmount: number;
      securityDepositAmount: number;
      billingCycle: string;
      dueDay: number;
      gracePeriodDays?: number | null;
      lateFeeRule?: string | null;
      agreementDocument?: { fileName: string; contentType: string; dataUrl: string; fileSize?: number | null } | null;
      status: string;
    },
  ) => api.put(`/leases/${id}`, payload),
  submitLease: (id: string) => api.post(`/leases/${id}/submit`),
  approveLease: (id: string) => api.post(`/leases/${id}/approve`),
  activateLease: (id: string) => api.post(`/leases/${id}/activate`),
  cancelLease: (id: string) => api.post(`/leases/${id}/cancel`),
  renewLease: (
    id: string,
    payload: {
      renewalNumber: string;
      newStartDate: string;
      newEndDate: string;
      newRentAmount: number;
      securityDepositAmount?: number | null;
      agreementDocument?: { fileName: string; contentType: string; dataUrl: string; fileSize?: number | null } | null;
      renewalNotes?: string | null;
    },
  ) => api.post(`/leases/${id}/renew`, payload),
  terminateLease: (
    id: string,
    payload: {
      terminationDate: string;
      terminationReason: string;
      finalSettlementAmount?: number | null;
      securityDepositRefundAmount?: number | null;
      terminationDocument?: { fileName: string; contentType: string; dataUrl: string; fileSize?: number | null } | null;
    },
  ) => api.post(`/leases/${id}/terminate`, payload),
  deleteLease: (id: string) => api.delete(`/leases/${id}`),
};

export const rentBillingApi = {
  getOptions: () => api.get("/rent-billing/options"),
  getSchedules: () => api.get("/rent-billing/schedules"),
  generateSchedules: (payload: { leaseId: number; fromDate?: string | null; toDate?: string | null; lateFeeAmount?: number | null }) =>
    api.post("/rent-billing/schedules/generate", payload),
  createInvoiceFromSchedule: (id: string) => api.post(`/rent-billing/schedules/${id}/invoice`),
  getInvoices: () => api.get("/rent-billing/invoices"),
  createInvoice: (payload: {
    invoiceNumber: string;
    invoiceType: string;
    leaseId?: number | null;
    rentScheduleId?: number | null;
    tenantId: number;
    propertyId?: number | null;
    unitId?: number | null;
    invoiceDate: string;
    dueDate: string;
    subtotalAmount: number;
    taxAmount?: number | null;
    discountAmount?: number | null;
    lateFeeAmount?: number | null;
    status: string;
    description?: string | null;
    pdfDocument?: string | null;
  }) => api.post("/rent-billing/invoices", payload),
  approveInvoice: (id: string) => api.post(`/rent-billing/invoices/${id}/approve`),
  sendInvoice: (id: string) => api.post(`/rent-billing/invoices/${id}/send`),
  cancelInvoice: (id: string) => api.post(`/rent-billing/invoices/${id}/cancel`),
  getReceipts: () => api.get("/rent-billing/receipts"),
  createReceipt: (payload: {
    receiptNumber: string;
    invoiceId?: number | null;
    tenantId: number;
    receiptDate: string;
    paymentMode: string;
    amount: number;
    referenceNumber?: string | null;
    remarks?: string | null;
    pdfDocument?: string | null;
  }) => api.post("/rent-billing/receipts", payload),
  getSecurityDeposits: () => api.get("/rent-billing/security-deposits"),
  createSecurityDeposit: (payload: { leaseId: number; depositNumber: string; remarks?: string | null }) => api.post("/rent-billing/security-deposits", payload),
  getSecurityDepositHistory: (id: string) => api.get(`/rent-billing/security-deposits/${id}/history`),
  generateDepositInvoice: (id: string) => api.post(`/rent-billing/security-deposits/${id}/invoice`),
  collectSecurityDeposit: (id: string, payload: { amount: number; transactionDate?: string | null; invoiceId?: number | null; receiptId?: number | null; referenceNumber?: string | null; remarks?: string | null }) =>
    api.post(`/rent-billing/security-deposits/${id}/collect`, payload),
  adjustSecurityDeposit: (id: string, payload: { amount: number; transactionDate?: string | null; invoiceId?: number | null; receiptId?: number | null; referenceNumber?: string | null; remarks?: string | null }) =>
    api.post(`/rent-billing/security-deposits/${id}/adjust`, payload),
  refundSecurityDeposit: (id: string, payload: { amount: number; transactionDate?: string | null; invoiceId?: number | null; receiptId?: number | null; referenceNumber?: string | null; remarks?: string | null }) =>
    api.post(`/rent-billing/security-deposits/${id}/refund`, payload),
};

export const maintenanceApi = {
  getOptions: () => api.get("/maintenance/options"),
  getRequests: () => api.get("/maintenance/requests"),
  createRequest: (payload: {
    requestNumber: string;
    tenantId: number;
    propertyId: number;
    unitId: number;
    category: string;
    priority: string;
    description: string;
    assignedVendorId?: number | null;
    assignedUserId?: number | null;
    estimatedCost?: number | null;
    actualCost?: number | null;
    status: string;
    approvalStatus?: string | null;
    attachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    completionRemarks?: string | null;
  }) => api.post("/maintenance/requests", payload),
  updateRequest: (
    id: string,
    payload: {
      requestNumber: string;
      tenantId: number;
      propertyId: number;
      unitId: number;
      category: string;
      priority: string;
      description: string;
      assignedVendorId?: number | null;
      assignedUserId?: number | null;
      estimatedCost?: number | null;
      actualCost?: number | null;
      status: string;
      approvalStatus?: string | null;
      attachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
      completionRemarks?: string | null;
    },
  ) => api.put(`/maintenance/requests/${id}`, payload),
  deleteRequest: (id: string) => api.delete(`/maintenance/requests/${id}`),
  getWorkOrders: () => api.get("/maintenance/work-orders"),
  createWorkOrder: (payload: {
    workOrderNumber: string;
    maintenanceRequestId: number;
    vendorId?: number | null;
    technicianUserId?: number | null;
    materialsUsed?: string | null;
    laborCharges?: number | null;
    vendorInvoiceDocument?: { fileName: string; contentType: string; dataUrl: string; fileSize?: number | null } | null;
    completionRemarks?: string | null;
    approvalStatus?: string | null;
    status: string;
  }) => api.post("/maintenance/work-orders", payload),
  updateWorkOrder: (
    id: string,
    payload: {
      workOrderNumber: string;
      maintenanceRequestId: number;
      vendorId?: number | null;
      technicianUserId?: number | null;
      materialsUsed?: string | null;
      laborCharges?: number | null;
      vendorInvoiceDocument?: { fileName: string; contentType: string; dataUrl: string; fileSize?: number | null } | null;
      completionRemarks?: string | null;
      approvalStatus?: string | null;
      status: string;
    },
  ) => api.put(`/maintenance/work-orders/${id}`, payload),
  deleteWorkOrder: (id: string) => api.delete(`/maintenance/work-orders/${id}`),
  getPreventiveSchedules: () => api.get("/maintenance/preventive"),
  createPreventiveSchedule: (payload: {
    scheduleNumber: string;
    propertyId: number;
    unitId?: number | null;
    assetName: string;
    maintenanceType: string;
    recurrenceFrequency: string;
    nextDueDate: string;
    responsibleUserId?: number | null;
    vendorId?: number | null;
    notifyBeforeDays?: number | null;
    completionStatus: string;
    lastCompletedDate?: string | null;
    completionRemarks?: string | null;
    status: string;
  }) => api.post("/maintenance/preventive", payload),
  updatePreventiveSchedule: (
    id: string,
    payload: {
      scheduleNumber: string;
      propertyId: number;
      unitId?: number | null;
      assetName: string;
      maintenanceType: string;
      recurrenceFrequency: string;
      nextDueDate: string;
      responsibleUserId?: number | null;
      vendorId?: number | null;
      notifyBeforeDays?: number | null;
      completionStatus: string;
      lastCompletedDate?: string | null;
      completionRemarks?: string | null;
      status: string;
    },
  ) => api.put(`/maintenance/preventive/${id}`, payload),
  deletePreventiveSchedule: (id: string) => api.delete(`/maintenance/preventive/${id}`),
};

export const utilityApi = {
  getOptions: () => api.get("/utilities/options"),
  getTypes: () => api.get("/utilities/types"),
  createType: (payload: { typeCode: string; typeName: string; category: string; billingMethod: string; unitOfMeasure?: string | null; defaultRate?: number | null; fixedCharge?: number | null; commonArea: boolean; status: string; description?: string | null }) =>
    api.post("/utilities/types", payload),
  updateType: (id: string, payload: { typeCode: string; typeName: string; category: string; billingMethod: string; unitOfMeasure?: string | null; defaultRate?: number | null; fixedCharge?: number | null; commonArea: boolean; status: string; description?: string | null }) =>
    api.put(`/utilities/types/${id}`, payload),
  deleteType: (id: string) => api.delete(`/utilities/types/${id}`),
  getReadings: () => api.get("/utilities/readings"),
  createReading: (payload: { readingNumber: string; utilityTypeId: number; propertyId: number; unitId?: number | null; tenantId?: number | null; meterNumber?: string | null; readingDate: string; previousReading?: number | null; currentReading: number; commonArea: boolean; status: string; remarks?: string | null }) =>
    api.post("/utilities/readings", payload),
  updateReading: (id: string, payload: { readingNumber: string; utilityTypeId: number; propertyId: number; unitId?: number | null; tenantId?: number | null; meterNumber?: string | null; readingDate: string; previousReading?: number | null; currentReading: number; commonArea: boolean; status: string; remarks?: string | null }) =>
    api.put(`/utilities/readings/${id}`, payload),
  deleteReading: (id: string) => api.delete(`/utilities/readings/${id}`),
  getBills: () => api.get("/utilities/bills"),
  createBill: (payload: { billNumber: string; utilityTypeId: number; meterReadingId?: number | null; tenantId?: number | null; propertyId: number; unitId?: number | null; billDate: string; dueDate: string; billingPeriodStart: string; billingPeriodEnd: string; billingMethod: string; consumption?: number | null; rate?: number | null; fixedCharge?: number | null; commonAreaAmount?: number | null; taxAmount?: number | null; paidAmount?: number | null; status: string; remarks?: string | null }) =>
    api.post("/utilities/bills", payload),
  updateBill: (id: string, payload: { billNumber: string; utilityTypeId: number; meterReadingId?: number | null; tenantId?: number | null; propertyId: number; unitId?: number | null; billDate: string; dueDate: string; billingPeriodStart: string; billingPeriodEnd: string; billingMethod: string; consumption?: number | null; rate?: number | null; fixedCharge?: number | null; commonAreaAmount?: number | null; taxAmount?: number | null; paidAmount?: number | null; status: string; remarks?: string | null }) =>
    api.put(`/utilities/bills/${id}`, payload),
  approveBill: (id: string) => api.post(`/utilities/bills/${id}/approve`),
  postBill: (id: string) => api.post(`/utilities/bills/${id}/post`),
  cancelBill: (id: string) => api.post(`/utilities/bills/${id}/cancel`),
  deleteBill: (id: string) => api.delete(`/utilities/bills/${id}`),
};

export const assetApi = {
  getOptions: () => api.get("/assets/options"),
  getAssets: () => api.get("/assets"),
  createAsset: (payload: { assetCode: string; assetName: string; assetCategory: string; propertyId: number; buildingId?: number | null; unitId?: number | null; serialNumber?: string | null; manufacturer?: string | null; modelNumber?: string | null; purchaseDate?: string | null; purchaseCost?: number | null; installationDate?: string | null; conditionStatus: string; warrantyProvider?: string | null; warrantyStartDate?: string | null; warrantyEndDate?: string | null; warrantyTerms?: string | null; maintenanceFrequency?: string | null; nextMaintenanceDate?: string | null; status: string; remarks?: string | null }) =>
    api.post("/assets", payload),
  updateAsset: (id: string, payload: { assetCode: string; assetName: string; assetCategory: string; propertyId: number; buildingId?: number | null; unitId?: number | null; serialNumber?: string | null; manufacturer?: string | null; modelNumber?: string | null; purchaseDate?: string | null; purchaseCost?: number | null; installationDate?: string | null; conditionStatus: string; warrantyProvider?: string | null; warrantyStartDate?: string | null; warrantyEndDate?: string | null; warrantyTerms?: string | null; maintenanceFrequency?: string | null; nextMaintenanceDate?: string | null; status: string; remarks?: string | null }) =>
    api.put(`/assets/${id}`, payload),
  deleteAsset: (id: string) => api.delete(`/assets/${id}`),
  getSchedules: () => api.get("/assets/maintenance-schedules"),
  createSchedule: (payload: { scheduleNumber: string; assetId: number; maintenanceType: string; frequency: string; plannedDate: string; assignedVendorId?: number | null; estimatedCost?: number | null; priority: string; status: string; remarks?: string | null }) =>
    api.post("/assets/maintenance-schedules", payload),
  updateSchedule: (id: string, payload: { scheduleNumber: string; assetId: number; maintenanceType: string; frequency: string; plannedDate: string; assignedVendorId?: number | null; estimatedCost?: number | null; priority: string; status: string; remarks?: string | null }) =>
    api.put(`/assets/maintenance-schedules/${id}`, payload),
  completeSchedule: (id: string) => api.post(`/assets/maintenance-schedules/${id}/complete`),
  cancelSchedule: (id: string) => api.post(`/assets/maintenance-schedules/${id}/cancel`),
  deleteSchedule: (id: string) => api.delete(`/assets/maintenance-schedules/${id}`),
  getServiceHistory: () => api.get("/assets/service-history"),
  createServiceHistory: (payload: { serviceNumber: string; assetId: number; maintenanceScheduleId?: number | null; serviceDate: string; serviceType: string; vendorId?: number | null; technicianName?: string | null; conditionBefore?: string | null; conditionAfter: string; workPerformed: string; partsReplaced?: string | null; serviceCost?: number | null; nextServiceDate?: string | null; status: string; remarks?: string | null }) =>
    api.post("/assets/service-history", payload),
  updateServiceHistory: (id: string, payload: { serviceNumber: string; assetId: number; maintenanceScheduleId?: number | null; serviceDate: string; serviceType: string; vendorId?: number | null; technicianName?: string | null; conditionBefore?: string | null; conditionAfter: string; workPerformed: string; partsReplaced?: string | null; serviceCost?: number | null; nextServiceDate?: string | null; status: string; remarks?: string | null }) =>
    api.put(`/assets/service-history/${id}`, payload),
  deleteServiceHistory: (id: string) => api.delete(`/assets/service-history/${id}`),
};

export const inspectionApi = {
  getOptions: () => api.get("/inspections/options"),
  getInspections: () => api.get("/inspections"),
  createInspection: (payload: {
    inspectionNumber: string;
    inspectionType: string;
    propertyId: number;
    unitId?: number | null;
    leaseId?: number | null;
    tenantId?: number | null;
    scheduledDate?: string | null;
    inspectionDate: string;
    inspectorName?: string | null;
    overallCondition: string;
    damageStatus: string;
    estimatedRepairCost?: number | null;
    checklist?: Array<{ itemName: string; conditionStatus: string; damaged: boolean; damageDescription?: string | null; estimatedRepairCost?: number | null; remarks?: string | null }>;
    photoAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    damageNotes?: string | null;
    tenantAcknowledgementStatus: string;
    tenantAcknowledgedBy?: string | null;
    status: string;
    remarks?: string | null;
  }) => api.post("/inspections", payload),
  updateInspection: (id: string, payload: {
    inspectionNumber: string;
    inspectionType: string;
    propertyId: number;
    unitId?: number | null;
    leaseId?: number | null;
    tenantId?: number | null;
    scheduledDate?: string | null;
    inspectionDate: string;
    inspectorName?: string | null;
    overallCondition: string;
    damageStatus: string;
    estimatedRepairCost?: number | null;
    checklist?: Array<{ itemName: string; conditionStatus: string; damaged: boolean; damageDescription?: string | null; estimatedRepairCost?: number | null; remarks?: string | null }>;
    photoAttachments?: Array<{ fileName: string; contentType: string; dataUrl: string; fileSize?: number | null }>;
    damageNotes?: string | null;
    tenantAcknowledgementStatus: string;
    tenantAcknowledgedBy?: string | null;
    status: string;
    remarks?: string | null;
  }) => api.put(`/inspections/${id}`, payload),
  submitInspection: (id: string) => api.post(`/inspections/${id}/submit`),
  completeInspection: (id: string) => api.post(`/inspections/${id}/complete`),
  acknowledgeInspection: (id: string) => api.post(`/inspections/${id}/acknowledge`),
  deleteInspection: (id: string) => api.delete(`/inspections/${id}`),
};

export const purchaseExpenseApi = {
  getOptions: () => api.get("/purchase-expenses/options"),
  getRequests: () => api.get("/purchase-expenses/requests"),
  createRequest: (payload: { requestNumber: string; propertyId: number; unitId?: number | null; expenseType: string; description: string; estimatedAmount?: number | null; status: string; approvalStatus: string }) =>
    api.post("/purchase-expenses/requests", payload),
  updateRequest: (id: string, payload: { requestNumber: string; propertyId: number; unitId?: number | null; expenseType: string; description: string; estimatedAmount?: number | null; status: string; approvalStatus: string }) =>
    api.put(`/purchase-expenses/requests/${id}`, payload),
  deleteRequest: (id: string) => api.delete(`/purchase-expenses/requests/${id}`),
  getOrders: () => api.get("/purchase-expenses/orders"),
  createOrder: (payload: { purchaseOrderNumber: string; purchaseRequestId?: number | null; vendorId: number; propertyId: number; unitId?: number | null; orderDate: string; expectedDeliveryDate?: string | null; totalAmount?: number | null; status: string; approvalStatus: string; remarks?: string | null }) =>
    api.post("/purchase-expenses/orders", payload),
  updateOrder: (id: string, payload: { purchaseOrderNumber: string; purchaseRequestId?: number | null; vendorId: number; propertyId: number; unitId?: number | null; orderDate: string; expectedDeliveryDate?: string | null; totalAmount?: number | null; status: string; approvalStatus: string; remarks?: string | null }) =>
    api.put(`/purchase-expenses/orders/${id}`, payload),
  deleteOrder: (id: string) => api.delete(`/purchase-expenses/orders/${id}`),
  getInvoices: () => api.get("/purchase-expenses/invoices"),
  createInvoice: (payload: { invoiceNumber: string; purchaseOrderId?: number | null; vendorId: number; propertyId: number; unitId?: number | null; invoiceDate: string; dueDate?: string | null; invoiceAmount?: number | null; paidAmount?: number | null; paymentStatus: string; approvalStatus: string; status: string; remarks?: string | null }) =>
    api.post("/purchase-expenses/invoices", payload),
  updateInvoice: (id: string, payload: { invoiceNumber: string; purchaseOrderId?: number | null; vendorId: number; propertyId: number; unitId?: number | null; invoiceDate: string; dueDate?: string | null; invoiceAmount?: number | null; paidAmount?: number | null; paymentStatus: string; approvalStatus: string; status: string; remarks?: string | null }) =>
    api.put(`/purchase-expenses/invoices/${id}`, payload),
  deleteInvoice: (id: string) => api.delete(`/purchase-expenses/invoices/${id}`),
  getExpenses: () => api.get("/purchase-expenses/expenses"),
  createExpense: (payload: { expenseNumber: string; vendorInvoiceId?: number | null; vendorId?: number | null; propertyId: number; unitId?: number | null; expenseDate: string; expenseType: string; amount?: number | null; description?: string | null; approvalStatus: string; paymentStatus: string; status: string }) =>
    api.post("/purchase-expenses/expenses", payload),
  updateExpense: (id: string, payload: { expenseNumber: string; vendorInvoiceId?: number | null; vendorId?: number | null; propertyId: number; unitId?: number | null; expenseDate: string; expenseType: string; amount?: number | null; description?: string | null; approvalStatus: string; paymentStatus: string; status: string }) =>
    api.put(`/purchase-expenses/expenses/${id}`, payload),
  deleteExpense: (id: string) => api.delete(`/purchase-expenses/expenses/${id}`),
};

export const vendorApi = {
  getVendors: () => api.get("/vendors"),
  createVendor: (payload: {
    vendorCode: string;
    vendorName: string;
    contactPerson?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    serviceCategory?: string | null;
    taxNumber?: string | null;
    bankDetails?: string | null;
    contractStatus: string;
    insuranceDetails?: string | null;
    rating?: number | null;
    vendorStatus: string;
    assignmentStage: string;
  }) => api.post("/vendors", payload),
  updateVendor: (
    id: string,
    payload: {
      vendorCode: string;
      vendorName: string;
      contactPerson?: string | null;
      phone: string;
      email?: string | null;
      address?: string | null;
      serviceCategory?: string | null;
      taxNumber?: string | null;
      bankDetails?: string | null;
      contractStatus: string;
      insuranceDetails?: string | null;
      rating?: number | null;
      vendorStatus: string;
      assignmentStage: string;
    },
  ) => api.put(`/vendors/${id}`, payload),
  deleteVendor: (id: string) => api.delete(`/vendors/${id}`),
};

export const ownerApi = {
  getOwners: () => api.get("/owners"),
  createOwner: (payload: {
    ownerCode: string;
    ownerName: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    taxDetails?: string | null;
    bankAccountDetails?: string | null;
    propertyIds: number[];
    ownershipPercentage?: number | null;
    payoutFrequency: string;
    statementPreference: string;
    ownerStatus: string;
    statementStage: string;
  }) => api.post("/owners", payload),
  updateOwner: (
    id: string,
    payload: {
      ownerCode: string;
      ownerName: string;
      phone: string;
      email?: string | null;
      address?: string | null;
      taxDetails?: string | null;
      bankAccountDetails?: string | null;
      propertyIds: number[];
      ownershipPercentage?: number | null;
      payoutFrequency: string;
      statementPreference: string;
      ownerStatus: string;
      statementStage: string;
    },
  ) => api.put(`/owners/${id}`, payload),
  deleteOwner: (id: string) => api.delete(`/owners/${id}`),
};

export const documentApi = {
  getOptions: () => api.get("/documents/options"),
  getDocuments: () => api.get("/documents"),
  getExpiringDocuments: (days = 30) => api.get(`/documents/expiring?days=${days}`),
  downloadDocument: (id: string) => api.get(`/documents/${id}/download`),
  createDocument: (payload: {
    documentNumber: string;
    documentTitle: string;
    documentType: string;
    fileName: string;
    contentType: string;
    fileSize?: number | null;
    dataUrl: string;
    propertyId?: number | null;
    unitId?: number | null;
    tenantId?: number | null;
    leaseId?: number | null;
    vendorId?: number | null;
    invoiceId?: number | null;
    expiryDate?: string | null;
    previousDocumentId?: number | null;
    status: string;
    accessLevel: string;
    remarks?: string | null;
  }) => api.post("/documents", payload),
  updateDocument: (
    id: string,
    payload: {
      documentNumber: string;
      documentTitle: string;
      documentType: string;
      fileName: string;
      contentType: string;
      fileSize?: number | null;
      dataUrl: string;
      propertyId?: number | null;
      unitId?: number | null;
      tenantId?: number | null;
      leaseId?: number | null;
      vendorId?: number | null;
      invoiceId?: number | null;
      expiryDate?: string | null;
      previousDocumentId?: number | null;
      status: string;
      accessLevel: string;
      remarks?: string | null;
    },
  ) => api.put(`/documents/${id}`, payload),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
};

export const notificationApi = {
  getOptions: () => api.get("/notifications/options"),
  getNotifications: () => api.get("/notifications"),
  getMyNotifications: () => api.get("/notifications/me"),
  createNotification: (payload: {
    recipientUserId?: number | null;
    recipientName?: string | null;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
    notificationType: string;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: number | null;
    priority: string;
    channels: string[];
  }) => api.post("/notifications", payload),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  runRentDueReminders: (days = 7) => api.post(`/notifications/reminders/rent-due?days=${days}`),
  runLeaseExpiryReminders: (days = 30) => api.post(`/notifications/reminders/lease-expiry?days=${days}`),
};

export const approvalApi = {
  getOptions: () => api.get("/approvals/options"),
  getConfigs: () => api.get("/approvals/configs"),
  createConfig: (payload: { transactionType: string; levelNo: number; approverRoleId: number; minAmount?: number | null; maxAmount?: number | null; active: boolean }) =>
    api.post("/approvals/configs", payload),
  updateConfig: (id: string, payload: { transactionType: string; levelNo: number; approverRoleId: number; minAmount?: number | null; maxAmount?: number | null; active: boolean }) =>
    api.put(`/approvals/configs/${id}`, payload),
  deleteConfig: (id: string) => api.delete(`/approvals/configs/${id}`),
  getRequests: () => api.get("/approvals/requests"),
  submitRequest: (payload: { transactionType: string; entityId: number; referenceNumber: string; amount?: number | null; remarks?: string | null }) =>
    api.post("/approvals/requests", payload),
  approveRequest: (id: string, payload: { remarks?: string | null }) => api.post(`/approvals/requests/${id}/approve`, payload),
  rejectRequest: (id: string, payload: { remarks?: string | null }) => api.post(`/approvals/requests/${id}/reject`, payload),
  resubmitRequest: (id: string, payload: { remarks?: string | null }) => api.post(`/approvals/requests/${id}/resubmit`, payload),
};

export const accountingApi = {
  post: () => api.post("/accounting/post"),
  getEntries: (params?: { accountType?: string; partyType?: string; partyId?: string }) => api.get("/accounting/entries", { params }),
  getSummary: () => api.get("/accounting/summary"),
  getReport: (type: string) => api.get(`/accounting/reports/${type}`),
};

export const auditLogApi = {
  getAuditLogs: () => api.get("/audit-logs"),
};

export const agentApi = {
  chat: (payload: {
    message: string;
    history?: Array<{ role: string; content: string }>;
  }) => api.post("/agent/chat", payload),
};
