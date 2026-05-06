package com.company.pms.lease;

public record LeaseAttachmentDto(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
