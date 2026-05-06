package com.company.pms.tenant;

public record TenantAttachmentRequest(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
