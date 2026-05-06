package com.company.pms.maintenance;

public record MaintenanceAttachmentDto(
    String fileName,
    String contentType,
    String dataUrl,
    Long fileSize
) {
}
