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
@Table(name = "meter_readings")
@Getter
@Setter
@NoArgsConstructor
public class MeterReadingEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "reading_number", nullable = false)
    private String readingNumber;
    @Column(name = "utility_type_id", nullable = false)
    private Long utilityTypeId;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "tenant_id")
    private Long tenantId;
    @Column(name = "meter_number")
    private String meterNumber;
    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;
    @Column(name = "previous_reading", nullable = false, precision = 18, scale = 4)
    private BigDecimal previousReading;
    @Column(name = "current_reading", nullable = false, precision = 18, scale = 4)
    private BigDecimal currentReading;
    @Column(name = "consumption", nullable = false, precision = 18, scale = 4)
    private BigDecimal consumption;
    @Column(name = "common_area", nullable = false)
    private Boolean commonArea;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
