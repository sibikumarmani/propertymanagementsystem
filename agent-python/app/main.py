from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_TOOL_ROUNDS = 10
SYSTEM_PROMPT = """
You are a data-entry agent for an enterprise Property Management System.

Your job is to create property-management records by using the provided tools.

Rules:
- Use tools whenever the user is asking to create, prepare, register, add, log, or seed property-management data.
- Never invent numeric IDs. If you need an existing role, user, company, branch, property, unit, tenant, owner, or vendor, first call a listing tool.
- Create only the records the user asked for.
- If required information is missing, stop and ask a concise follow-up question instead of guessing.
- Keep passwords explicit only when the user provided one. If the user did not provide a password for a new user, ask for it.
- Prefer creating linked records in the correct order: company, branch, property, unit, then tenant or owner.
- After tool execution, summarize exactly what was created and mention any remaining gaps.
""".strip()


class AgentChatMessage(BaseModel):
    role: str
    content: str


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[AgentChatMessage] | None = None


class AgentActionResult(BaseModel):
    toolName: str
    success: bool
    summary: str


class AgentChatResponse(BaseModel):
    message: str
    model: str
    actions: list[AgentActionResult]


app = FastAPI(title="Property Management Python Agent")


def openrouter_api_key() -> str:
    value = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not value:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY is not configured for the chatbot agent")
    return value


def openrouter_model() -> str:
    return os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b").strip() or "openai/gpt-oss-120b"


def backend_api_base_url() -> str:
    return os.getenv("BACKEND_API_BASE_URL", "http://backend:8080/api").rstrip("/")


def build_messages(request: AgentChatRequest) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in request.history or []:
        role = item.role.strip().lower()
        if role not in {"system", "user", "assistant"}:
            role = "user"
        if item.content.strip():
            messages.append({"role": role, "content": item.content.strip()})
    messages.append({"role": "user", "content": request.message.strip()})
    return messages


