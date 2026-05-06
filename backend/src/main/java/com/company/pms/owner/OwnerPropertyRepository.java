package com.company.pms.owner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OwnerPropertyRepository extends JpaRepository<OwnerPropertyEntity, Long> {

    List<OwnerPropertyEntity> findAllByOwnerId(Long ownerId);

    List<OwnerPropertyEntity> findAllByOwnerIdIn(List<Long> ownerIds);

    List<OwnerPropertyEntity> findAllByPropertyIdIn(List<Long> propertyIds);

    void deleteAllByOwnerId(Long ownerId);
}
