package com.company.pms.company;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {

    Optional<CompanyEntity> findByCompanyCodeIgnoreCase(String companyCode);

    boolean existsByCompanyCodeIgnoreCase(String companyCode);

    boolean existsByCompanyCodeIgnoreCaseAndIdNot(String companyCode, Long id);

    Optional<CompanyEntity> findByDefaultCompanyTrueAndStatusIgnoreCase(String status);

    List<CompanyEntity> findAllByOrderByCompanyNameAsc();

    @Modifying
    @Query("update CompanyEntity company set company.defaultCompany = false where company.defaultCompany = true and company.id <> :excludedId")
    void clearDefaultCompanyForOthers(@Param("excludedId") Long excludedId);
}
