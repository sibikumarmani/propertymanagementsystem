package com.company.pms.document;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@PreAuthorize("@menuAccessGuard.hasAccess('documents')")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public ApiResponse<List<DocumentDto>> getDocuments() {
        return ApiResponse.ok(documentService.getDocuments());
    }

    @GetMapping("/options")
    public ApiResponse<DocumentOptionsDto> getOptions() {
        return ApiResponse.ok(documentService.getOptions());
    }

    @GetMapping("/expiring")
    public ApiResponse<List<DocumentDto>> getExpiringDocuments(@RequestParam(required = false) Integer days) {
        return ApiResponse.ok(documentService.getExpiringDocuments(days));
    }

    @GetMapping("/{id}")
    public ApiResponse<DocumentDto> getDocument(@PathVariable Long id) {
        return ApiResponse.ok(documentService.getDocument(id));
    }

    @GetMapping("/{id}/download")
    public ApiResponse<DocumentDto> downloadDocument(@PathVariable Long id) {
        return ApiResponse.ok(documentService.getDocument(id));
    }

    @PostMapping
    public ApiResponse<DocumentDto> createDocument(@Valid @RequestBody DocumentUpsertRequest request) {
        return ApiResponse.ok(documentService.createDocument(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<DocumentDto> updateDocument(@PathVariable Long id, @Valid @RequestBody DocumentUpsertRequest request) {
        return ApiResponse.ok(documentService.updateDocument(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ApiResponse.ok("Document deleted successfully.");
    }
}
