package com.company.pms.approval;

import java.util.List;

public record ApprovalOptionsDto(List<String> transactionTypes, List<String> statuses, List<String> actions) {}
