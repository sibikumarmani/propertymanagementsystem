INSERT IGNORE INTO companies (
    company_name, company_code, email, phone, address, city, state, country, postal_code,
    gst_number, tax_number, is_default, status
) VALUES (
    'Demo Property Management LLC', 'DEMO', 'admin@demo-pms.local', '+91-90000-10000',
    'Level 8, Demo Business Park, MG Road', 'Bengaluru', 'Karnataka', 'India', '560001',
    '29ABCDE1234F1Z5', 'PANDEMO1234', FALSE, 'ACTIVE'
);

SET @company_id := (SELECT id FROM companies WHERE company_code = 'DEMO');
SET @admin_role_id := (SELECT id FROM roles WHERE role_name = 'ADMIN');
SET @manager_role_id := (SELECT id FROM roles WHERE role_name = 'PROPERTY_MANAGER');
SET @finance_role_id := (SELECT id FROM roles WHERE role_name = 'FINANCE_USER');
SET @tenant_role_id := (SELECT id FROM roles WHERE role_name = 'TENANT');
SET @owner_role_id := (SELECT id FROM roles WHERE role_name = 'OWNER');

INSERT IGNORE INTO users (user_code, email, phone, password_hash, status, full_name, email_verified) VALUES
('DEMO-ADMIN', 'admin@demo-pms.local', '+91-90000-10001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', 'Aarav Demo Admin', TRUE),
('DEMO-MANAGER', 'manager@demo-pms.local', '+91-90000-10002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', 'Meera Property Manager', TRUE),
('DEMO-FINANCE', 'finance@demo-pms.local', '+91-90000-10003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', 'Rohan Finance User', TRUE),
('DEMO-TENANT', 'tenant@demo-pms.local', '+91-90000-10004', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', 'Priya Tenant', TRUE),
('DEMO-OWNER', 'owner@demo-pms.local', '+91-90000-10005', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', 'Vikram Owner', TRUE);

SET @admin_user_id := (SELECT id FROM users WHERE user_code = 'DEMO-ADMIN');
SET @manager_user_id := (SELECT id FROM users WHERE user_code = 'DEMO-MANAGER');
SET @finance_user_id := (SELECT id FROM users WHERE user_code = 'DEMO-FINANCE');
SET @tenant_user_id := (SELECT id FROM users WHERE user_code = 'DEMO-TENANT');
SET @owner_user_id := (SELECT id FROM users WHERE user_code = 'DEMO-OWNER');

INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
(@admin_user_id, @admin_role_id),
(@manager_user_id, @manager_role_id),
(@finance_user_id, @finance_role_id),
(@tenant_user_id, @tenant_role_id),
(@owner_user_id, @owner_role_id);

INSERT IGNORE INTO user_companies (user_id, company_id, is_default, status) VALUES
(@admin_user_id, @company_id, TRUE, 'ACTIVE'),
(@manager_user_id, @company_id, TRUE, 'ACTIVE'),
(@finance_user_id, @company_id, TRUE, 'ACTIVE'),
(@tenant_user_id, @company_id, TRUE, 'ACTIVE'),
(@owner_user_id, @company_id, TRUE, 'ACTIVE');

INSERT IGNORE INTO company_branches (
    company_id, branch_name, branch_code, address, city, state, country, postal_code, status
) VALUES (
    @company_id, 'Bengaluru Central Branch', 'BLR-CENTRAL', 'MG Road Operations Office',
    'Bengaluru', 'Karnataka', 'India', '560001', 'ACTIVE'
);

SET @branch_id := (SELECT id FROM company_branches WHERE company_id = @company_id AND branch_code = 'BLR-CENTRAL');

INSERT IGNORE INTO properties (
    company_id, branch_id, property_code, property_name, property_type, ownership_type,
    owner_reference, ownership_details, address, city, state, country, pincode, total_floors,
    total_units, property_manager_user_id, property_manager_name, amenities_summary,
    document_summary, status
) VALUES
(@company_id, @branch_id, 'SKY-TOWER', 'Skyline Residency Tower A', 'RESIDENTIAL', 'OWNER_MANAGED',
 'OWN-DEMO-001', 'Single-owner residential tower used for demo occupancy and billing flows.',
 '12 Residency Main Road', 'Bengaluru', 'Karnataka', 'India', '560038', 12, 4,
 @manager_user_id, 'Meera Property Manager', 'Clubhouse, lift, generator backup, covered parking',
 'Insurance, tax receipt, fire safety certificate', 'ACTIVE'),
(@company_id, @branch_id, 'MARKET-PLAZA', 'Market Plaza Commercial Block', 'COMMERCIAL', 'OWNER_MANAGED',
 'OWN-DEMO-002', 'Commercial property with vendor, utility, and expense demo records.',
 '45 Commerce Street', 'Bengaluru', 'Karnataka', 'India', '560025', 6, 2,
 @manager_user_id, 'Meera Property Manager', 'Security desk, service lift, common HVAC',
 'Vendor contracts and insurance policies on file', 'ACTIVE');

SET @property_res_id := (SELECT id FROM properties WHERE company_id = @company_id AND property_code = 'SKY-TOWER');
SET @property_com_id := (SELECT id FROM properties WHERE company_id = @company_id AND property_code = 'MARKET-PLAZA');

INSERT IGNORE INTO property_buildings (company_id, property_id, building_code, building_name, number_of_floors, amenities_summary, description, status) VALUES
(@company_id, @property_res_id, 'A', 'Tower A', 12, 'Two lifts, fire stairs, basement parking', 'Primary residential tower', 'ACTIVE'),
(@company_id, @property_com_id, 'C', 'Commercial Block C', 6, 'Service lift, loading bay', 'Commercial wing for office tenants', 'ACTIVE');

SET @building_res_id := (SELECT id FROM property_buildings WHERE property_id = @property_res_id AND building_code = 'A');
SET @building_com_id := (SELECT id FROM property_buildings WHERE property_id = @property_com_id AND building_code = 'C');

INSERT IGNORE INTO property_floors (company_id, property_id, building_id, floor_code, floor_name, floor_number, status) VALUES
(@company_id, @property_res_id, @building_res_id, 'F01', 'First Floor', 1, 'ACTIVE'),
(@company_id, @property_res_id, @building_res_id, 'F02', 'Second Floor', 2, 'ACTIVE'),
(@company_id, @property_com_id, @building_com_id, 'G00', 'Ground Floor', 0, 'ACTIVE');

SET @floor_res_1_id := (SELECT id FROM property_floors WHERE building_id = @building_res_id AND floor_code = 'F01');
SET @floor_res_2_id := (SELECT id FROM property_floors WHERE building_id = @building_res_id AND floor_code = 'F02');
SET @floor_com_g_id := (SELECT id FROM property_floors WHERE building_id = @building_com_id AND floor_code = 'G00');

INSERT IGNORE INTO property_units (
    company_id, property_id, building_id, floor_id, unit_code, unit_number, unit_type,
    area_value, area_unit, base_rent, security_deposit_amount, unit_status, availability_date,
    photo_summary, document_summary
) VALUES
(@company_id, @property_res_id, @building_res_id, @floor_res_1_id, 'A-101', '101', 'TWO_BHK',
 1250.00, 'SQ_FT', 45000.00, 135000.00, 'OCCUPIED', '2026-01-01', 'Living room and balcony photos', 'Handover checklist available'),
(@company_id, @property_res_id, @building_res_id, @floor_res_2_id, 'A-201', '201', 'THREE_BHK',
 1600.00, 'SQ_FT', 62000.00, 186000.00, 'AVAILABLE', '2026-05-15', 'Freshly painted unit photos', 'Ready for lease'),
(@company_id, @property_com_id, @building_com_id, @floor_com_g_id, 'C-G01', 'G01', 'RETAIL',
 900.00, 'SQ_FT', 85000.00, 255000.00, 'OCCUPIED', '2025-12-01', 'Storefront photos', 'Commercial fitout agreement'),
(@company_id, @property_com_id, @building_com_id, @floor_com_g_id, 'C-G02', 'G02', 'OFFICE',
 1100.00, 'SQ_FT', 95000.00, 285000.00, 'AVAILABLE', '2026-06-01', 'Office shell photos', 'Pending fitout inspection');

SET @unit_a101_id := (SELECT id FROM property_units WHERE property_id = @property_res_id AND unit_code = 'A-101');
SET @unit_a201_id := (SELECT id FROM property_units WHERE property_id = @property_res_id AND unit_code = 'A-201');
SET @unit_cg01_id := (SELECT id FROM property_units WHERE property_id = @property_com_id AND unit_code = 'C-G01');

INSERT IGNORE INTO leasing_leads (
    company_id, lead_code, lead_source, lead_status, prospect_name, phone_number, email,
    assigned_leasing_agent_user_id, assigned_leasing_agent_name, requirement_summary,
    property_id, unit_id, site_visit_at, visit_feedback, quotation_rent, quotation_deposit,
    quotation_maintenance_charges, quotation_other_charges, quotation_discount, quotation_notes,
    quotation_sent_at, application_received_at, screening_notes
) VALUES (
    @company_id, 'LEAD-DEMO-001', 'WEBSITE', 'APPLICATION_RECEIVED', 'Neha Sharma',
    '+91-90000-20001', 'neha.prospect@example.com', @manager_user_id, 'Meera Property Manager',
    'Looking for a 3BHK apartment with parking and immediate move-in.',
    @property_res_id, @unit_a201_id, '2026-05-03 11:00:00', 'Liked the unit and requested final quote.',
    62000.00, 186000.00, 6000.00, 2500.00, 2000.00, 'Introductory discount offered for first month.',
    '2026-05-03 16:00:00', '2026-05-04 10:30:00', 'Employment and ID documents requested.'
);

INSERT IGNORE INTO tenants (
    company_id, tenant_code, tenant_type, first_name, last_name, company_name, phone_number,
    email, alternate_phone, date_of_birth_or_registration, id_proof_type, id_proof_number,
    tax_number, gst_number, emergency_contact, employer_details, current_address,
    permanent_address, kyc_status, blacklist_status, tenant_status, kyc_stage,
    id_proof_document_note, address_proof_document_note, financial_document_note
) VALUES
(@company_id, 'TEN-DEMO-001', 'INDIVIDUAL', 'Priya', 'Nair', NULL, '+91-90000-10004',
 'tenant@demo-pms.local', '+91-90000-10014', '1991-08-12', 'AADHAAR', 'XXXX-XXXX-1234',
 'ABCDE1234F', NULL, 'Arjun Nair +91-90000-10024', 'Senior Product Manager at DemoTech',
 'A-101, Skyline Residency Tower A', 'Kochi, Kerala', 'VERIFIED', 'CLEAR', 'ACTIVE',
 'APPROVED', 'Aadhaar verified', 'Utility bill verified', 'Salary slips reviewed'),
(@company_id, 'TEN-DEMO-002', 'COMPANY', NULL, NULL, 'Urban Bean Cafe Pvt Ltd', '+91-90000-20002',
 'accounts@urbanbean.example.com', NULL, '2018-03-22', 'CIN', 'U55101KA2018PTC000001',
 'ABCDE5678G', '29ABCDE5678G1Z5', 'Operations Desk +91-90000-20012', 'Retail cafe operator',
 'C-G01, Market Plaza Commercial Block', 'Indiranagar, Bengaluru', 'VERIFIED', 'CLEAR',
 'ACTIVE', 'APPROVED', 'CIN copy verified', 'Registered office proof verified', 'Bank statement reviewed');

SET @tenant_priya_id := (SELECT id FROM tenants WHERE company_id = @company_id AND tenant_code = 'TEN-DEMO-001');
SET @tenant_cafe_id := (SELECT id FROM tenants WHERE company_id = @company_id AND tenant_code = 'TEN-DEMO-002');
SET @lead_id := (SELECT id FROM leasing_leads WHERE company_id = @company_id AND lead_code = 'LEAD-DEMO-001');

INSERT IGNORE INTO rental_applications (
    company_id, application_code, tenant_id, lead_id, unit_id, property_id, occupancy_type,
    proposed_move_in_date, lease_term_months, adult_occupants_count, child_occupants_count,
    pet_details, occupancy_notes, document_summary, kyc_verified, employment_verified,
    income_verified, reference_checked, previous_landlord_checked, company_approval_verified,
    document_completeness_checked, internal_blacklist_checked, verification_notes,
    application_status, approved_at, lease_draft_reference, lease_draft_generated_at
) VALUES (
    @company_id, 'APP-DEMO-001', @tenant_priya_id, @lead_id, @unit_a101_id, @property_res_id,
    'RESIDENTIAL', '2026-01-01', 12, 2, 0, 'No pets', 'Primary residence',
    'KYC, address proof, and income documents completed.', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
    TRUE, TRUE, 'Approved after standard checks.', 'APPROVED', '2025-12-20 15:00:00',
    'LEASE-DEMO-001', '2025-12-21 10:00:00'
);

INSERT IGNORE INTO vendors (
    company_id, vendor_code, vendor_name, contact_person, phone, email, address, service_category,
    tax_number, bank_details, contract_status, insurance_details, rating, vendor_status, assignment_stage
) VALUES
(@company_id, 'VEN-DEMO-001', 'RapidFix Maintenance Services', 'Suresh Kumar', '+91-90000-30001',
 'service@rapidfix.example.com', 'Peenya Industrial Area, Bengaluru', 'Plumbing and Electrical',
 'GST-RAPIDFIX-001', 'HDFC Bank A/C ending 7744', 'ACTIVE', 'Public liability policy valid until 2026-12-31',
 4.6, 'ACTIVE', 'VENDOR_ASSIGNED'),
(@company_id, 'VEN-DEMO-002', 'SecureLift Elevator Co', 'Anita Rao', '+91-90000-30002',
 'support@securelift.example.com', 'Electronic City, Bengaluru', 'Elevator AMC',
 'GST-LIFT-002', 'ICICI Bank A/C ending 5531', 'ACTIVE', 'AMC insurance valid until 2027-03-31',
 4.8, 'ACTIVE', 'VENDOR_ASSIGNED');

SET @vendor_rapidfix_id := (SELECT id FROM vendors WHERE company_id = @company_id AND vendor_code = 'VEN-DEMO-001');
SET @vendor_lift_id := (SELECT id FROM vendors WHERE company_id = @company_id AND vendor_code = 'VEN-DEMO-002');

INSERT IGNORE INTO owners (
    company_id, owner_code, owner_name, phone, email, address, tax_details, bank_account_details,
    ownership_percentage, payout_frequency, statement_preference, owner_status, statement_stage
) VALUES
(@company_id, 'OWN-DEMO-001', 'Vikram Owner', '+91-90000-10005', 'owner@demo-pms.local',
 'Indiranagar, Bengaluru', 'PAN: AABPV1234F', 'HDFC Bank A/C ending 9988', 100.00,
 'MONTHLY', 'EMAIL_AND_PORTAL', 'ACTIVE', 'OWNER_STATEMENT_GENERATED'),
(@company_id, 'OWN-DEMO-002', 'Ananya Holdings LLP', '+91-90000-40001', 'owners@ananyaholdings.example.com',
 'Koramangala, Bengaluru', 'GST: 29ANANYA001Z5', 'Axis Bank A/C ending 2233', 100.00,
 'MONTHLY', 'EMAIL', 'ACTIVE', 'MANAGEMENT_FEE_DEDUCTED');

SET @owner_vikram_id := (SELECT id FROM owners WHERE company_id = @company_id AND owner_code = 'OWN-DEMO-001');
SET @owner_ananya_id := (SELECT id FROM owners WHERE company_id = @company_id AND owner_code = 'OWN-DEMO-002');

INSERT IGNORE INTO owner_properties (owner_id, property_id) VALUES
(@owner_vikram_id, @property_res_id),
(@owner_ananya_id, @property_com_id);

INSERT IGNORE INTO leases (
    company_id, lease_number, tenant_id, property_id, unit_id, lease_start_date, lease_end_date,
    rent_amount, security_deposit_amount, billing_cycle, due_day, grace_period_days,
    late_fee_rule, agreement_document, status, activation_date
) VALUES
(@company_id, 'LEASE-DEMO-001', @tenant_priya_id, @property_res_id, @unit_a101_id,
 '2026-01-01', '2026-12-31', 45000.00, 135000.00, 'MONTHLY', 5, 3,
 '2 percent late fee after grace period', 'Demo lease agreement stored as document record.', 'ACTIVE', '2026-01-01'),
(@company_id, 'LEASE-DEMO-002', @tenant_cafe_id, @property_com_id, @unit_cg01_id,
 '2025-12-01', '2026-11-30', 85000.00, 255000.00, 'MONTHLY', 7, 5,
 'Fixed late fee of INR 2500 after grace period', 'Commercial lease agreement stored as document record.', 'ACTIVE', '2025-12-01');

SET @lease_priya_id := (SELECT id FROM leases WHERE company_id = @company_id AND lease_number = 'LEASE-DEMO-001');
SET @lease_cafe_id := (SELECT id FROM leases WHERE company_id = @company_id AND lease_number = 'LEASE-DEMO-002');

INSERT IGNORE INTO lease_renewals (
    company_id, lease_id, renewal_number, previous_start_date, previous_end_date,
    new_start_date, new_end_date, previous_rent_amount, new_rent_amount,
    security_deposit_amount, agreement_document, approval_status, renewal_notes
) VALUES (
    @company_id, @lease_priya_id, 'REN-DEMO-001', '2026-01-01', '2026-12-31',
    '2027-01-01', '2027-12-31', 45000.00, 48000.00, 144000.00,
    'Draft renewal document pending signature.', 'PENDING_APPROVAL', 'Demo upcoming renewal for lease expiry alerts.'
);

INSERT IGNORE INTO rent_schedules (
    company_id, lease_id, tenant_id, property_id, unit_id, schedule_number,
    billing_period_start, billing_period_end, due_date, rent_amount, late_fee_amount,
    paid_amount, due_amount, invoice_id, status
) VALUES
(@company_id, @lease_priya_id, @tenant_priya_id, @property_res_id, @unit_a101_id,
 'RS-DEMO-2026-05-001', '2026-05-01', '2026-05-31', '2026-05-05',
 45000.00, 0.00, 30000.00, 15000.00, NULL, 'PARTIALLY_PAID'),
(@company_id, @lease_cafe_id, @tenant_cafe_id, @property_com_id, @unit_cg01_id,
 'RS-DEMO-2026-05-002', '2026-05-01', '2026-05-31', '2026-05-07',
 85000.00, 0.00, 85000.00, 0.00, NULL, 'PAID');

SET @schedule_priya_id := (SELECT id FROM rent_schedules WHERE company_id = @company_id AND schedule_number = 'RS-DEMO-2026-05-001');
SET @schedule_cafe_id := (SELECT id FROM rent_schedules WHERE company_id = @company_id AND schedule_number = 'RS-DEMO-2026-05-002');

INSERT IGNORE INTO invoices (
    company_id, invoice_number, invoice_type, lease_id, rent_schedule_id, tenant_id,
    property_id, unit_id, invoice_date, due_date, subtotal_amount, tax_amount,
    discount_amount, late_fee_amount, total_amount, paid_amount, due_amount, status,
    description, pdf_document
) VALUES
(@company_id, 'INV-DEMO-2026-05-001', 'RENT', @lease_priya_id, @schedule_priya_id,
 @tenant_priya_id, @property_res_id, @unit_a101_id, '2026-05-01', '2026-05-05',
 45000.00, 0.00, 0.00, 0.00, 45000.00, 30000.00, 15000.00, 'PARTIALLY_PAID',
 'May 2026 rent invoice for A-101.', 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K'),
(@company_id, 'INV-DEMO-2026-05-002', 'RENT', @lease_cafe_id, @schedule_cafe_id,
 @tenant_cafe_id, @property_com_id, @unit_cg01_id, '2026-05-01', '2026-05-07',
 85000.00, 15300.00, 0.00, 0.00, 100300.00, 100300.00, 0.00, 'PAID',
 'May 2026 rent invoice for C-G01.', 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K');

SET @invoice_priya_id := (SELECT id FROM invoices WHERE company_id = @company_id AND invoice_number = 'INV-DEMO-2026-05-001');
SET @invoice_cafe_id := (SELECT id FROM invoices WHERE company_id = @company_id AND invoice_number = 'INV-DEMO-2026-05-002');

UPDATE rent_schedules SET invoice_id = @invoice_priya_id WHERE id = @schedule_priya_id AND invoice_id IS NULL;
UPDATE rent_schedules SET invoice_id = @invoice_cafe_id WHERE id = @schedule_cafe_id AND invoice_id IS NULL;

INSERT IGNORE INTO receipts (
    company_id, receipt_number, invoice_id, tenant_id, receipt_date, payment_mode,
    amount, advance_amount, reference_number, remarks, pdf_document, status
) VALUES
(@company_id, 'REC-DEMO-2026-05-001', @invoice_priya_id, @tenant_priya_id,
 '2026-05-04', 'UPI', 30000.00, 0.00, 'UPI-DEMO-30000', 'Partial rent payment received.',
 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K', 'POSTED'),
(@company_id, 'REC-DEMO-2026-05-002', @invoice_cafe_id, @tenant_cafe_id,
 '2026-05-05', 'BANK_TRANSFER', 100300.00, 0.00, 'NEFT-DEMO-100300', 'Full commercial rent collected.',
 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K', 'POSTED');

SET @receipt_priya_id := (SELECT id FROM receipts WHERE company_id = @company_id AND receipt_number = 'REC-DEMO-2026-05-001');
SET @receipt_cafe_id := (SELECT id FROM receipts WHERE company_id = @company_id AND receipt_number = 'REC-DEMO-2026-05-002');

INSERT IGNORE INTO security_deposits (
    company_id, lease_id, tenant_id, property_id, unit_id, deposit_number, deposit_amount,
    collected_amount, adjusted_amount, refunded_amount, refundable_amount,
    deposit_invoice_id, deposit_receipt_id, status, remarks
) VALUES (
    @company_id, @lease_priya_id, @tenant_priya_id, @property_res_id, @unit_a101_id,
    'SD-DEMO-001', 135000.00, 135000.00, 0.00, 0.00, 135000.00,
    NULL, @receipt_priya_id, 'COLLECTED', 'Security deposit collected before move-in.'
);

SET @deposit_priya_id := (SELECT id FROM security_deposits WHERE company_id = @company_id AND deposit_number = 'SD-DEMO-001');

INSERT INTO security_deposit_transactions (
    company_id, security_deposit_id, transaction_type, transaction_date, amount,
    invoice_id, receipt_id, reference_number, remarks
)
SELECT @company_id, @deposit_priya_id, 'COLLECTION', '2025-12-28', 135000.00,
       NULL, @receipt_priya_id, 'SD-COLLECT-DEMO-001', 'Opening deposit collection.'
WHERE NOT EXISTS (
    SELECT 1 FROM security_deposit_transactions
    WHERE company_id = @company_id AND reference_number = 'SD-COLLECT-DEMO-001'
);

INSERT IGNORE INTO maintenance_requests (
    company_id, request_number, tenant_id, property_id, unit_id, category, priority,
    description, assigned_vendor_id, assigned_user_id, estimated_cost, actual_cost,
    status, approval_status, attachments_json, completion_remarks
) VALUES (
    @company_id, 'MR-DEMO-001', @tenant_priya_id, @property_res_id, @unit_a101_id,
    'Plumbing', 'HIGH', 'Kitchen sink leakage reported by tenant.',
    @vendor_rapidfix_id, @manager_user_id, 4500.00, 4200.00, 'IN_PROGRESS',
    'APPROVED', '[{"fileName":"sink-leak.jpg"}]', 'Vendor scheduled for final inspection.'
);

SET @maintenance_request_id := (SELECT id FROM maintenance_requests WHERE company_id = @company_id AND request_number = 'MR-DEMO-001');

INSERT IGNORE INTO maintenance_work_orders (
    company_id, work_order_number, maintenance_request_id, vendor_id, technician_user_id,
    materials_used, labor_charges, vendor_invoice_document, completion_remarks,
    approval_status, status
) VALUES (
    @company_id, 'WO-DEMO-001', @maintenance_request_id, @vendor_rapidfix_id, @manager_user_id,
    'Flexible pipe, sealant, drain coupling', 1800.00, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
    'Leak fixed; monitoring for 24 hours.', 'APPROVED', 'IN_PROGRESS'
);

INSERT IGNORE INTO preventive_maintenance_schedules (
    company_id, schedule_number, property_id, unit_id, asset_name, maintenance_type,
    recurrence_frequency, next_due_date, responsible_user_id, vendor_id, notify_before_days,
    completion_status, last_completed_date, completion_remarks, status
) VALUES (
    @company_id, 'PM-DEMO-001', @property_res_id, NULL, 'Tower A Elevator 1',
    'Elevator AMC', 'MONTHLY', '2026-05-20', @manager_user_id, @vendor_lift_id,
    5, 'SCHEDULED', '2026-04-20', 'April AMC completed with no major findings.', 'ACTIVE'
);

INSERT IGNORE INTO purchase_requests (
    company_id, request_number, property_id, unit_id, expense_type, description,
    estimated_amount, status, approval_status
) VALUES (
    @company_id, 'PR-DEMO-001', @property_res_id, @unit_a101_id, 'REPAIR_MATERIAL',
    'Replacement plumbing material for kitchen sink repair.', 3500.00, 'SUBMITTED', 'APPROVED'
);

SET @purchase_request_id := (SELECT id FROM purchase_requests WHERE company_id = @company_id AND request_number = 'PR-DEMO-001');

INSERT IGNORE INTO purchase_orders (
    company_id, purchase_order_number, purchase_request_id, vendor_id, property_id,
    unit_id, order_date, expected_delivery_date, total_amount, status, approval_status, remarks
) VALUES (
    @company_id, 'PO-DEMO-001', @purchase_request_id, @vendor_rapidfix_id, @property_res_id,
    @unit_a101_id, '2026-05-04', '2026-05-06', 4200.00, 'ISSUED', 'APPROVED',
    'Issued for urgent plumbing repair.'
);

SET @purchase_order_id := (SELECT id FROM purchase_orders WHERE company_id = @company_id AND purchase_order_number = 'PO-DEMO-001');

INSERT IGNORE INTO vendor_invoices (
    company_id, invoice_number, purchase_order_id, vendor_id, property_id, unit_id,
    invoice_date, due_date, invoice_amount, paid_amount, payment_status,
    approval_status, status, remarks
) VALUES (
    @company_id, 'VINV-DEMO-001', @purchase_order_id, @vendor_rapidfix_id, @property_res_id,
    @unit_a101_id, '2026-05-06', '2026-05-21', 4200.00, 0.00, 'UNPAID',
    'APPROVED', 'POSTED', 'Vendor invoice for sink repair.'
);

SET @vendor_invoice_id := (SELECT id FROM vendor_invoices WHERE company_id = @company_id AND invoice_number = 'VINV-DEMO-001');

INSERT IGNORE INTO property_expenses (
    company_id, expense_number, vendor_invoice_id, vendor_id, property_id, unit_id,
    expense_date, expense_type, amount, description, approval_status, payment_status, status
) VALUES (
    @company_id, 'EXP-DEMO-001', @vendor_invoice_id, @vendor_rapidfix_id, @property_res_id,
    @unit_a101_id, '2026-05-06', 'MAINTENANCE', 4200.00,
    'Kitchen sink repair expense booked to property.', 'APPROVED', 'UNPAID', 'RECORDED'
);

INSERT IGNORE INTO utility_types (
    company_id, type_code, type_name, category, billing_method, unit_of_measure,
    default_rate, fixed_charge, common_area, status, description
) VALUES
(@company_id, 'ELEC-DEMO', 'Electricity', 'ELECTRICITY', 'METERED', 'KWH', 8.5000, 150.00, FALSE, 'ACTIVE', 'Unit-level electricity billing'),
(@company_id, 'WATER-DEMO', 'Water', 'WATER', 'FIXED', 'KL', 0.0000, 750.00, TRUE, 'ACTIVE', 'Common water charge allocation');

SET @utility_elec_id := (SELECT id FROM utility_types WHERE company_id = @company_id AND type_code = 'ELEC-DEMO');

INSERT IGNORE INTO meter_readings (
    company_id, reading_number, utility_type_id, property_id, unit_id, tenant_id,
    meter_number, reading_date, previous_reading, current_reading, consumption,
    common_area, status, remarks
) VALUES (
    @company_id, 'MRD-DEMO-001', @utility_elec_id, @property_res_id, @unit_a101_id,
    @tenant_priya_id, 'MTR-A101-001', '2026-05-01', 1250.0000, 1455.0000,
    205.0000, FALSE, 'RECORDED', 'May opening reading for A-101.'
);

SET @meter_reading_id := (SELECT id FROM meter_readings WHERE company_id = @company_id AND reading_number = 'MRD-DEMO-001');

INSERT IGNORE INTO utility_bills (
    company_id, bill_number, utility_type_id, meter_reading_id, tenant_id, property_id,
    unit_id, bill_date, due_date, billing_period_start, billing_period_end, billing_method,
    consumption, rate, fixed_charge, usage_amount, common_area_amount, tax_amount,
    total_amount, paid_amount, due_amount, status, remarks
) VALUES (
    @company_id, 'UBILL-DEMO-001', @utility_elec_id, @meter_reading_id, @tenant_priya_id,
    @property_res_id, @unit_a101_id, '2026-05-02', '2026-05-12', '2026-04-01',
    '2026-04-30', 'METERED', 205.0000, 8.5000, 150.00, 1742.50,
    0.00, 313.65, 2206.15, 0.00, 2206.15, 'ISSUED', 'Electricity bill for April consumption.'
);

INSERT IGNORE INTO property_assets (
    company_id, asset_code, asset_name, asset_category, property_id, building_id,
    unit_id, serial_number, manufacturer, model_number, purchase_date, purchase_cost,
    installation_date, condition_status, warranty_provider, warranty_start_date,
    warranty_end_date, warranty_terms, maintenance_frequency, next_maintenance_date,
    status, remarks
) VALUES (
    @company_id, 'AST-DEMO-001', 'Tower A Elevator 1', 'ELEVATOR', @property_res_id,
    @building_res_id, NULL, 'SL-ELV-2024-001', 'SecureLift', 'SLX-10',
    '2024-01-10', 1850000.00, '2024-02-01', 'GOOD', 'SecureLift Elevator Co',
    '2024-02-01', '2027-01-31', 'Standard manufacturer warranty and AMC coverage.',
    'MONTHLY', '2026-05-20', 'ACTIVE', 'Demo asset for preventive maintenance.'
);

SET @asset_elevator_id := (SELECT id FROM property_assets WHERE company_id = @company_id AND asset_code = 'AST-DEMO-001');

INSERT IGNORE INTO asset_maintenance_schedules (
    company_id, schedule_number, asset_id, maintenance_type, frequency, planned_date,
    assigned_vendor_id, estimated_cost, priority, status, remarks
) VALUES (
    @company_id, 'AMS-DEMO-001', @asset_elevator_id, 'AMC_SERVICE', 'MONTHLY',
    '2026-05-20', @vendor_lift_id, 15000.00, 'MEDIUM', 'SCHEDULED',
    'Monthly elevator inspection and lubrication.'
);

SET @asset_schedule_id := (SELECT id FROM asset_maintenance_schedules WHERE company_id = @company_id AND schedule_number = 'AMS-DEMO-001');

INSERT IGNORE INTO asset_service_history (
    company_id, service_number, asset_id, maintenance_schedule_id, service_date,
    service_type, vendor_id, technician_name, condition_before, condition_after,
    work_performed, parts_replaced, service_cost, next_service_date, status, remarks
) VALUES (
    @company_id, 'ASH-DEMO-001', @asset_elevator_id, @asset_schedule_id, '2026-04-20',
    'AMC_SERVICE', @vendor_lift_id, 'Mahesh B', 'GOOD', 'GOOD',
    'Routine inspection, lubrication, brake check, and controller diagnostics.',
    'None', 14500.00, '2026-05-20', 'COMPLETED', 'No defects found.'
);

INSERT IGNORE INTO property_inspections (
    company_id, inspection_number, inspection_type, property_id, unit_id, lease_id,
    tenant_id, scheduled_date, inspection_date, inspector_name, overall_condition,
    damage_status, estimated_repair_cost, checklist_json, photo_attachments_json,
    damage_notes, tenant_acknowledgement_status, tenant_acknowledged_by,
    tenant_acknowledged_at, status, remarks
) VALUES (
    @company_id, 'INSP-DEMO-001', 'MOVE_IN', @property_res_id, @unit_a101_id,
    @lease_priya_id, @tenant_priya_id, '2025-12-30', '2025-12-30',
    'Meera Property Manager', 'GOOD', 'MINOR', 2500.00,
    '{"walls":"good","flooring":"good","fixtures":"minor scratches"}',
    '[{"fileName":"move-in-a101-1.jpg"}]', 'Minor cabinet scratches noted before handover.',
    'ACKNOWLEDGED', 'Priya Nair', '2025-12-30 17:30:00', 'COMPLETED',
    'Move-in inspection completed.'
);

INSERT IGNORE INTO documents (
    company_id, document_number, document_title, document_type, file_name, content_type,
    file_size, data_url, property_id, unit_id, tenant_id, lease_id, vendor_id, invoice_id,
    expiry_date, version_number, previous_document_id, status, access_level, remarks
) VALUES
(@company_id, 'DOC-DEMO-LEASE-001', 'Lease Agreement A-101', 'LEASE_AGREEMENT',
 'lease-a101.pdf', 'application/pdf', 1024, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 @property_res_id, @unit_a101_id, @tenant_priya_id, @lease_priya_id, NULL, NULL,
 '2026-12-31', 1, NULL, 'ACTIVE', 'TENANT', 'Tenant-visible lease agreement.'),
(@company_id, 'DOC-DEMO-TENANT-ID-001', 'Priya Nair ID Proof', 'TENANT_ID_PROOF',
 'priya-id-proof.pdf', 'application/pdf', 1024, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 NULL, NULL, @tenant_priya_id, NULL, NULL, NULL,
 '2031-08-12', 1, NULL, 'ACTIVE', 'INTERNAL', 'Verified tenant KYC document.'),
(@company_id, 'DOC-DEMO-VENDOR-001', 'RapidFix Vendor Contract', 'VENDOR_CONTRACT',
 'rapidfix-contract.pdf', 'application/pdf', 1024, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 NULL, NULL, NULL, NULL, @vendor_rapidfix_id, NULL,
 '2026-12-31', 1, NULL, 'ACTIVE', 'INTERNAL', 'Vendor AMC and service contract.'),
(@company_id, 'DOC-DEMO-INVOICE-001', 'Invoice PDF May 2026', 'INVOICE_PDF',
 'invoice-may-2026-a101.pdf', 'application/pdf', 1024, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 @property_res_id, @unit_a101_id, @tenant_priya_id, @lease_priya_id, NULL, @invoice_priya_id,
 NULL, 1, NULL, 'ACTIVE', 'TENANT', 'Invoice PDF for tenant portal.');

INSERT INTO notifications (
    company_id, recipient_user_id, recipient_name, recipient_email, recipient_phone,
    notification_type, title, message, entity_type, entity_id, priority, read_at
)
SELECT @company_id, @tenant_user_id, 'Priya Nair', 'tenant@demo-pms.local', '+91-90000-10004',
       'RENT_DUE_REMINDER', 'Rent due reminder', 'Your May rent has an outstanding balance of INR 15,000.',
       'INVOICE', @invoice_priya_id, 'HIGH', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM notifications WHERE company_id = @company_id AND title = 'Rent due reminder' AND entity_id = @invoice_priya_id
);

SET @notification_rent_id := (
    SELECT id FROM notifications
    WHERE company_id = @company_id AND title = 'Rent due reminder' AND entity_id = @invoice_priya_id
    ORDER BY id LIMIT 1
);

INSERT INTO notification_deliveries (notification_id, channel, destination, status, provider_message, attempted_at)
SELECT @notification_rent_id, 'EMAIL', 'tenant@demo-pms.local', 'SENT', 'Demo email delivery recorded.', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM notification_deliveries WHERE notification_id = @notification_rent_id AND channel = 'EMAIL'
);

INSERT INTO notification_deliveries (notification_id, channel, destination, status, provider_message, attempted_at)
SELECT @notification_rent_id, 'SMS', '+91-90000-10004', 'PENDING_PROVIDER', 'SMS provider not configured in demo.', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM notification_deliveries WHERE notification_id = @notification_rent_id AND channel = 'SMS'
);

INSERT IGNORE INTO approval_workflow_configs (
    company_id, transaction_type, level_no, approver_role_id, min_amount, max_amount, active
) VALUES
(@company_id, 'LEASE_APPROVAL', 1, @manager_role_id, NULL, 100000.00, TRUE),
(@company_id, 'HIGH_VALUE_MAINTENANCE', 1, @manager_role_id, 5000.00, 50000.00, TRUE),
(@company_id, 'INVOICE_CANCELLATION', 1, @finance_role_id, NULL, NULL, TRUE);

INSERT IGNORE INTO approval_requests (
    company_id, transaction_type, entity_id, reference_number, amount, status,
    current_level, requested_by, submitted_at, completed_at, requester_remarks, final_remarks
) VALUES (
    @company_id, 'HIGH_VALUE_MAINTENANCE', @maintenance_request_id, 'MR-DEMO-001',
    4200.00, 'APPROVED', 1, @manager_user_id, '2026-05-04 09:00:00',
    '2026-05-04 10:15:00', 'Urgent plumbing repair approval requested.',
    'Approved for tenant-impacting leakage.'
);

SET @approval_request_id := (
    SELECT id FROM approval_requests
    WHERE company_id = @company_id AND transaction_type = 'HIGH_VALUE_MAINTENANCE' AND entity_id = @maintenance_request_id
);

INSERT INTO approval_actions (
    approval_request_id, level_no, action, approver_user_id, approver_role_id, remarks, action_at
)
SELECT @approval_request_id, 1, 'APPROVED', @manager_user_id, @manager_role_id,
       'Approved due to active leakage and tenant impact.', '2026-05-04 10:15:00'
WHERE NOT EXISTS (
    SELECT 1 FROM approval_actions
    WHERE approval_request_id = @approval_request_id AND level_no = 1 AND action = 'APPROVED'
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-01', 'RENT_RECEIVABLE', 'TENANT', @tenant_priya_id,
       @property_res_id, @unit_a101_id, 'INVOICE', @invoice_priya_id, 'INV-DEMO-2026-05-001',
       'Rent receivable posted for May 2026.', 45000.00, 0.00, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'INVOICE' AND source_reference = 'INV-DEMO-2026-05-001' AND account_type = 'RENT_RECEIVABLE'
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-04', 'CASH_BANK', 'TENANT', @tenant_priya_id,
       @property_res_id, @unit_a101_id, 'RECEIPT', @receipt_priya_id, 'REC-DEMO-2026-05-001',
       'Partial rent collection received.', 30000.00, 0.00, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'RECEIPT' AND source_reference = 'REC-DEMO-2026-05-001' AND account_type = 'CASH_BANK'
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-06', 'PROPERTY_EXPENSE', 'VENDOR', @vendor_rapidfix_id,
       @property_res_id, @unit_a101_id, 'VENDOR_INVOICE', @vendor_invoice_id, 'VINV-DEMO-001',
       'Maintenance expense payable to vendor.', 4200.00, 0.00, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'VENDOR_INVOICE' AND source_reference = 'VINV-DEMO-001' AND account_type = 'PROPERTY_EXPENSE'
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-07', 'OWNER_LEDGER', 'OWNER', @owner_vikram_id,
       @property_res_id, NULL, 'OWNER_STATEMENT', @owner_vikram_id, 'OWNER-STMT-DEMO-2026-05',
       'Owner payable after rent collection and expenses.', 0.00, 25800.00, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'OWNER_STATEMENT' AND source_reference = 'OWNER-STMT-DEMO-2026-05'
);

INSERT INTO audit_logs (
    company_id, user_id, user_name, action, screen, entity_type, entity_id,
    old_value, new_value, ip_address, action_at
)
SELECT @company_id, @manager_user_id, 'Meera Property Manager', 'Lease created',
       'Leases', 'LEASE', @lease_priya_id, NULL,
       '{"leaseNumber":"LEASE-DEMO-001","status":"ACTIVE"}', '127.0.0.1', '2026-01-01 09:00:00'
WHERE NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE company_id = @company_id AND action = 'Lease created' AND entity_id = @lease_priya_id
);

INSERT INTO audit_logs (
    company_id, user_id, user_name, action, screen, entity_type, entity_id,
    old_value, new_value, ip_address, action_at
)
SELECT @company_id, @finance_user_id, 'Rohan Finance User', 'Payment received',
       'Rent Billing', 'RECEIPT', @receipt_priya_id, NULL,
       '{"receiptNumber":"REC-DEMO-2026-05-001","amount":30000}', '127.0.0.1', '2026-05-04 12:00:00'
WHERE NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE company_id = @company_id AND action = 'Payment received' AND entity_id = @receipt_priya_id
);
