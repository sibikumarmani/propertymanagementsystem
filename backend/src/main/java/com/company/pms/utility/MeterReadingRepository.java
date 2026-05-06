package com.company.pms.utility;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeterReadingRepository extends JpaRepository<MeterReadingEntity, Long> {
    List<MeterReadingEntity> findAllByCompanyIdOrderByReadingDateDescIdDesc(Long companyId);
    Optional<MeterReadingEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndReadingNumberIgnoreCase(Long companyId, String readingNumber);
    boolean existsByCompanyIdAndReadingNumberIgnoreCaseAndIdNot(Long companyId, String readingNumber, Long id);
}
