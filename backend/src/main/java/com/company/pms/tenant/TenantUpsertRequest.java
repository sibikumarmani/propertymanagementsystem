package com.company.pms.tenant;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record TenantUpsertRequest(
    @NotBlank String tenantCode,
    @NotBlank String tenantType,
    String firstName,
    String lastName,
    String companyName,
    @NotBlank String phoneNumber,
    @Email String email,
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
    @NotBlank String kycStatus,
    @NotBlank String blacklistStatus,
    @NotBlank String tenantStatus,
    @NotBlank String kycStage,
    List<TenantAttachmentRequest> idProofAttachments,
    List<TenantAttachmentRequest> addressProofAttachments,
    List<TenantAttachmentRequest> financialAttachments
) {
}
