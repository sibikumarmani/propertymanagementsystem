package com.company.pms.lease;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaseRepository extends JpaRepository<LeaseEntity, Long> {

    List<LeaseEntity> findAllByCompanyIdOrderByLeaseNumberAscIdAsc(Long companyId);

    Optional<LeaseEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndLeaseNumberIgnoreCase(Long companyId, String leaseNumber);

    boolean existsByCompanyIdAndLeaseNumberIgnoreCaseAndIdNot(Long companyId, String leaseNumber, Long id);

    boolean existsByCompanyIdAndUnitIdAndStatusIn(Long companyId, Long unitId, List<String> statuses);

    boolean existsByCompanyIdAndUnitIdAndStatusInAndIdNot(Long companyId, Long unitId, List<String> statuses, Long id);
}
