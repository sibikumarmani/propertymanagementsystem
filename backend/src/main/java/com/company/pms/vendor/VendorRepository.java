package com.company.pms.vendor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<VendorEntity, Long> {

    List<VendorEntity> findAllByCompanyIdOrderByVendorNameAscIdAsc(Long companyId);

    Optional<VendorEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndVendorCodeIgnoreCase(Long companyId, String vendorCode);

    boolean existsByCompanyIdAndVendorCodeIgnoreCaseAndIdNot(Long companyId, String vendorCode, Long id);
}
