package com.company.pms.floor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FloorRepository extends JpaRepository<FloorEntity, Long> {

    List<FloorEntity> findAllByCompanyIdOrderByFloorNameAscIdAsc(Long companyId);

    List<FloorEntity> findAllByBuildingIdOrderByFloorNumberAscIdAsc(Long buildingId);

    Optional<FloorEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByBuildingIdAndFloorCodeIgnoreCase(Long buildingId, String floorCode);

    boolean existsByBuildingIdAndFloorCodeIgnoreCaseAndIdNot(Long buildingId, String floorCode, Long id);

    boolean existsByBuildingIdAndFloorNumber(Long buildingId, Integer floorNumber);

    boolean existsByBuildingIdAndFloorNumberAndIdNot(Long buildingId, Integer floorNumber, Long id);
}
