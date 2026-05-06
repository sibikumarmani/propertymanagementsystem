export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: "success" | "warning" | "danger";
};

export type ReportSnapshot = {
  month: string;
  budget: number;
  actual: number;
  allocated: number;
};


export type UserRecord = {
  id: string;
  userCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: Array<{ id: string; roleName: string }>;
  companies: Array<{ id: string; companyName: string; companyCode: string | null; defaultCompany: boolean; status: string }>;
  defaultCompanyId: string | null;
  menuAccessOverrides: Array<{ menuKey: string; allowed: boolean }>;
  effectiveMenuAccessKeys: string[];
  status: string;
  emailVerified: boolean;
  avatarImage: string | null;
};

export type RoleRecord = {
  id: string;
  roleName: string;
  description: string | null;
  defaultRole: boolean;
  status: string;
  menuAccessKeys: string[];
};

export type CompanyRecord = {
  id: string;
  companyName: string;
  companyCode: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gstNumber: string | null;
  taxNumber: string | null;
  defaultCompany: boolean;
  status: string;
};

export type BranchRecord = {
  id: string;
  companyId: string;
  companyName: string | null;
  companyCode: string | null;
  branchName: string;
  branchCode: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: string;
};

export type PropertyRecord = {
  id: string;
  companyId: string;
  companyName: string | null;
  companyCode: string | null;
  branchId: string | null;
  branchName: string | null;
  branchCode: string | null;
  propertyCode: string;
  propertyName: string;
  propertyType: string;
  ownershipType: string;
  ownerReference: string | null;
  ownershipDetails: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  totalFloors: number | null;
  totalUnits: number | null;
  propertyManagerUserId: string | null;
  propertyManagerName: string | null;
  amenitiesSummary: string | null;
  documentAttachments: PropertyAttachmentRecord[];
  status: string;
};

export type PropertyAttachmentRecord = {
  fileName: string;
  contentType: string;
  dataUrl: string;
  fileSize: number | null;
};

export type BuildingRecord = {
  id: string;
  companyId: string;
  propertyId: string;
  propertyCode: string | null;
  propertyName: string | null;
  buildingCode: string;
  buildingName: string;
  numberOfFloors: number | null;
  amenitiesSummary: string | null;
  description: string | null;
  status: string;
};

export type FloorRecord = {
  id: string;
  companyId: string;
  propertyId: string;
  propertyCode: string | null;
  propertyName: string | null;
  buildingId: string;
  buildingCode: string | null;
  buildingName: string | null;
  floorCode: string;
  floorName: string;
  floorNumber: number;
  status: string;
};

export type UnitRecord = {
  id: string;
  companyId: string;
  propertyId: string;
  propertyCode: string | null;
  propertyName: string | null;
  buildingId: string;
  buildingCode: string | null;
  buildingName: string | null;
  floorId: string;
  floorCode: string | null;
  floorName: string | null;
  unitCode: string;
  unitNumber: string;
  unitType: string;
  areaValue: number | null;
  areaUnit: string;
  baseRent: number | null;
  securityDepositAmount: number | null;
  unitStatus: string;
  availabilityDate: string | null;
  photoAttachments: UnitAttachmentRecord[];
  documentAttachments: UnitAttachmentRecord[];
};

export type UnitAttachmentRecord = {
  fileName: string;
  contentType: string;
  dataUrl: string;
  fileSize: number | null;
};

export type UnitOptionsRecord = {
  unitTypes: string[];
  unitStatuses: string[];
  areaUnits: string[];
};

export type TenantRecord = {
  id: string;
  companyId: string;
  companyName: string | null;
  companyCode: string | null;
  tenantCode: string;
  tenantType: string;
  firstName: string | null;
  lastName: string | null;
  companyNameValue: string | null;
  displayName: string;
  phoneNumber: string;
  email: string | null;
  alternatePhone: string | null;
  dateOfBirthOrRegistration: string | null;
  idProofType: string | null;
  idProofNumber: string | null;
  taxNumber: string | null;
  gstNumber: string | null;
  emergencyContact: string | null;
  employerDetails: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  kycStatus: string;
  blacklistStatus: string;
  tenantStatus: string;
  kycStage: string;
  idProofAttachments: TenantAttachmentRecord[];
  addressProofAttachments: TenantAttachmentRecord[];
  financialAttachments: TenantAttachmentRecord[];
};

