package com.company.pms.rentbilling;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rent-billing")
@PreAuthorize("@menuAccessGuard.hasAccess('rent-billing')")
public class RentBillingController {
    private final RentBillingService rentBillingService;

    public RentBillingController(RentBillingService rentBillingService) {
        this.rentBillingService = rentBillingService;
    }

    @GetMapping("/options")
    public ApiResponse<RentBillingOptionsDto> getOptions() {
        return ApiResponse.ok(rentBillingService.getOptions());
    }

    @GetMapping("/schedules")
    public ApiResponse<List<RentScheduleDto>> getSchedules() {
        return ApiResponse.ok(rentBillingService.getSchedules());
    }

    @PostMapping("/schedules/generate")
    public ApiResponse<List<RentScheduleDto>> generateSchedules(@Valid @RequestBody GenerateRentScheduleRequest request) {
        return ApiResponse.ok(rentBillingService.generateSchedules(request));
    }

    @PostMapping("/schedules/{id}/invoice")
    public ApiResponse<InvoiceDto> createInvoiceFromSchedule(@PathVariable Long id) {
        return ApiResponse.ok(rentBillingService.createInvoiceFromSchedule(id));
    }

    @GetMapping("/invoices")
    public ApiResponse<List<InvoiceDto>> getInvoices() {
        return ApiResponse.ok(rentBillingService.getInvoices());
    }

    @PostMapping("/invoices")
    public ApiResponse<InvoiceDto> createInvoice(@Valid @RequestBody InvoiceUpsertRequest request) {
        return ApiResponse.ok(rentBillingService.createInvoice(request));
    }

    @PostMapping("/invoices/{id}/approve")
    public ApiResponse<InvoiceDto> approveInvoice(@PathVariable Long id) {
        return ApiResponse.ok(rentBillingService.approveInvoice(id));
    }

    @PostMapping("/invoices/{id}/send")
    public ApiResponse<InvoiceDto> sendInvoice(@PathVariable Long id) {
        return ApiResponse.ok(rentBillingService.sendInvoice(id));
    }

    @PostMapping("/invoices/{id}/cancel")
    public ApiResponse<InvoiceDto> cancelInvoice(@PathVariable Long id) {
        return ApiResponse.ok(rentBillingService.cancelInvoice(id));
    }

    @GetMapping("/receipts")
    public ApiResponse<List<ReceiptDto>> getReceipts() {
        return ApiResponse.ok(rentBillingService.getReceipts());
    }

    @PostMapping("/receipts")
    public ApiResponse<ReceiptDto> createReceipt(@Valid @RequestBody ReceiptCreateRequest request) {
        return ApiResponse.ok(rentBillingService.createReceipt(request));
    }

    @GetMapping("/security-deposits")
    public ApiResponse<List<SecurityDepositDto>> getSecurityDeposits() {
        return ApiResponse.ok(rentBillingService.getSecurityDeposits());
    }

    @PostMapping("/security-deposits")
    public ApiResponse<SecurityDepositDto> createSecurityDeposit(@Valid @RequestBody SecurityDepositCreateRequest request) {
        return ApiResponse.ok(rentBillingService.createSecurityDeposit(request));
    }

    @GetMapping("/security-deposits/{id}/history")
    public ApiResponse<List<SecurityDepositTransactionDto>> getSecurityDepositHistory(@PathVariable Long id) {
        return ApiResponse.ok(rentBillingService.getSecurityDepositHistory(id));
    }

    @PostMapping("/security-deposits/{id}/invoice")
    public ApiResponse<InvoiceDto> generateDepositInvoice(@PathVariable Long id) {
        return ApiResponse.ok(rentBillingService.generateDepositInvoice(id));
    }

    @PostMapping("/security-deposits/{id}/collect")
    public ApiResponse<SecurityDepositDto> collectSecurityDeposit(@PathVariable Long id, @Valid @RequestBody SecurityDepositActionRequest request) {
        return ApiResponse.ok(rentBillingService.collectSecurityDeposit(id, request));
    }

    @PostMapping("/security-deposits/{id}/adjust")
    public ApiResponse<SecurityDepositDto> adjustSecurityDeposit(@PathVariable Long id, @Valid @RequestBody SecurityDepositActionRequest request) {
        return ApiResponse.ok(rentBillingService.adjustSecurityDeposit(id, request));
    }

    @PostMapping("/security-deposits/{id}/refund")
    public ApiResponse<SecurityDepositDto> refundSecurityDeposit(@PathVariable Long id, @Valid @RequestBody SecurityDepositActionRequest request) {
        return ApiResponse.ok(rentBillingService.refundSecurityDeposit(id, request));
    }
}
