package com.company.pms.property;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {

    List<PropertyEntity> findAllByCompanyIdOrderByPropertyNameAscIdAsc(Long companyId);

    Optional<PropertyEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndPropertyCodeIgnoreCase(Long companyId, String propertyCode);

    boolean existsByCompanyIdAndPropertyCodeIgnoreCaseAndIdNot(Long companyId, String propertyCode, Long id);
}