export type TenantAttachmentRecord = {
  fileName: string;
  contentType: string;
  dataUrl: string;
  fileSize: number | null;
};

export type TenantOptionsRecord = {
  tenantTypes: string[];
  idProofTypes: string[];
  kycStatuses: string[];
  blacklistStatuses: string[];
  tenantStatuses: string[];
  kycStages: string[];
};

export type LeaseAttachmentRecord = {
  fileName: string;
  contentType: string;
  dataUrl: string;
  fileSize: number | null;
};

export type LeaseRecord = {
  id: string;
  companyId: string;
  leaseNumber: string;
  tenantId: string;
  tenantCode: string | null;
  tenantDisplayName: string | null;
  propertyId: string;
  propertyCode: string | null;
  propertyName: string | null;
  unitId: string;
  unitCode: string | null;
  unitNumber: string | null;
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: number;
  securityDepositAmount: number;
  billingCycle: string;
  dueDay: number;
  gracePeriodDays: number | null;
  lateFeeRule: string | null;
  agreementDocument: LeaseAttachmentRecord | null;
  status: string;
  activationDate: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  finalSettlementAmount: number | null;
  securityDepositRefundAmount: number | null;
  terminationDocument: LeaseAttachmentRecord | null;
  renewedFromLeaseId: string | null;
};

export type LeaseRenewalRecord = {
  id: string;
  companyId: string;
  leaseId: string;
  renewalNumber: string;
  previousStartDate: string;
  previousEndDate: string;
  newStartDate: string;
  newEndDate: string;
  previousRentAmount: number;
  newRentAmount: number;
  securityDepositAmount: number | null;
  agreementDocument: LeaseAttachmentRecord | null;
  approvalStatus: string;
  renewalNotes: string | null;
};

export type LeaseOptionsRecord = {
  leaseStatuses: string[];
  billingCycles: string[];
};

export type RentScheduleRecord = {
  id: string;
  companyId: string;
  leaseId: string;
  leaseNumber: string | null;
  tenantId: string;
  tenantDisplayName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string;
  unitNumber: string | null;
  scheduleNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  rentAmount: number;
  lateFeeAmount: number;
  paidAmount: number;
  dueAmount: number;
  invoiceId: string | null;
  status: string;
};

export type InvoiceRecord = {
  id: string;
  companyId: string;
  invoiceNumber: string;
  invoiceType: string;
  leaseId: string | null;
  leaseNumber: string | null;
  rentScheduleId: string | null;
  tenantId: string;
  tenantDisplayName: string | null;
  propertyId: string | null;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  invoiceDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  description: string | null;
  pdfDocument: string | null;
};

export type ReceiptRecord = {
  id: string;
  companyId: string;
  receiptNumber: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  tenantId: string;
  tenantDisplayName: string | null;
  receiptDate: string;
  paymentMode: string;
  amount: number;
  advanceAmount: number;
  referenceNumber: string | null;
  remarks: string | null;
  pdfDocument: string | null;
  status: string;
};

export type RentBillingOptionsRecord = {
  scheduleStatuses: string[];
  invoiceStatuses: string[];
  invoiceTypes: string[];
  paymentModes: string[];
};

export type SecurityDepositRecord = {
  id: string;
  companyId: string;
  leaseId: string;
  leaseNumber: string | null;
  tenantId: string;
  tenantDisplayName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string;
  unitNumber: string | null;
  depositNumber: string;
  depositAmount: number;
  collectedAmount: number;
  adjustedAmount: number;
  refundedAmount: number;
  refundableAmount: number;
  depositInvoiceId: string | null;
  depositReceiptId: string | null;
  status: string;
  remarks: string | null;
};

export type SecurityDepositTransactionRecord = {
  id: string;
  companyId: string;
  securityDepositId: string;
  transactionType: string;
  transactionDate: string;
  amount: number;
  invoiceId: string | null;
  receiptId: string | null;
  referenceNumber: string | null;
  remarks: string | null;
};

export type MaintenanceAttachmentRecord = {
  fileName: string;
  contentType: string;
  dataUrl: string;
  fileSize: number | null;
};

