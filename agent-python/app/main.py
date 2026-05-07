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
- You can add data for all supported modules: roles, users, companies, branches, properties, buildings, floors, units, tenants, leases, rent schedules, invoices, receipts, security deposits, maintenance requests, work orders, preventive maintenance, utilities, assets, inspections, purchase and expense records, vendors, owners, documents, notifications, and approval configs.
- Never invent numeric IDs. If you need an existing linked record, first call a listing tool or list_records for the related entity type.
- Create only the records the user asked for.
- If required information is missing, stop and ask a concise follow-up question instead of guessing.
- Keep passwords explicit only when the user provided one. If the user did not provide a password for a new user, ask for it.
- Prefer creating linked records in the correct order: company, branch, property, building, floor, unit, then tenant, lease, billing, maintenance, utilities, inspections, assets, purchase/expense, documents, notifications, or owner records.
- For any module without a dedicated create_* tool, use create_record with the correct entityType and JSON payload. Required fields are the same as the application form/API names.
- After tool execution, summarize exactly what was created and mention any remaining gaps.
""".strip()


LIST_ENDPOINTS: dict[str, str] = {
    "roles": "/roles",
    "users": "/users",
    "companies": "/companies",
    "branches": "/branches",
    "properties": "/properties",
    "buildings": "/buildings",
    "floors": "/floors",
    "units": "/units",
    "tenants": "/tenants",
    "leases": "/leases",
    "rent_schedules": "/rent-billing/schedules",
    "rent_invoices": "/rent-billing/invoices",
    "rent_receipts": "/rent-billing/receipts",
    "security_deposits": "/rent-billing/security-deposits",
    "maintenance_requests": "/maintenance/requests",
    "maintenance_work_orders": "/maintenance/work-orders",
    "preventive_maintenance": "/maintenance/preventive",
    "utility_types": "/utilities/types",
    "utility_readings": "/utilities/readings",
    "utility_bills": "/utilities/bills",
    "assets": "/assets",
    "asset_maintenance_schedules": "/assets/maintenance-schedules",
    "asset_service_history": "/assets/service-history",
    "inspections": "/inspections",
    "purchase_requests": "/purchase-expenses/requests",
    "purchase_orders": "/purchase-expenses/orders",
    "purchase_invoices": "/purchase-expenses/invoices",
    "expenses": "/purchase-expenses/expenses",
    "vendors": "/vendors",
    "owners": "/owners",
    "documents": "/documents",
    "notifications": "/notifications",
    "approval_configs": "/approvals/configs",
}

CREATE_ENDPOINTS: dict[str, str] = {
    "role": "/roles",
    "user": "/users",
    "company": "/companies",
    "branch": "/branches",
    "property": "/properties",
    "building": "/buildings",
    "floor": "/floors",
    "unit": "/units",
    "tenant": "/tenants",
    "lease": "/leases",
    "rent_schedule": "/rent-billing/schedules/generate",
    "rent_invoice": "/rent-billing/invoices",
    "rent_receipt": "/rent-billing/receipts",
    "security_deposit": "/rent-billing/security-deposits",
    "maintenance_request": "/maintenance/requests",
    "maintenance_work_order": "/maintenance/work-orders",
    "preventive_maintenance": "/maintenance/preventive",
    "utility_type": "/utilities/types",
    "utility_reading": "/utilities/readings",
    "utility_bill": "/utilities/bills",
    "asset": "/assets",
    "asset_maintenance_schedule": "/assets/maintenance-schedules",
    "asset_service_history": "/assets/service-history",
    "inspection": "/inspections",
    "purchase_request": "/purchase-expenses/requests",
    "purchase_order": "/purchase-expenses/orders",
    "purchase_invoice": "/purchase-expenses/invoices",
    "expense": "/purchase-expenses/expenses",
    "vendor": "/vendors",
    "owner": "/owners",
    "document": "/documents",
    "notification": "/notifications",
    "approval_config": "/approvals/configs",
}

CREATE_ENTITY_HELP = """
Supported create_record entityType values and important payload fields:
- role: roleName, description, defaultRole, status, menuAccessKeys
- user: fullName, email, phone, password, status, emailVerified, roleIds, companyIds, defaultCompanyId, menuAccessOverrides
- company: companyName, companyCode, email, phone, address, city, state, country, postalCode, gstNumber, taxNumber, defaultCompany, status
- branch: companyId, branchName, branchCode, address, city, state, country, postalCode, status
- property: branchId, propertyCode, propertyName, propertyType, ownershipType, ownerReference, ownershipDetails, address, city, state, country, pincode, totalFloors, totalUnits, propertyManagerUserId, amenitiesSummary, status
- building: propertyId, buildingCode, buildingName, numberOfFloors, amenitiesSummary, description, status
- floor: buildingId, floorCode, floorName, floorNumber, status
- unit: propertyId, buildingId, floorId, unitCode, unitNumber, unitType, areaValue, areaUnit, baseRent, securityDepositAmount, unitStatus, availabilityDate
- tenant: tenantCode, tenantType, firstName, lastName, companyName, phoneNumber, email, kycStatus, blacklistStatus, tenantStatus, kycStage
- lease: leaseNumber, tenantId, unitId, leaseStartDate, leaseEndDate, rentAmount, securityDepositAmount, billingCycle, dueDay, status
- rent_schedule: leaseId, fromDate, toDate, lateFeeAmount
- rent_invoice: invoiceNumber, invoiceType, leaseId, rentScheduleId, tenantId, propertyId, unitId, invoiceDate, dueDate, subtotalAmount, taxAmount, discountAmount, lateFeeAmount, status, description
- rent_receipt: receiptNumber, invoiceId, tenantId, receiptDate, paymentMode, amount, referenceNumber, remarks
- security_deposit: leaseId, depositNumber, remarks
- maintenance_request: requestNumber, tenantId, propertyId, unitId, category, priority, description, assignedVendorId, assignedUserId, estimatedCost, actualCost, status, approvalStatus, completionRemarks
- maintenance_work_order: workOrderNumber, maintenanceRequestId, vendorId, technicianUserId, materialsUsed, laborCharges, completionRemarks, approvalStatus, status
- preventive_maintenance: scheduleNumber, propertyId, unitId, assetName, maintenanceType, recurrenceFrequency, nextDueDate, responsibleUserId, vendorId, notifyBeforeDays, completionStatus, lastCompletedDate, completionRemarks, status
- utility_type: typeCode, typeName, category, billingMethod, unitOfMeasure, defaultRate, fixedCharge, commonArea, status, description
- utility_reading: readingNumber, utilityTypeId, propertyId, unitId, tenantId, meterNumber, readingDate, previousReading, currentReading, commonArea, status, remarks
- utility_bill: billNumber, utilityTypeId, meterReadingId, tenantId, propertyId, unitId, billDate, dueDate, billingPeriodStart, billingPeriodEnd, billingMethod, consumption, rate, fixedCharge, commonAreaAmount, taxAmount, paidAmount, status, remarks
- asset: assetCode, assetName, assetCategory, propertyId, buildingId, unitId, serialNumber, manufacturer, modelNumber, purchaseDate, purchaseCost, installationDate, conditionStatus, warrantyProvider, warrantyStartDate, warrantyEndDate, warrantyTerms, maintenanceFrequency, nextMaintenanceDate, status, remarks
- asset_maintenance_schedule: scheduleNumber, assetId, maintenanceType, frequency, plannedDate, assignedVendorId, estimatedCost, priority, status, remarks
- asset_service_history: serviceNumber, assetId, maintenanceScheduleId, serviceDate, serviceType, vendorId, technicianName, conditionBefore, conditionAfter, workPerformed, partsReplaced, serviceCost, nextServiceDate, status, remarks
- inspection: inspectionNumber, inspectionType, propertyId, unitId, leaseId, tenantId, scheduledDate, inspectionDate, inspectorName, overallCondition, damageStatus, estimatedRepairCost, checklist, damageNotes, tenantAcknowledgementStatus, tenantAcknowledgedBy, status, remarks
- purchase_request: requestNumber, propertyId, unitId, expenseType, description, estimatedAmount, status, approvalStatus
- purchase_order: purchaseOrderNumber, purchaseRequestId, vendorId, propertyId, unitId, orderDate, expectedDeliveryDate, totalAmount, status, approvalStatus, remarks
- purchase_invoice: invoiceNumber, purchaseOrderId, vendorId, propertyId, unitId, invoiceDate, dueDate, invoiceAmount, paidAmount, paymentStatus, approvalStatus, status, remarks
- expense: expenseNumber, vendorInvoiceId, vendorId, propertyId, unitId, expenseDate, expenseType, amount, description, approvalStatus, paymentStatus, status
- vendor: vendorCode, vendorName, contactPerson, phone, email, address, serviceCategory, taxNumber, bankDetails, contractStatus, insuranceDetails, rating, vendorStatus, assignmentStage
- owner: ownerCode, ownerName, phone, email, address, taxDetails, bankAccountDetails, propertyIds, ownershipPercentage, payoutFrequency, statementPreference, ownerStatus, statementStage
- document: documentNumber, documentTitle, documentType, fileName, contentType, fileSize, dataUrl, propertyId, unitId, tenantId, leaseId, vendorId, invoiceId, expiryDate, previousDocumentId, status, accessLevel, remarks
- notification: recipientUserId, recipientName, recipientEmail, recipientPhone, notificationType, title, message, entityType, entityId, priority, channels
- approval_config: transactionType, levelNo, approverRoleId, minAmount, maxAmount, active
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
        function_tool(
            "list_records",
            "List existing records for any supported module so you can resolve IDs before creating linked data.",
            schema(
                {
                    "entityType": {
                        "type": "string",
                        "enum": sorted(LIST_ENDPOINTS.keys()),
                    },
                },
                ["entityType"],
            ),
        ),
        function_tool(
            "create_record",
            f"Create a record in any supported module. {CREATE_ENTITY_HELP}",
            schema(
                {
                    "entityType": {
                        "type": "string",
                        "enum": sorted(CREATE_ENDPOINTS.keys()),
                    },
                    "payload": {
                        "type": "object",
                        "description": "JSON request body using the same field names as the application API.",
                    },
                },
                ["entityType", "payload"],
            ),
        ),
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
                    "totalFloors": {"type": ["integer", "null"]},
                    "totalUnits": {"type": ["integer", "null"]},
                    "propertyManagerUserId": {"type": ["integer", "null"]},
                    "amenitiesSummary": {"type": ["string", "null"]},
                    "status": {"type": "string"},
                },
                ["propertyCode", "propertyName", "propertyType", "ownershipType", "status"],
            ),
        ),
        function_tool(
            "create_unit",
            "Create a new unit under a property.",
            schema(
                {
                    "propertyId": {"type": "integer"},
                    "buildingId": {"type": "integer"},
                    "floorId": {"type": "integer"},
                    "unitCode": {"type": "string"},
                    "unitNumber": {"type": "string"},
                    "unitType": {"type": "string"},
                    "areaValue": {"type": ["number", "null"]},
                    "areaUnit": {"type": "string"},
                    "baseRent": {"type": ["number", "null"]},
                    "securityDepositAmount": {"type": ["number", "null"]},
                    "unitStatus": {"type": "string"},
                    "availabilityDate": {"type": ["string", "null"]},
                },
                ["propertyId", "buildingId", "floorId", "unitCode", "unitNumber", "unitType", "areaUnit", "unitStatus"],
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
    if tool_name == "create_record":
        entity_type = arguments.get("entityType", "record")
        payload = arguments.get("payload") or {}
        if isinstance(result, list):
            return f"Created {len(result)} {entity_type.replace('_', ' ')} records"
        result_payload = result if isinstance(result, dict) else {}
        reference = (
            result_payload.get("code")
            or result_payload.get("companyCode")
            or result_payload.get("branchCode")
            or result_payload.get("propertyCode")
            or result_payload.get("buildingCode")
            or result_payload.get("floorCode")
            or result_payload.get("unitCode")
            or result_payload.get("tenantCode")
            or result_payload.get("leaseNumber")
            or result_payload.get("invoiceNumber")
            or result_payload.get("receiptNumber")
            or result_payload.get("requestNumber")
            or result_payload.get("workOrderNumber")
            or result_payload.get("scheduleNumber")
            or result_payload.get("typeCode")
            or result_payload.get("billNumber")
            or result_payload.get("assetCode")
            or result_payload.get("serviceNumber")
            or result_payload.get("inspectionNumber")
            or result_payload.get("purchaseOrderNumber")
            or result_payload.get("expenseNumber")
            or result_payload.get("vendorCode")
            or result_payload.get("ownerCode")
            or result_payload.get("documentNumber")
            or payload.get("companyCode")
            or payload.get("propertyCode")
            or payload.get("unitCode")
            or payload.get("leaseNumber")
            or payload.get("invoiceNumber")
            or payload.get("requestNumber")
            or result_payload.get("id")
            or "-"
        )
        return f"Created {entity_type.replace('_', ' ')} {reference}"
    if tool_name == "list_records":
        entity_type = arguments.get("entityType", "records")
        if isinstance(result, list):
            return f"Returned {len(result)} {entity_type.replace('_', ' ')} records"
        return f"Returned {entity_type.replace('_', ' ')} records"
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
        if tool_name == "list_records":
            entity_type = arguments.get("entityType")
            path = LIST_ENDPOINTS.get(entity_type)
            if path is None:
                raise HTTPException(status_code=400, detail=f"Unsupported list entity type: {entity_type}")
            result = backend_request("GET", path, authorization)
        elif tool_name == "create_record":
            entity_type = arguments.get("entityType")
            path = CREATE_ENDPOINTS.get(entity_type)
            if path is None:
                raise HTTPException(status_code=400, detail=f"Unsupported create entity type: {entity_type}")
            payload = arguments.get("payload")
            if not isinstance(payload, dict):
                raise HTTPException(status_code=400, detail="create_record payload must be an object")
            result = backend_request("POST", path, authorization, payload)
        elif tool_name == "list_roles":
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


def agent_provider_failure_message(detail: Any) -> str:
    text = str(detail or "").strip()
    if "Insufficient credits" in text or "code': 402" in text or '"code":402' in text:
        return (
            "The chatbot provider rejected the request because the configured OpenRouter account has insufficient credits. "
            "Add credits in OpenRouter or configure a different OPENROUTER_API_KEY/OPENROUTER_MODEL, then try again."
        )
    if "OPENROUTER_API_KEY is not configured" in text:
        return "The chatbot provider is not configured. Set OPENROUTER_API_KEY for the agent service, then restart the application."
    if text:
        return f"The chatbot provider could not complete the request: {text}"
    return "The chatbot provider could not complete the request. Check the agent service configuration and try again."


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
    try:
        response = await openrouter_completion(messages)
    except HTTPException as exc:
        return AgentChatResponse(message=agent_provider_failure_message(exc.detail), model=openrouter_model(), actions=actions)

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

        try:
            response = await openrouter_completion(messages)
        except HTTPException as exc:
            return AgentChatResponse(message=agent_provider_failure_message(exc.detail), model=openrouter_model(), actions=actions)

    raise HTTPException(status_code=502, detail="Chatbot agent reached the maximum tool-call loop without producing a final response")
