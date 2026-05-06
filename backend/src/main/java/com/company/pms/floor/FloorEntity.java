package com.company.pms.floor;

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
@Table(name = "property_floors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "building_id", nullable = false)
    private Long buildingId;

    @Column(name = "floor_code", nullable = false)
    private String floorCode;

    @Column(name = "floor_name", nullable = false)
    private String floorName;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @Column(name = "status", nullable = false)
    private String status;
}
