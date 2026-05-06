package com.company.pms.utility;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UtilityTypeRepository extends JpaRepository<UtilityTypeEntity, Long> {
    List<UtilityTypeEntity> findAllByCompanyIdOrderByTypeNameAscIdAsc(Long companyId);
    Optional<UtilityTypeEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndTypeCodeIgnoreCase(Long companyId, String typeCode);
    boolean existsByCompanyIdAndTypeCodeIgnoreCaseAndIdNot(Long companyId, String typeCode, Long id);
}
