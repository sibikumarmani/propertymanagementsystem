package com.company.pms.unit;

public record UnitAttachmentDto(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}

