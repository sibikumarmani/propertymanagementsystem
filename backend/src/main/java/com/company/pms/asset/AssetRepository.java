package com.company.pms.asset;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<AssetEntity, Long> {
    List<AssetEntity> findAllByCompanyIdOrderByAssetNameAscIdAsc(Long companyId);
    Optional<AssetEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndAssetCodeIgnoreCase(Long companyId, String assetCode);
    boolean existsByCompanyIdAndAssetCodeIgnoreCaseAndIdNot(Long companyId, String assetCode, Long id);
}
