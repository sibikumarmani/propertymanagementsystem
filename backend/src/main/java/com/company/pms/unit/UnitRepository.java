package com.company.pms.unit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UnitRepository extends JpaRepository<UnitEntity, Long> {

    List<UnitEntity> findAllByCompanyIdOrderByUnitCodeAscIdAsc(Long companyId);

    Optional<UnitEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByPropertyIdAndUnitCodeIgnoreCase(Long propertyId, String unitCode);

    boolean existsByPropertyIdAndUnitCodeIgnoreCaseAndIdNot(Long propertyId, String unitCode, Long id);
}
