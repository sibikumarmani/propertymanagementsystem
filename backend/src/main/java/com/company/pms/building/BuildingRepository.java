package com.company.pms.building;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BuildingRepository extends JpaRepository<BuildingEntity, Long> {

    List<BuildingEntity> findAllByCompanyIdOrderByBuildingNameAscIdAsc(Long companyId);

    List<BuildingEntity> findAllByPropertyIdOrderByBuildingNameAscIdAsc(Long propertyId);

    Optional<BuildingEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByPropertyIdAndBuildingCodeIgnoreCase(Long propertyId, String buildingCode);

    boolean existsByPropertyIdAndBuildingCodeIgnoreCaseAndIdNot(Long propertyId, String buildingCode, Long id);
}
