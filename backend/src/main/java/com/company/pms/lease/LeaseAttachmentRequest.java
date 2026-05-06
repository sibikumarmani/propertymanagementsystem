package com.company.pms.lease;

public record LeaseAttachmentRequest(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
