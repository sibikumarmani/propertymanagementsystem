package com.company.pms.maintenance;

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

@Entity
@Table(name = "maintenance_requests")
@Getter
@Setter
@NoArgsConstructor
public class MaintenanceRequestEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "request_number", nullable = false)
    private String requestNumber;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "unit_id", nullable = false)
    private Long unitId;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "priority", nullable = false)
    private String priority;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "assigned_vendor_id")
    private Long assignedVendorId;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(name = "estimated_cost", precision = 18, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "actual_cost", precision = 18, scale = 2)
    private BigDecimal actualCost;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;

    @Column(name = "attachments_json", columnDefinition = "LONGTEXT")
    private String attachmentsJson;

    @Column(name = "completion_remarks", columnDefinition = "TEXT")
    private String completionRemarks;
}
