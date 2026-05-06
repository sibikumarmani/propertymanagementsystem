package com.company.pms.property;

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
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "property_code", nullable = false)
    private String propertyCode;

    @Column(name = "property_name", nullable = false)
    private String propertyName;

    @Column(name = "property_type", nullable = false)
    private String propertyType;

    @Column(name = "ownership_type", nullable = false)
    private String ownershipType;

    @Column(name = "owner_reference")
    private String ownerReference;

    @Column(name = "ownership_details", columnDefinition = "TEXT")
    private String ownershipDetails;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "pincode")
    private String pincode;

    @Column(name = "total_floors")
    private Integer totalFloors;

    @Column(name = "total_units")
    private Integer totalUnits;

    @Column(name = "property_manager_user_id")
    private Long propertyManagerUserId;

    @Column(name = "property_manager_name")
    private String propertyManagerName;

    @Column(name = "amenities_summary", columnDefinition = "TEXT")
    private String amenitiesSummary;

    @Column(name = "document_summary", columnDefinition = "LONGTEXT")
    private String documentAttachmentsJson;

    @Column(name = "status", nullable = false)
    private String status;
}
