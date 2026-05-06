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
@Table(name = "maintenance_work_orders")
@Getter
@Setter
@NoArgsConstructor
public class MaintenanceWorkOrderEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "work_order_number", nullable = false)
    private String workOrderNumber;

    @Column(name = "maintenance_request_id", nullable = false)
    private Long maintenanceRequestId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "technician_user_id")
    private Long technicianUserId;

    @Column(name = "materials_used", columnDefinition = "TEXT")
    private String materialsUsed;

    @Column(name = "labor_charges", precision = 18, scale = 2)
    private BigDecimal laborCharges;

    @Column(name = "vendor_invoice_document", columnDefinition = "LONGTEXT")
    private String vendorInvoiceDocument;

    @Column(name = "completion_remarks", columnDefinition = "TEXT")
    private String completionRemarks;

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;

    @Column(name = "status", nullable = false)
    private String status;
}
