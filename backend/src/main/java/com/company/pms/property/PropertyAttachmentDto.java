package com.company.pms.property;

public record PropertyAttachmentDto(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