def tool_definitions() -> list[dict[str, Any]]:
    def schema(properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": False,
        }

    def function_tool(name: str, description: str, parameters: dict[str, Any]) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": parameters,
            },
        }

    return [
        function_tool("list_roles", "List roles so you can resolve valid role IDs.", schema({}, [])),
        function_tool("list_users", "List users so you can resolve manager or assignee IDs.", schema({}, [])),
        function_tool("list_companies", "List companies so you can resolve company IDs.", schema({}, [])),
        function_tool("list_branches", "List branches so you can resolve branch IDs.", schema({}, [])),
        function_tool("list_properties", "List properties so you can resolve property IDs.", schema({}, [])),
        function_tool("list_units", "List units so you can resolve unit IDs.", schema({}, [])),
        function_tool("list_tenants", "List tenants so you can resolve tenant records.", schema({}, [])),
        function_tool("list_vendors", "List vendors so you can resolve vendor records.", schema({}, [])),
        function_tool("list_owners", "List owners so you can resolve owner records.", schema({}, [])),
        function_tool(
            "create_company",
            "Create a new company.",
            schema(
                {
                    "companyName": {"type": "string"},
                    "companyCode": {"type": ["string", "null"]},
                    "email": {"type": ["string", "null"]},
                    "phone": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "city": {"type": ["string", "null"]},
                    "state": {"type": ["string", "null"]},
                    "country": {"type": ["string", "null"]},
                    "postalCode": {"type": ["string", "null"]},
                    "gstNumber": {"type": ["string", "null"]},
                    "taxNumber": {"type": ["string", "null"]},
                    "defaultCompany": {"type": "boolean"},
                    "status": {"type": "string"},
                },
                ["companyName", "defaultCompany", "status"],
            ),
        ),
        function_tool(
            "create_branch",
            "Create a new branch under a company.",
            schema(
                {
                    "companyId": {"type": "integer"},
                    "branchName": {"type": "string"},
                    "branchCode": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "city": {"type": ["string", "null"]},
                    "state": {"type": ["string", "null"]},
                    "country": {"type": ["string", "null"]},
                    "postalCode": {"type": ["string", "null"]},
                    "status": {"type": "string"},
                },
                ["companyId", "branchName", "status"],
            ),
        ),
        function_tool(
            "create_property",
            "Create a new property.",
            schema(
                {
                    "branchId": {"type": ["integer", "null"]},
                    "propertyCode": {"type": "string"},
                    "propertyName": {"type": "string"},
                    "propertyType": {"type": "string"},
                    "ownershipType": {"type": "string"},
                    "ownerReference": {"type": ["string", "null"]},
                    "ownershipDetails": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "city": {"type": ["string", "null"]},
                    "state": {"type": ["string", "null"]},
                    "country": {"type": ["string", "null"]},
                    "pincode": {"type": ["string", "null"]},
                    "latitude": {"type": ["number", "null"]},
                    "longitude": {"type": ["number", "null"]},
                    "totalLandArea": {"type": ["number", "null"]},
                    "builtUpArea": {"type": ["number", "null"]},
                    "numberOfFloors": {"type": ["integer", "null"]},
                    "numberOfUnits": {"type": ["integer", "null"]},
                    "parkingAvailable": {"type": "boolean"},
                    "propertyManagerUserId": {"type": ["integer", "null"]},
                    "maintenanceManagerUserId": {"type": ["integer", "null"]},
                    "amenitiesSummary": {"type": ["string", "null"]},
                    "facilitiesSummary": {"type": ["string", "null"]},
                    "blockConfiguration": {"type": ["string", "null"]},
                    "unitConfiguration": {"type": ["string", "null"]},
                    "documentSummary": {"type": ["string", "null"]},
                    "status": {"type": "string"},
                },
                ["propertyCode", "propertyName", "propertyType", "ownershipType", "parkingAvailable", "status"],
            ),
        ),
        function_tool(
            "create_unit",
            "Create a new unit under a property.",
            schema(
                {
                    "propertyId": {"type": "integer"},
                    "unitCode": {"type": "string"},
                    "blockName": {"type": ["string", "null"]},
                    "floorName": {"type": ["string", "null"]},
                    "unitNumber": {"type": "string"},
                    "unitType": {"type": "string"},
                    "bedroomCount": {"type": ["integer", "null"]},
                    "bathroomCount": {"type": ["integer", "null"]},
                    "areaSqft": {"type": ["number", "null"]},
                    "furnishingType": {"type": ["string", "null"]},
                    "parkingCount": {"type": ["integer", "null"]},
                    "baseRent": {"type": ["number", "null"]},
                    "securityDepositAmount": {"type": ["number", "null"]},
                    "maintenanceCharge": {"type": ["number", "null"]},
                    "utilityCharge": {"type": ["number", "null"]},
                    "taxApplicable": {"type": "boolean"},
                    "unitStatus": {"type": "string"},
                    "marketRent": {"type": ["number", "null"]},
                    "minimumRent": {"type": ["number", "null"]},
                    "availabilityDate": {"type": ["string", "null"]},
                    "photoSummary": {"type": ["string", "null"]},
                    "documentSummary": {"type": ["string", "null"]},
                },
                ["propertyId", "unitCode", "unitNumber", "unitType", "taxApplicable", "unitStatus"],
            ),
        ),
        function_tool(
            "create_tenant",
            "Create a new tenant record.",
            schema(
                {
                    "tenantCode": {"type": "string"},
                    "tenantType": {"type": "string"},
                    "firstName": {"type": ["string", "null"]},
                    "lastName": {"type": ["string", "null"]},
                    "companyName": {"type": ["string", "null"]},
                    "phoneNumber": {"type": "string"},
                    "email": {"type": ["string", "null"]},
                    "alternatePhone": {"type": ["string", "null"]},
                    "dateOfBirthOrRegistration": {"type": ["string", "null"]},
                    "idProofType": {"type": ["string", "null"]},
                    "idProofNumber": {"type": ["string", "null"]},
                    "taxNumber": {"type": ["string", "null"]},
                    "gstNumber": {"type": ["string", "null"]},
                    "emergencyContact": {"type": ["string", "null"]},
                    "employerDetails": {"type": ["string", "null"]},
                    "currentAddress": {"type": ["string", "null"]},
                    "permanentAddress": {"type": ["string", "null"]},
                    "kycStatus": {"type": "string"},
                    "blacklistStatus": {"type": "string"},
                    "tenantStatus": {"type": "string"},
                    "kycStage": {"type": "string"},
                    "idProofDocumentNote": {"type": ["string", "null"]},
                    "addressProofDocumentNote": {"type": ["string", "null"]},
                    "financialDocumentNote": {"type": ["string", "null"]},
                },
                ["tenantCode", "tenantType", "phoneNumber", "kycStatus", "blacklistStatus", "tenantStatus", "kycStage"],
            ),
        ),
        function_tool(
            "create_vendor",
            "Create a new vendor record.",
            schema(
                {
                    "vendorCode": {"type": "string"},
                    "vendorName": {"type": "string"},
                    "contactPerson": {"type": ["string", "null"]},
                    "phone": {"type": "string"},
                    "email": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "serviceCategory": {"type": ["string", "null"]},
                    "taxNumber": {"type": ["string", "null"]},
                    "bankDetails": {"type": ["string", "null"]},
                    "contractStatus": {"type": "string"},
                    "insuranceDetails": {"type": ["string", "null"]},
                    "rating": {"type": ["number", "null"]},
                    "vendorStatus": {"type": "string"},
                    "assignmentStage": {"type": "string"},
                },
                ["vendorCode", "vendorName", "phone", "contractStatus", "vendorStatus", "assignmentStage"],
            ),
        ),
        function_tool(
            "create_owner",
            "Create a new owner record.",
            schema(
                {
                    "ownerCode": {"type": "string"},
                    "ownerName": {"type": "string"},
                    "phone": {"type": "string"},
                    "email": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "taxDetails": {"type": ["string", "null"]},
                    "bankAccountDetails": {"type": ["string", "null"]},
                    "propertyIds": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                    "ownershipPercentage": {"type": ["number", "null"]},
                    "payoutFrequency": {"type": "string"},
                    "statementPreference": {"type": "string"},
                    "ownerStatus": {"type": "string"},
                    "statementStage": {"type": "string"},
                },
                ["ownerCode", "ownerName", "phone", "propertyIds", "payoutFrequency", "statementPreference", "ownerStatus", "statementStage"],
            ),
        ),
        function_tool(
            "create_user",
            "Create a new application user.",
            schema(
                {
                    "fullName": {"type": "string"},
                    "email": {"type": "string"},
                    "phone": {"type": ["string", "null"]},
                    "password": {"type": "string"},
                    "status": {"type": "string"},
                    "emailVerified": {"type": "boolean"},
                    "avatarImage": {"type": ["string", "null"]},
                    "roleIds": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                    "companyIds": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                    "defaultCompanyId": {"type": "integer"},
                    "menuAccessOverrides": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "menuKey": {"type": "string"},
                                "allowed": {"type": "boolean"},
                            },
                            "required": ["menuKey", "allowed"],
                            "additionalProperties": False,
                        },
                    },
                },
                ["fullName", "email", "password", "status", "emailVerified", "roleIds", "companyIds", "defaultCompanyId"],
            ),
        ),
    ]


