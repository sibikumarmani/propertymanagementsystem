package com.company.pms.purchaseexpense;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-expenses")
@PreAuthorize("@menuAccessGuard.hasAccess('purchase-expenses')")
public class PurchaseExpenseController {

    private final PurchaseExpenseService service;

    public PurchaseExpenseController(PurchaseExpenseService service) {
        this.service = service;
    }

    @GetMapping("/options")
    public ApiResponse<PurchaseExpenseOptionsDto> options() {
        return ApiResponse.ok(service.getOptions());
    }

    @GetMapping("/requests")
    public ApiResponse<List<PurchaseRequestDto>> requests() {
        return ApiResponse.ok(service.getRequests());
    }

    @PostMapping("/requests")
    public ApiResponse<PurchaseRequestDto> createRequest(@Valid @RequestBody PurchaseRequestUpsertRequest request) {
        return ApiResponse.ok(service.createRequest(request));
    }

    @PutMapping("/requests/{id}")
    public ApiResponse<PurchaseRequestDto> updateRequest(@PathVariable Long id, @Valid @RequestBody PurchaseRequestUpsertRequest request) {
        return ApiResponse.ok(service.updateRequest(id, request));
    }

    @DeleteMapping("/requests/{id}")
    public ApiResponse<String> deleteRequest(@PathVariable Long id) {
        service.deleteRequest(id);
        return ApiResponse.ok("Purchase request deleted successfully.");
    }

    @GetMapping("/orders")
    public ApiResponse<List<PurchaseOrderDto>> orders() {
        return ApiResponse.ok(service.getOrders());
    }

    @PostMapping("/orders")
    public ApiResponse<PurchaseOrderDto> createOrder(@Valid @RequestBody PurchaseOrderUpsertRequest request) {
        return ApiResponse.ok(service.createOrder(request));
    }

    @PutMapping("/orders/{id}")
    public ApiResponse<PurchaseOrderDto> updateOrder(@PathVariable Long id, @Valid @RequestBody PurchaseOrderUpsertRequest request) {
        return ApiResponse.ok(service.updateOrder(id, request));
    }

    @DeleteMapping("/orders/{id}")
    public ApiResponse<String> deleteOrder(@PathVariable Long id) {
        service.deleteOrder(id);
        return ApiResponse.ok("Purchase order deleted successfully.");
    }

    @GetMapping("/invoices")
    public ApiResponse<List<VendorInvoiceDto>> invoices() {
        return ApiResponse.ok(service.getInvoices());
    }

    @PostMapping("/invoices")
    public ApiResponse<VendorInvoiceDto> createInvoice(@Valid @RequestBody VendorInvoiceUpsertRequest request) {
        return ApiResponse.ok(service.createInvoice(request));
    }

    @PutMapping("/invoices/{id}")
    public ApiResponse<VendorInvoiceDto> updateInvoice(@PathVariable Long id, @Valid @RequestBody VendorInvoiceUpsertRequest request) {
        return ApiResponse.ok(service.updateInvoice(id, request));
    }

    @DeleteMapping("/invoices/{id}")
    public ApiResponse<String> deleteInvoice(@PathVariable Long id) {
        service.deleteInvoice(id);
        return ApiResponse.ok("Vendor invoice deleted successfully.");
    }

    @GetMapping("/expenses")
    public ApiResponse<List<PropertyExpenseDto>> expenses() {
        return ApiResponse.ok(service.getExpenses());
    }

    @PostMapping("/expenses")
    public ApiResponse<PropertyExpenseDto> createExpense(@Valid @RequestBody PropertyExpenseUpsertRequest request) {
        return ApiResponse.ok(service.createExpense(request));
    }

    @PutMapping("/expenses/{id}")
    public ApiResponse<PropertyExpenseDto> updateExpense(@PathVariable Long id, @Valid @RequestBody PropertyExpenseUpsertRequest request) {
        return ApiResponse.ok(service.updateExpense(id, request));
    }

    @DeleteMapping("/expenses/{id}")
    public ApiResponse<String> deleteExpense(@PathVariable Long id) {
        service.deleteExpense(id);
        return ApiResponse.ok("Property expense deleted successfully.");
    }
}