export type MaintenanceRequestRecord = {
  id: string;
  companyId: string;
  requestNumber: string;
  tenantId: string;
  tenantDisplayName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string;
  unitNumber: string | null;
  category: string;
  priority: string;
  description: string;
  assignedVendorId: string | null;
  assignedVendorName: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  status: string;
  approvalStatus: string;
  attachments: MaintenanceAttachmentRecord[];
  completionRemarks: string | null;
};

export type MaintenanceWorkOrderRecord = {
  id: string;
  companyId: string;
  workOrderNumber: string;
  maintenanceRequestId: string;
  requestNumber: string | null;
  vendorId: string | null;
  vendorName: string | null;
  technicianUserId: string | null;
  technicianName: string | null;
  materialsUsed: string | null;
  laborCharges: number | null;
  vendorInvoiceDocument: MaintenanceAttachmentRecord | null;
  completionRemarks: string | null;
  approvalStatus: string;
  status: string;
};

export type PreventiveMaintenanceRecord = {
  id: string;
  companyId: string;
  scheduleNumber: string;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  assetName: string;
  maintenanceType: string;
  recurrenceFrequency: string;
  nextDueDate: string;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  notifyBeforeDays: number;
  completionStatus: string;
  lastCompletedDate: string | null;
  completionRemarks: string | null;
  status: string;
};

export type MaintenanceOptionsRecord = {
  requestStatuses: string[];
  priorities: string[];
  approvalStatuses: string[];
  workOrderStatuses: string[];
  preventiveFrequencies: string[];
  preventiveCompletionStatuses: string[];
  preventiveStatuses: string[];
};

export type PurchaseRequestRecord = {
  id: string;
  companyId: string;
  requestNumber: string;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  expenseType: string;
  description: string;
  estimatedAmount: number;
  status: string;
  approvalStatus: string;
};

export type PurchaseOrderRecord = {
  id: string;
  companyId: string;
  purchaseOrderNumber: string;
  purchaseRequestId: string | null;
  requestNumber: string | null;
  vendorId: string;
  vendorName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  orderDate: string;
  expectedDeliveryDate: string | null;
  totalAmount: number;
  status: string;
  approvalStatus: string;
  remarks: string | null;
};

export type VendorInvoiceRecord = {
  id: string;
  companyId: string;
  invoiceNumber: string;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  vendorId: string;
  vendorName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  invoiceDate: string;
  dueDate: string | null;
  invoiceAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  approvalStatus: string;
  status: string;
  remarks: string | null;
};

export type PropertyExpenseRecord = {
  id: string;
  companyId: string;
  expenseNumber: string;
  vendorInvoiceId: string | null;
  invoiceNumber: string | null;
  vendorId: string | null;
  vendorName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  expenseDate: string;
  expenseType: string;
  amount: number;
  description: string | null;
  approvalStatus: string;
  paymentStatus: string;
  status: string;
};

export type PurchaseExpenseOptionsRecord = {
  expenseTypes: string[];
  requestStatuses: string[];
  orderStatuses: string[];
  invoiceStatuses: string[];
  expenseStatuses: string[];
  approvalStatuses: string[];
  paymentStatuses: string[];
};

export type UtilityTypeRecord = {
  id: string;
  companyId: string;
  typeCode: string;
  typeName: string;
  category: string;
  billingMethod: string;
  unitOfMeasure: string | null;
  defaultRate: number;
  fixedCharge: number;
  commonArea: boolean;
  status: string;
  description: string | null;
};

export type MeterReadingRecord = {
  id: string;
  companyId: string;
  readingNumber: string;
  utilityTypeId: string;
  utilityTypeName: string | null;
  utilityCategory: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  tenantId: string | null;
  tenantDisplayName: string | null;
  meterNumber: string | null;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  commonArea: boolean;
  status: string;
  remarks: string | null;
};

export type UtilityBillRecord = {
  id: string;
  companyId: string;
  billNumber: string;
  utilityTypeId: string;
  utilityTypeName: string | null;
  utilityCategory: string | null;
  meterReadingId: string | null;
  readingNumber: string | null;
  tenantId: string | null;
  tenantDisplayName: string | null;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  billDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billingMethod: string;
  consumption: number;
  rate: number;
  fixedCharge: number;
  usageAmount: number;
  commonAreaAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  remarks: string | null;
};

export type UtilityOptionsRecord = {
  categories: string[];
  billingMethods: string[];
  utilityTypeStatuses: string[];
  readingStatuses: string[];
  billStatuses: string[];
  unitsOfMeasure: string[];
};

