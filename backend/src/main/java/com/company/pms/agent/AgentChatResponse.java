package com.company.pms.agent;

import java.util.List;

public record AgentChatResponse(
    String message,
    String model,
    List<AgentActionResult> actions
) {
}

