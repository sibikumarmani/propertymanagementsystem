package com.company.pms.rentbilling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RentScheduleRepository extends JpaRepository<RentScheduleEntity, Long> {
    List<RentScheduleEntity> findAllByCompanyIdOrderByDueDateDescIdDesc(Long companyId);
    Optional<RentScheduleEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByLeaseIdAndBillingPeriodStartAndBillingPeriodEnd(Long leaseId, LocalDate start, LocalDate end);
}
