package com.company.pms.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<TenantEntity, Long> {

    List<TenantEntity> findAllByCompanyIdOrderByTenantCodeAscIdAsc(Long companyId);

    Optional<TenantEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndTenantCodeIgnoreCase(Long companyId, String tenantCode);

    boolean existsByCompanyIdAndTenantCodeIgnoreCaseAndIdNot(Long companyId, String tenantCode, Long id);
}
