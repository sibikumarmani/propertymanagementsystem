package com.company.pms.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity, Long> {

    List<UserRoleEntity> findAllByUserId(Long userId);

    List<UserRoleEntity> findAllByRoleId(Long roleId);

    Optional<UserRoleEntity> findByUserIdAndRoleId(Long userId, Long roleId);

    void deleteAllByUserId(Long userId);
}
