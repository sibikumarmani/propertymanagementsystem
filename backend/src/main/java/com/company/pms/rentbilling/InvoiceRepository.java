package com.company.pms.rentbilling;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, Long> {
    List<InvoiceEntity> findAllByCompanyIdOrderByInvoiceDateDescIdDesc(Long companyId);
    Optional<InvoiceEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndInvoiceNumberIgnoreCase(Long companyId, String invoiceNumber);
}