def backend_request(
    method: str,
    path: str,
    authorization: str | None,
    json_body: dict[str, Any] | None = None,
) -> Any:
    headers: dict[str, str] = {}
    if authorization:
        headers["Authorization"] = authorization

    url = f"{backend_api_base_url()}{path}"
    with httpx.Client(timeout=30.0) as client:
        response = client.request(method, url, headers=headers, json=json_body)

    if response.status_code >= 400:
        detail = ""
        try:
            payload = response.json()
            detail = payload.get("message") or payload.get("error") or response.text
        except Exception:
            detail = response.text
        raise HTTPException(status_code=400, detail=detail.strip() or f"Backend request failed for {path}")

    payload = response.json()
    return payload.get("data") if isinstance(payload, dict) and "data" in payload else payload


def summarize_success(tool_name: str, result: Any, arguments: dict[str, Any]) -> str:
    if tool_name == "create_company":
        return f"Created company {result.get('companyCode') or arguments.get('companyCode') or '-'} ({result.get('companyName') or arguments['companyName']})"
    if tool_name == "create_branch":
        return f"Created branch {result.get('branchCode') or arguments.get('branchCode') or '-'} ({result.get('branchName') or arguments['branchName']})"
    if tool_name == "create_property":
        return f"Created property {result.get('propertyCode') or arguments['propertyCode']} ({result.get('propertyName') or arguments['propertyName']})"
    if tool_name == "create_unit":
        return f"Created unit {result.get('unitCode') or arguments['unitCode']} ({result.get('unitNumber') or arguments['unitNumber']})"
    if tool_name == "create_tenant":
        return f"Created tenant {result.get('tenantCode') or arguments['tenantCode']}"
    if tool_name == "create_vendor":
        return f"Created vendor {result.get('vendorCode') or arguments['vendorCode']} ({result.get('vendorName') or arguments['vendorName']})"
    if tool_name == "create_owner":
        return f"Created owner {result.get('ownerCode') or arguments['ownerCode']} ({result.get('ownerName') or arguments['ownerName']})"
    if tool_name == "create_user":
        return f"Created user {result.get('userCode') or '-'} ({result.get('email') or arguments['email']})"
    if isinstance(result, list):
        return f"Returned {len(result)} records"
    return "Action completed"


