package com.company.pms.asset;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetServiceHistoryRepository extends JpaRepository<AssetServiceHistoryEntity, Long> {
    List<AssetServiceHistoryEntity> findAllByCompanyIdOrderByServiceDateDescIdDesc(Long companyId);
    Optional<AssetServiceHistoryEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndServiceNumberIgnoreCase(Long companyId, String serviceNumber);
    boolean existsByCompanyIdAndServiceNumberIgnoreCaseAndIdNot(Long companyId, String serviceNumber, Long id);
}
