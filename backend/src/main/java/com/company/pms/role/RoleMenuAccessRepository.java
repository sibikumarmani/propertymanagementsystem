package com.company.pms.role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RoleMenuAccessRepository extends JpaRepository<RoleMenuAccessEntity, Long> {

    List<RoleMenuAccessEntity> findAllByRoleId(Long roleId);

    List<RoleMenuAccessEntity> findAllByRoleIdIn(Collection<Long> roleIds);

    void deleteAllByRoleId(Long roleId);
}
