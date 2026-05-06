package com.company.pms.utility;

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
@Table(name = "utility_bills")
@Getter
@Setter
@NoArgsConstructor
public class UtilityBillEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "bill_number", nullable = false)
    private String billNumber;
    @Column(name = "utility_type_id", nullable = false)
    private Long utilityTypeId;
    @Column(name = "meter_reading_id")
    private Long meterReadingId;
    @Column(name = "tenant_id")
    private Long tenantId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "bill_date", nullable = false)
    private LocalDate billDate;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "billing_period_start", nullable = false)
    private LocalDate billingPeriodStart;
    @Column(name = "billing_period_end", nullable = false)
    private LocalDate billingPeriodEnd;
    @Column(name = "billing_method", nullable = false)
    private String billingMethod;
    @Column(name = "consumption", nullable = false, precision = 18, scale = 4)
    private BigDecimal consumption;
    @Column(name = "rate", nullable = false, precision = 18, scale = 4)
    private BigDecimal rate;
    @Column(name = "fixed_charge", nullable = false, precision = 18, scale = 2)
    private BigDecimal fixedCharge;
    @Column(name = "usage_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal usageAmount;
    @Column(name = "common_area_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal commonAreaAmount;
    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount;
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount;
    @Column(name = "due_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal dueAmount;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
