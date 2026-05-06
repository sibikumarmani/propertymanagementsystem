package com.company.pms.unit;

import com.company.pms.common.config.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "property_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "building_id", nullable = false)
    private Long buildingId;

    @Column(name = "floor_id", nullable = false)
    private Long floorId;

    @Column(name = "unit_code", nullable = false)
    private String unitCode;

    @Column(name = "unit_number", nullable = false)
    private String unitNumber;

    @Column(name = "unit_type", nullable = false)
    private String unitType;

    @Column(name = "area_value", precision = 18, scale = 2)
    private BigDecimal areaValue;

    @Column(name = "area_unit", nullable = false)
    private String areaUnit;

    @Column(name = "base_rent", precision = 18, scale = 2)
    private BigDecimal baseRent;

    @Column(name = "security_deposit_amount", precision = 18, scale = 2)
    private BigDecimal securityDepositAmount;

    @Column(name = "unit_status", nullable = false)
    private String unitStatus;

    @Column(name = "availability_date")
    private LocalDate availabilityDate;

    @Column(name = "photo_summary", columnDefinition = "LONGTEXT")
    private String photoAttachmentsJson;

    @Column(name = "document_summary", columnDefinition = "LONGTEXT")
    private String documentAttachmentsJson;
}
