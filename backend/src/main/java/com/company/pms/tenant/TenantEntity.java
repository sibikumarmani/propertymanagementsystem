package com.company.pms.tenant;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "tenant_code", nullable = false)
    private String tenantCode;

    @Column(name = "tenant_type", nullable = false)
    private String tenantType;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    @Column(name = "date_of_birth_or_registration")
    private LocalDate dateOfBirthOrRegistration;

    @Column(name = "id_proof_type")
    private String idProofType;

    @Column(name = "id_proof_number")
    private String idProofNumber;

    @Column(name = "tax_number")
    private String taxNumber;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "employer_details", columnDefinition = "TEXT")
    private String employerDetails;

    @Column(name = "current_address", columnDefinition = "TEXT")
    private String currentAddress;

    @Column(name = "permanent_address", columnDefinition = "TEXT")
    private String permanentAddress;

    @Column(name = "kyc_status", nullable = false)
    private String kycStatus;

    @Column(name = "blacklist_status", nullable = false)
    private String blacklistStatus;

    @Column(name = "tenant_status", nullable = false)
    private String tenantStatus;

    @Column(name = "kyc_stage", nullable = false)
    private String kycStage;

    @Column(name = "id_proof_document_note", columnDefinition = "LONGTEXT")
    private String idProofAttachmentsJson;

    @Column(name = "address_proof_document_note", columnDefinition = "LONGTEXT")
    private String addressProofAttachmentsJson;

    @Column(name = "financial_document_note", columnDefinition = "LONGTEXT")
    private String financialAttachmentsJson;
}
