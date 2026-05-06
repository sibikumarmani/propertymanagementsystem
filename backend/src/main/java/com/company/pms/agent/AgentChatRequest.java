package com.company.pms.agent;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record AgentChatRequest(
    @NotBlank String message,
    List<AgentChatMessage> history
) {
}

