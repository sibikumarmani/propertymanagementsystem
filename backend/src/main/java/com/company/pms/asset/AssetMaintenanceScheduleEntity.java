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
@Table(name = "asset_maintenance_schedules")
@Getter
@Setter
@NoArgsConstructor
public class AssetMaintenanceScheduleEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "schedule_number", nullable = false)
    private String scheduleNumber;
    @Column(name = "asset_id", nullable = false)
    private Long assetId;
    @Column(name = "maintenance_type", nullable = false)
    private String maintenanceType;
    @Column(name = "frequency", nullable = false)
    private String frequency;
    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;
    @Column(name = "assigned_vendor_id")
    private Long assignedVendorId;
    @Column(name = "estimated_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal estimatedCost;
    @Column(name = "priority", nullable = false)
    private String priority;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
