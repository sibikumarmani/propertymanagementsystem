package com.company.pms.purchaseexpense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequestEntity, Long> {
    List<PurchaseRequestEntity> findAllByCompanyIdOrderByIdDesc(Long companyId);
    Optional<PurchaseRequestEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndRequestNumberIgnoreCase(Long companyId, String requestNumber);
    boolean existsByCompanyIdAndRequestNumberIgnoreCaseAndIdNot(Long companyId, String requestNumber, Long id);
}
