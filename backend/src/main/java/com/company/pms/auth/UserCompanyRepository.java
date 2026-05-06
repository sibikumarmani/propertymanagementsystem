package com.company.pms.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserCompanyRepository extends JpaRepository<UserCompanyEntity, Long> {

    List<UserCompanyEntity> findAllByUserId(Long userId);

    Optional<UserCompanyEntity> findByUserIdAndCompanyId(Long userId, Long companyId);

    List<UserCompanyEntity> findAllByCompanyIdAndStatusIgnoreCase(Long companyId, String status);

    Optional<UserCompanyEntity> findByUserIdAndCompanyIdAndStatusIgnoreCase(Long userId, Long companyId, String status);

    void deleteAllByUserId(Long userId);
}
