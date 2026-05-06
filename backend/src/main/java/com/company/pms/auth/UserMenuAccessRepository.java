package com.company.pms.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserMenuAccessRepository extends JpaRepository<UserMenuAccessEntity, Long> {

    List<UserMenuAccessEntity> findAllByUserId(Long userId);

    void deleteAllByUserId(Long userId);
}
