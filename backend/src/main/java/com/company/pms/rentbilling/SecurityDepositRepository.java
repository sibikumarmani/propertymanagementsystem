package com.company.pms.rentbilling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SecurityDepositRepository extends JpaRepository<SecurityDepositEntity, Long> {
    List<SecurityDepositEntity> findAllByCompanyIdOrderByUpdatedAtDescIdDesc(Long companyId);
    Optional<SecurityDepositEntity> findByIdAndCompanyId(Long id, Long companyId);
    Optional<SecurityDepositEntity> findByLeaseIdAndCompanyId(Long leaseId, Long companyId);
    boolean existsByCompanyIdAndDepositNumberIgnoreCase(Long companyId, String depositNumber);
}
