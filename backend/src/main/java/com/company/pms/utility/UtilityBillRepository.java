package com.company.pms.utility;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UtilityBillRepository extends JpaRepository<UtilityBillEntity, Long> {
    List<UtilityBillEntity> findAllByCompanyIdOrderByBillDateDescIdDesc(Long companyId);
    Optional<UtilityBillEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndBillNumberIgnoreCase(Long companyId, String billNumber);
    boolean existsByCompanyIdAndBillNumberIgnoreCaseAndIdNot(Long companyId, String billNumber, Long id);
}
