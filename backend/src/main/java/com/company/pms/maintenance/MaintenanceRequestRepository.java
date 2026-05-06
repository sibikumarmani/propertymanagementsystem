package com.company.pms.maintenance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequestEntity, Long> {

    List<MaintenanceRequestEntity> findAllByCompanyIdOrderByIdDesc(Long companyId);

    Optional<MaintenanceRequestEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndRequestNumberIgnoreCase(Long companyId, String requestNumber);

    boolean existsByCompanyIdAndRequestNumberIgnoreCaseAndIdNot(Long companyId, String requestNumber, Long id);
}
