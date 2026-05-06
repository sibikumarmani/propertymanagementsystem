package com.company.pms.rentbilling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityDepositTransactionRepository extends JpaRepository<SecurityDepositTransactionEntity, Long> {
    List<SecurityDepositTransactionEntity> findAllByCompanyIdAndSecurityDepositIdOrderByTransactionDateDescIdDesc(Long companyId, Long securityDepositId);
}
