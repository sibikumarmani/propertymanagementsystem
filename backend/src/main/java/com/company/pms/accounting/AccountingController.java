package com.company.pms.accounting;

import com.company.pms.common.api.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accounting")
@PreAuthorize("@menuAccessGuard.hasAccess('accounting')")
public class AccountingController {
    private final AccountingService accountingService;
    public AccountingController(AccountingService accountingService) { this.accountingService = accountingService; }
    @PostMapping("/post") public ApiResponse<AccountingPostResponse> post() { return ApiResponse.ok(accountingService.postAccounting()); }
    @GetMapping("/entries") public ApiResponse<List<AccountingEntryDto>> entries(@RequestParam(required = false) String accountType, @RequestParam(required = false) String partyType, @RequestParam(required = false) Long partyId) { return ApiResponse.ok(accountingService.entries(accountType, partyType, partyId)); }
    @GetMapping("/summary") public ApiResponse<AccountingSummaryDto> summary() { return ApiResponse.ok(accountingService.summary()); }
    @GetMapping("/reports/{type}") public ApiResponse<List<AccountingReportRowDto>> report(@PathVariable String type) { return ApiResponse.ok(accountingService.report(type)); }
}
