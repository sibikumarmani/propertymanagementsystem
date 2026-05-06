package com.company.pms.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {

    Optional<RoleEntity> findByRoleNameIgnoreCase(String roleName);

    boolean existsByRoleNameIgnoreCase(String roleName);

    boolean existsByRoleNameIgnoreCaseAndIdNot(String roleName, Long id);

    Optional<RoleEntity> findByDefaultRoleTrueAndStatusIgnoreCase(String status);

    List<RoleEntity> findAllByOrderByRoleNameAsc();

    @Modifying
    @Query("update RoleEntity role set role.defaultRole = false where role.defaultRole = true and role.id <> :excludedId")
    void clearDefaultRoleForOthers(@Param("excludedId") Long excludedId);
}
