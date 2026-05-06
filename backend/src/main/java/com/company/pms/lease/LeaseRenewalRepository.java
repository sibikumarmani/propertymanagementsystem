package com.company.pms.lease;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaseRenewalRepository extends JpaRepository<LeaseRenewalEntity, Long> {

    List<LeaseRenewalEntity> findAllByCompanyIdAndLeaseIdOrderByCreatedAtDescIdDesc(Long companyId, Long leaseId);

    boolean existsByCompanyIdAndRenewalNumberIgnoreCase(Long companyId, String renewalNumber);
}
