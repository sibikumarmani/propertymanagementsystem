package com.company.pms.purchaseexpense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PropertyExpenseRepository extends JpaRepository<PropertyExpenseEntity, Long> {
    List<PropertyExpenseEntity> findAllByCompanyIdOrderByExpenseDateDescIdDesc(Long companyId);
    Optional<PropertyExpenseEntity> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCompanyIdAndExpenseNumberIgnoreCase(Long companyId, String expenseNumber);
    boolean existsByCompanyIdAndExpenseNumberIgnoreCaseAndIdNot(Long companyId, String expenseNumber, Long id);
}
