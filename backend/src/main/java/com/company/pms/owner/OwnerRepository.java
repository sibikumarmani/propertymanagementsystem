package com.company.pms.owner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OwnerRepository extends JpaRepository<OwnerEntity, Long> {

    List<OwnerEntity> findAllByCompanyIdOrderByOwnerNameAscIdAsc(Long companyId);

    Optional<OwnerEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndOwnerCodeIgnoreCase(Long companyId, String ownerCode);

    boolean existsByCompanyIdAndOwnerCodeIgnoreCaseAndIdNot(Long companyId, String ownerCode, Long id);
}