export type AssetRecord = {
  id: string;
  companyId: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  propertyId: string;
  propertyName: string | null;
  buildingId: string | null;
  buildingName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  installationDate: string | null;
  conditionStatus: string;
  warrantyProvider: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  warrantyTerms: string | null;
  maintenanceFrequency: string | null;
  nextMaintenanceDate: string | null;
  status: string;
  remarks: string | null;
};

export type AssetMaintenanceScheduleRecord = {
  id: string;
  companyId: string;
  scheduleNumber: string;
  assetId: string;
  assetCode: string | null;
  assetName: string | null;
  maintenanceType: string;
  frequency: string;
  plannedDate: string;
  assignedVendorId: string | null;
  assignedVendorName: string | null;
  estimatedCost: number;
  priority: string;
  status: string;
  remarks: string | null;
};

export type AssetServiceHistoryRecord = {
  id: string;
  companyId: string;
  serviceNumber: string;
  assetId: string;
  assetCode: string | null;
  assetName: string | null;
  maintenanceScheduleId: string | null;
  scheduleNumber: string | null;
  serviceDate: string;
  serviceType: string;
  vendorId: string | null;
  vendorName: string | null;
  technicianName: string | null;
  conditionBefore: string | null;
  conditionAfter: string;
  workPerformed: string;
  partsReplaced: string | null;
  serviceCost: number;
  nextServiceDate: string | null;
  status: string;
  remarks: string | null;
};

export type AssetOptionsRecord = {
  assetCategories: string[];
  conditionStatuses: string[];
  maintenanceFrequencies: string[];
  assetStatuses: string[];
  maintenanceTypes: string[];
  priorities: string[];
  scheduleStatuses: string[];
  serviceStatuses: string[];
};

export type InspectionAttachmentRecord = {
  fileName: string;
  contentType: string;
  dataUrl: string;
  fileSize: number | null;
};

export type InspectionChecklistItemRecord = {
  itemName: string;
  conditionStatus: string;
  damaged: boolean;
  damageDescription: string | null;
  estimatedRepairCost: number | null;
  remarks: string | null;
};

export type InspectionRecord = {
  id: string;
  companyId: string;
  inspectionNumber: string;
  inspectionType: string;
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  leaseId: string | null;
  leaseNumber: string | null;
  tenantId: string | null;
  tenantDisplayName: string | null;
  scheduledDate: string | null;
  inspectionDate: string;
  inspectorName: string | null;
  overallCondition: string;
  damageStatus: string;
  estimatedRepairCost: number;
  checklist: InspectionChecklistItemRecord[];
  photoAttachments: InspectionAttachmentRecord[];
  damageNotes: string | null;
  tenantAcknowledgementStatus: string;
  tenantAcknowledgedBy: string | null;
  tenantAcknowledgedAt: string | null;
  status: string;
  remarks: string | null;
};

export type InspectionOptionsRecord = {
  inspectionTypes: string[];
  conditionStatuses: string[];
  damageStatuses: string[];
  acknowledgementStatuses: string[];
  inspectionStatuses: string[];
};

export type VendorRecord = {
  id: string;
  companyId: string;
  companyName: string | null;
  companyCode: string | null;
  vendorCode: string;
  vendorName: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  serviceCategory: string | null;
  taxNumber: string | null;
  bankDetails: string | null;
  contractStatus: string;
  insuranceDetails: string | null;
  rating: number | null;
  vendorStatus: string;
  assignmentStage: string;
};

export type OwnerRecord = {
  id: string;
  companyId: string;
  companyName: string | null;
  companyCode: string | null;
  ownerCode: string;
  ownerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  taxDetails: string | null;
  bankAccountDetails: string | null;
  propertyIds: string[];
  propertiesOwnedSummary: string;
  ownershipPercentage: number | null;
  payoutFrequency: string;
  statementPreference: string;
  ownerStatus: string;
  statementStage: string;
};

export type UserResetCodeRecord = {
  userId: string;
  userCode: string;
  fullName: string;
  email: string;
  resetCode: string | null;
  expiresAt: string | null;
  consumed: boolean | null;
  available: boolean;
};

export type AgentChatHistoryMessage = {
  role: string;
  content: string;
};

export type AgentActionRecord = {
  toolName: string;
  success: boolean;
  summary: string;
};
