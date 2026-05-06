package com.company.pms.owner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OwnerPropertyRepository extends JpaRepository<OwnerPropertyEntity, Long> {

    List<OwnerPropertyEntity> findAllByOwnerId(Long ownerId);

    List<OwnerPropertyEntity> findAllByOwnerIdIn(List<Long> ownerIds);

    void deleteAllByOwnerId(Long ownerId);
}
