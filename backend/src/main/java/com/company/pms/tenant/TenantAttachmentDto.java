package com.company.pms.tenant;

public record TenantAttachmentDto(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
