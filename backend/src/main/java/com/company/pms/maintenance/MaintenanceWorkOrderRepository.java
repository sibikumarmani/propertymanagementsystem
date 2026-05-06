package com.company.pms.maintenance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaintenanceWorkOrderRepository extends JpaRepository<MaintenanceWorkOrderEntity, Long> {

    List<MaintenanceWorkOrderEntity> findAllByCompanyIdOrderByIdDesc(Long companyId);

    Optional<MaintenanceWorkOrderEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndWorkOrderNumberIgnoreCase(Long companyId, String workOrderNumber);

    boolean existsByCompanyIdAndWorkOrderNumberIgnoreCaseAndIdNot(Long companyId, String workOrderNumber, Long id);
}
