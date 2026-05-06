package com.company.pms.agent;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class AgentService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String agentPythonUrl;

    public AgentService(
        ObjectMapper objectMapper,
        @Value("${app.agent.python-url:http://localhost:8000}") String agentPythonUrl
    ) {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
        this.objectMapper = objectMapper;
        this.agentPythonUrl = agentPythonUrl == null ? "http://localhost:8000" : agentPythonUrl.replaceAll("/+$", "");
    }

    public AgentChatResponse chat(AgentChatRequest request, String authorizationHeader) {
        HttpRequest.Builder httpRequestBuilder = HttpRequest.newBuilder()
            .uri(URI.create(agentPythonUrl + "/chat"))
            .timeout(Duration.ofSeconds(90))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(toJson(request)));

        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            httpRequestBuilder.header("Authorization", authorizationHeader);
        }

        HttpResponse<String> response;
        try {
            response = httpClient.send(httpRequestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Agent service is unavailable", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Agent service request was interrupted", exception);
        }

        if (response.statusCode() >= 400) {
            String detail = extractErrorDetail(response.body());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, detail);
        }

        try {
            return objectMapper.readValue(response.body(), AgentChatResponse.class);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Agent service returned an invalid response", exception);
        }
    }

    private String toJson(AgentChatRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to serialize agent request", exception);
        }
    }

    private String extractErrorDetail(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Agent service request failed";
        }

        try {
            AgentErrorResponse errorResponse = objectMapper.readValue(responseBody, AgentErrorResponse.class);
            if (errorResponse.detail() != null && !errorResponse.detail().isBlank()) {
                return errorResponse.detail();
            }
        } catch (JsonProcessingException ignored) {
            return responseBody;
        }

        return responseBody;
    }

    private record AgentErrorResponse(String detail) {
    }
}

