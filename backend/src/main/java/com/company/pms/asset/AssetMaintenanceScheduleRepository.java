package com.company.pms.asset;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetMaintenanceScheduleRepository extends JpaRepository<AssetMaintenanceScheduleEntity, Long> {
    List<AssetMaintenanceScheduleEntity> findAllByCompanyIdOrderByPlannedDateAscIdDesc(Long companyId);
    Optional<AssetMaintenanceScheduleEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndScheduleNumberIgnoreCase(Long companyId, String scheduleNumber);
    boolean existsByCompanyIdAndScheduleNumberIgnoreCaseAndIdNot(Long companyId, String scheduleNumber, Long id);
}