def execute_tool(tool_name: str, arguments: dict[str, Any], authorization: str | None) -> tuple[bool, str, Any]:
    try:
        if tool_name == "list_roles":
            result = backend_request("GET", "/roles", authorization)
        elif tool_name == "list_users":
            result = backend_request("GET", "/users", authorization)
        elif tool_name == "list_companies":
            result = backend_request("GET", "/companies", authorization)
        elif tool_name == "list_branches":
            result = backend_request("GET", "/branches", authorization)
        elif tool_name == "list_properties":
            result = backend_request("GET", "/properties", authorization)
        elif tool_name == "list_units":
            result = backend_request("GET", "/units", authorization)
        elif tool_name == "list_tenants":
            result = backend_request("GET", "/tenants", authorization)
        elif tool_name == "list_vendors":
            result = backend_request("GET", "/vendors", authorization)
        elif tool_name == "list_owners":
            result = backend_request("GET", "/owners", authorization)
        elif tool_name == "create_company":
            result = backend_request("POST", "/companies", authorization, arguments)
        elif tool_name == "create_branch":
            result = backend_request("POST", "/branches", authorization, arguments)
        elif tool_name == "create_property":
            result = backend_request("POST", "/properties", authorization, arguments)
        elif tool_name == "create_unit":
            result = backend_request("POST", "/units", authorization, arguments)
        elif tool_name == "create_tenant":
            result = backend_request("POST", "/tenants", authorization, arguments)
        elif tool_name == "create_vendor":
            result = backend_request("POST", "/vendors", authorization, arguments)
        elif tool_name == "create_owner":
            result = backend_request("POST", "/owners", authorization, arguments)
        elif tool_name == "create_user":
            body = {
                "fullName": arguments["fullName"],
                "email": arguments["email"],
                "phone": arguments.get("phone"),
                "password": arguments["password"],
                "status": arguments["status"],
                "emailVerified": arguments["emailVerified"],
                "avatarImage": arguments.get("avatarImage"),
                "roleIds": arguments["roleIds"],
                "companyIds": arguments["companyIds"],
                "defaultCompanyId": arguments["defaultCompanyId"],
                "menuAccessOverrides": arguments.get("menuAccessOverrides", []),
            }
            result = backend_request("POST", "/users", authorization, body)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported agent tool: {tool_name}")

        return True, summarize_success(tool_name, result, arguments), result
    except HTTPException as exc:
        error_payload = {"tool": tool_name, "success": False, "error": exc.detail}
        return False, str(exc.detail), error_payload


async def openrouter_completion(messages: list[dict[str, Any]]) -> dict[str, Any]:
    payload = {
        "model": openrouter_model(),
        "messages": messages,
        "tools": tool_definitions(),
        "tool_choice": "auto",
    }
    headers = {
        "Authorization": f"Bearer {openrouter_api_key()}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(3):
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            if response.status_code < 400:
                return response.json()

            if response.status_code not in {429, 503} or attempt == 2:
                try:
                    detail = response.json()
                except Exception:
                    detail = response.text
                raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {detail}")

            await asyncio.sleep(1 + attempt)

    raise HTTPException(status_code=502, detail="OpenRouter request failed after retries")


@app.post("/chat", response_model=AgentChatResponse)
async def chat(request: AgentChatRequest, authorization: str | None = Header(default=None)) -> AgentChatResponse:
    messages = build_messages(request)
    actions: list[AgentActionResult] = []
    response = await openrouter_completion(messages)

    for _ in range(MAX_TOOL_ROUNDS):
        assistant_message = response.get("choices", [{}])[0].get("message", {})
        tool_calls = assistant_message.get("tool_calls") or []
        if not tool_calls:
            content = (assistant_message.get("content") or "").strip()
            if not content and actions:
                content = f"Completed {len(actions)} record actions successfully."
            if not content:
                content = "I could not complete that request."
            return AgentChatResponse(message=content, model=openrouter_model(), actions=actions)

        messages.append(assistant_message)
        for tool_call in tool_calls:
            function = tool_call.get("function", {})
            tool_name = function.get("name", "")
            raw_args = function.get("arguments", "{}")
            try:
                arguments = json.loads(raw_args)
            except json.JSONDecodeError:
                arguments = {}

            success, summary, result = execute_tool(tool_name, arguments, authorization)
            actions.append(AgentActionResult(toolName=tool_name, success=success, summary=summary))
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.get("id"),
                    "content": json.dumps(result),
                }
            )

        response = await openrouter_completion(messages)

    raise HTTPException(status_code=502, detail="Chatbot agent reached the maximum tool-call loop without producing a final response")

