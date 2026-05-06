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

@Entity
@Table(name = "utility_types")
@Getter
@Setter
@NoArgsConstructor
public class UtilityTypeEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "type_code", nullable = false)
    private String typeCode;
    @Column(name = "type_name", nullable = false)
    private String typeName;
    @Column(name = "category", nullable = false)
    private String category;
    @Column(name = "billing_method", nullable = false)
    private String billingMethod;
    @Column(name = "unit_of_measure")
    private String unitOfMeasure;
    @Column(name = "default_rate", nullable = false, precision = 18, scale = 4)
    private BigDecimal defaultRate;
    @Column(name = "fixed_charge", nullable = false, precision = 18, scale = 2)
    private BigDecimal fixedCharge;
    @Column(name = "common_area", nullable = false)
    private Boolean commonArea;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
