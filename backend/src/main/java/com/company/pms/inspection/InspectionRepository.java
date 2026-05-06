package com.company.pms.inspection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InspectionRepository extends JpaRepository<InspectionEntity, Long> {
    List<InspectionEntity> findAllByCompanyIdOrderByInspectionDateDescIdDesc(Long companyId);
    Optional<InspectionEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndInspectionNumberIgnoreCase(Long companyId, String inspectionNumber);
    boolean existsByCompanyIdAndInspectionNumberIgnoreCaseAndIdNot(Long companyId, String inspectionNumber, Long id);
}
