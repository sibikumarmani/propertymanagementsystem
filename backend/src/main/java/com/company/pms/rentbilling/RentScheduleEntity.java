package com.company.pms.rentbilling;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "rent_schedules")
@Getter
@Setter
public class RentScheduleEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "lease_id", nullable = false)
    private Long leaseId;
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id", nullable = false)
    private Long unitId;
    @Column(name = "schedule_number", nullable = false)
    private String scheduleNumber;
    @Column(name = "billing_period_start", nullable = false)
    private LocalDate billingPeriodStart;
    @Column(name = "billing_period_end", nullable = false)
    private LocalDate billingPeriodEnd;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "rent_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal rentAmount;
    @Column(name = "late_fee_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal lateFeeAmount;
    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount;
    @Column(name = "due_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal dueAmount;
    @Column(name = "invoice_id")
    private Long invoiceId;
    @Column(name = "status", nullable = false)
    private String status;
}
