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
@Table(name = "property_assets")
@Getter
@Setter
@NoArgsConstructor
public class AssetEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "company_id", nullable = false)
    private Long companyId;
    @Column(name = "asset_code", nullable = false)
    private String assetCode;
    @Column(name = "asset_name", nullable = false)
    private String assetName;
    @Column(name = "asset_category", nullable = false)
    private String assetCategory;
    @Column(name = "property_id", nullable = false)
    private Long propertyId;
    @Column(name = "building_id")
    private Long buildingId;
    @Column(name = "unit_id")
    private Long unitId;
    @Column(name = "serial_number")
    private String serialNumber;
    @Column(name = "manufacturer")
    private String manufacturer;
    @Column(name = "model_number")
    private String modelNumber;
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
    @Column(name = "purchase_cost", precision = 18, scale = 2)
    private BigDecimal purchaseCost;
    @Column(name = "installation_date")
    private LocalDate installationDate;
    @Column(name = "condition_status", nullable = false)
    private String conditionStatus;
    @Column(name = "warranty_provider")
    private String warrantyProvider;
    @Column(name = "warranty_start_date")
    private LocalDate warrantyStartDate;
    @Column(name = "warranty_end_date")
    private LocalDate warrantyEndDate;
    @Column(name = "warranty_terms", columnDefinition = "TEXT")
    private String warrantyTerms;
    @Column(name = "maintenance_frequency")
    private String maintenanceFrequency;
    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
}
