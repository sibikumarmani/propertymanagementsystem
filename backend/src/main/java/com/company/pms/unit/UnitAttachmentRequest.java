package com.company.pms.unit;

public record UnitAttachmentRequest(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}

