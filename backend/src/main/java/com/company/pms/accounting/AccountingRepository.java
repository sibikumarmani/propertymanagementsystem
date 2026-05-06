package com.company.pms.accounting;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AccountingRepository extends JpaRepository<AccountingEntryEntity, Long> {
    List<AccountingEntryEntity> findAllByCompanyIdOrderByEntryDateDescIdDesc(Long companyId);
    List<AccountingEntryEntity> findAllByCompanyIdAndEntryDateBetweenOrderByEntryDateDescIdDesc(Long companyId, LocalDate fromDate, LocalDate toDate);
    List<AccountingEntryEntity> findAllByCompanyIdAndAccountTypeOrderByEntryDateDescIdDesc(Long companyId, String accountType);
    List<AccountingEntryEntity> findAllByCompanyIdAndPartyTypeAndPartyIdOrderByEntryDateAscIdAsc(Long companyId, String partyType, Long partyId);
    List<AccountingEntryEntity> findAllByCompanyIdAndSourceTypeAndSourceId(Long companyId, String sourceType, Long sourceId);
    void deleteAllByCompanyId(Long companyId);
}
