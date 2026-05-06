package com.company.pms.maintenance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreventiveMaintenanceRepository extends JpaRepository<PreventiveMaintenanceEntity, Long> {

    List<PreventiveMaintenanceEntity> findAllByCompanyIdOrderByNextDueDateAscIdAsc(Long companyId);

    Optional<PreventiveMaintenanceEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndScheduleNumberIgnoreCase(Long companyId, String scheduleNumber);

    boolean existsByCompanyIdAndScheduleNumberIgnoreCaseAndIdNot(Long companyId, String scheduleNumber, Long id);
}
