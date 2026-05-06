package com.company.pms.purchaseexpense;

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
import java.time.LocalDate;

@Entity
@Table(name = "purchase_orders")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseOrderEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "purchase_order_number", nullable = false)
    private String purchaseOrderNumber;
    @Column(name = "purchase_request_id")
    private Long purchaseRequestId;
    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;
    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "approval_status", nullable = false)
    private String approvalStatus;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
