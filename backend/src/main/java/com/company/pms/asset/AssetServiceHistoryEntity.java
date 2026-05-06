package com.company.pms.asset;

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
@Table(name = "asset_service_history")
@Getter
@Setter
@NoArgsConstructor
public class AssetServiceHistoryEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "service_number", nullable = false)
    private String serviceNumber;
    @Column(name = "asset_id", nullable = false)
    private Long assetId;
    @Column(name = "maintenance_schedule_id")
    private Long maintenanceScheduleId;
    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;
    @Column(name = "service_type", nullable = false)
    private String serviceType;
    @Column(name = "vendor_id")
    private Long vendorId;
    @Column(name = "technician_name")
    private String technicianName;
    @Column(name = "condition_before")
    private String conditionBefore;
    @Column(name = "condition_after", nullable = false)
    private String conditionAfter;
    @Column(name = "work_performed", nullable = false, columnDefinition = "TEXT")
    private String workPerformed;
    @Column(name = "parts_replaced", columnDefinition = "TEXT")
    private String partsReplaced;
    @Column(name = "service_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal serviceCost;
    @Column(name = "next_service_date")
    private LocalDate nextServiceDate;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
