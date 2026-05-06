package com.company.pms.building;

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

@Entity
@Table(name = "property_buildings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "building_code", nullable = false)
    private String buildingCode;

    @Column(name = "building_name", nullable = false)
    private String buildingName;

    @Column(name = "number_of_floors")
    private Integer numberOfFloors;

    @Column(name = "amenities_summary", columnDefinition = "TEXT")
    private String amenitiesSummary;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false)
    private String status;
}
