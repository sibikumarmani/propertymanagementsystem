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

import java.time.LocalDate;

@Entity
@Table(name = "preventive_maintenance_schedules")
@Getter
@Setter
@NoArgsConstructor
public class PreventiveMaintenanceEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "schedule_number", nullable = false)
    private String scheduleNumber;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "unit_id")
    private Long unitId;

    @Column(name = "asset_name", nullable = false)
    private String assetName;

    @Column(name = "maintenance_type", nullable = false)
    private String maintenanceType;

    @Column(name = "recurrence_frequency", nullable = false)
    private String recurrenceFrequency;

    @Column(name = "next_due_date", nullable = false)
    private LocalDate nextDueDate;

    @Column(name = "responsible_user_id")
    private Long responsibleUserId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "notify_before_days", nullable = false)
    private Integer notifyBeforeDays;

    @Column(name = "completion_status", nullable = false)
    private String completionStatus;

    @Column(name = "last_completed_date")
    private LocalDate lastCompletedDate;

    @Column(name = "completion_remarks", columnDefinition = "TEXT")
    private String completionRemarks;

    @Column(name = "status", nullable = false)
    private String status;
}
