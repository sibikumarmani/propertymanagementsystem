package com.company.pms.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {

    List<DocumentEntity> findAllByCompanyIdOrderByUpdatedAtDescIdDesc(Long companyId);

    List<DocumentEntity> findAllByCompanyIdAndExpiryDateLessThanEqualOrderByExpiryDateAscIdAsc(Long companyId, LocalDate expiryDate);

    Optional<DocumentEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndDocumentNumberIgnoreCaseAndVersionNumber(Long companyId, String documentNumber, Integer versionNumber);
}
