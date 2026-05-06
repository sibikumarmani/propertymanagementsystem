package com.company.pms.rentbilling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<ReceiptEntity, Long> {
    List<ReceiptEntity> findAllByCompanyIdOrderByReceiptDateDescIdDesc(Long companyId);
    Optional<ReceiptEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndReceiptNumberIgnoreCase(Long companyId, String receiptNumber);
}
