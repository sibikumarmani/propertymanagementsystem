package com.company.pms.agent;

public record AgentActionResult(
    String toolName,
    boolean success,
    String summary
) {
}

