package com.company.pms.inspection;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "property_inspections")
@Getter
@Setter
@NoArgsConstructor
public class InspectionEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "inspection_number", nullable = false)
    private String inspectionNumber;
    @Column(name = "inspection_type", nullable = false)
    private String inspectionType;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "lease_id")
    private Long leaseId;
    @Column(name = "tenant_id")
    private Long tenantId;
    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;
    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;
    @Column(name = "inspector_name")
    private String inspectorName;
    @Column(name = "overall_condition", nullable = false)
    private String overallCondition;
    @Column(name = "damage_status", nullable = false)
    private String damageStatus;
    @Column(name = "estimated_repair_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal estimatedRepairCost;
    @Column(name = "checklist_json", columnDefinition = "LONGTEXT")
    private String checklistJson;
    @Column(name = "photo_attachments_json", columnDefinition = "LONGTEXT")
    private String photoAttachmentsJson;
    @Column(name = "damage_notes", columnDefinition = "TEXT")
    private String damageNotes;
    @Column(name = "tenant_acknowledgement_status", nullable = false)
    private String tenantAcknowledgementStatus;
    @Column(name = "tenant_acknowledged_by")
    private String tenantAcknowledgedBy;
    @Column(name = "tenant_acknowledged_at")
    private Instant tenantAcknowledgedAt;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
