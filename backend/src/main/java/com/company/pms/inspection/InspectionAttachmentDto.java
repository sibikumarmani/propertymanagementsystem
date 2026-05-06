package com.company.pms.inspection;

public record InspectionAttachmentDto(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
