package com.company.pms.tenant;

import java.time.LocalDate;
import java.util.List;

public record TenantDto(
    Long id,
    Long companyId,
    String companyName,
    String companyCode,
    String tenantCode,
    String tenantType,
    String firstName,
    String lastName,
    String companyNameValue,
    String displayName,
    String phoneNumber,
    String email,
    String alternatePhone,
    LocalDate dateOfBirthOrRegistration,
    String idProofType,
    String idProofNumber,
    String taxNumber,
    String gstNumber,
    String emergencyContact,
    String employerDetails,
    String currentAddress,
    String permanentAddress,
    String kycStatus,
    String blacklistStatus,
    String tenantStatus,
    String kycStage,
    List<TenantAttachmentDto> idProofAttachments,
    List<TenantAttachmentDto> addressProofAttachments,
    List<TenantAttachmentDto> financialAttachments
) {
}
