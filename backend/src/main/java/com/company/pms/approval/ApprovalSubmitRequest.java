package com.company.pms.approval;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ApprovalSubmitRequest(@NotBlank String transactionType, @NotNull Long entityId, @NotBlank String referenceNumber, BigDecimal amount, String remarks) {}
