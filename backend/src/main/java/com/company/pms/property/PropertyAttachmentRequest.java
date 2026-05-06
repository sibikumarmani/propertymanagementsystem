package com.company.pms.property;

public record PropertyAttachmentRequest(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
