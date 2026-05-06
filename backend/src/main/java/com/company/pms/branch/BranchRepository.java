package com.company.pms.branch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<BranchEntity, Long> {

    List<BranchEntity> findAllByOrderByBranchNameAsc();

    List<BranchEntity> findAllByCompanyIdOrderByBranchNameAscIdAsc(Long companyId);

    Optional<BranchEntity> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByCompanyIdAndBranchCodeIgnoreCase(Long companyId, String branchCode);

    boolean existsByCompanyIdAndBranchCodeIgnoreCaseAndIdNot(Long companyId, String branchCode, Long id);
}
