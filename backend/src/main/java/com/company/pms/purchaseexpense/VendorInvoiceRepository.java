package com.company.pms.purchaseexpense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VendorInvoiceRepository extends JpaRepository<VendorInvoiceEntity, Long> {
    List<VendorInvoiceEntity> findAllByCompanyIdOrderByIdDesc(Long companyId);
    Optional<VendorInvoiceEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndInvoiceNumberIgnoreCase(Long companyId, String invoiceNumber);
    boolean existsByCompanyIdAndInvoiceNumberIgnoreCaseAndIdNot(Long companyId, String invoiceNumber, Long id);
}
