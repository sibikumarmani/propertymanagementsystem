package com.company.pms.purchaseexpense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrderEntity, Long> {
    List<PurchaseOrderEntity> findAllByCompanyIdOrderByIdDesc(Long companyId);
    Optional<PurchaseOrderEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndPurchaseOrderNumberIgnoreCase(Long companyId, String purchaseOrderNumber);
    boolean existsByCompanyIdAndPurchaseOrderNumberIgnoreCaseAndIdNot(Long companyId, String purchaseOrderNumber, Long id);
}
