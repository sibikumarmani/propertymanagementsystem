INSERT IGNORE INTO companies (
    company_name, company_code, email, phone, address, city, state, country, postal_code,
    gst_number, tax_number, is_default, status
) VALUES (
    'Dubai Developments Company LLC', 'DUBAI-DEV', 'admin@dubaidevelopments.example.com', '+971-4-555-0100',
    'Level 31, Vision Tower, Business Bay', 'Dubai', 'Dubai', 'United Arab Emirates', '00000',
    'TRN100234567800003', 'TAX-DXB-DEV-001', FALSE, 'ACTIVE'
);

SET @company_id := (SELECT id FROM companies WHERE company_code = 'DUBAI-DEV');
SET @admin_role_id := (SELECT id FROM roles WHERE role_name = 'ADMIN');
SET @manager_role_id := (SELECT id FROM roles WHERE role_name = 'PROPERTY_MANAGER');
SET @finance_role_id := (SELECT id FROM roles WHERE role_name = 'FINANCE_USER');
SET @tenant_role_id := (SELECT id FROM roles WHERE role_name = 'TENANT');
SET @owner_role_id := (SELECT id FROM roles WHERE role_name = 'OWNER');

INSERT IGNORE INTO users (user_code, email, phone, password_hash, status, full_name, email_verified) VALUES
('DXB-ADMIN', 'admin@dubaidevelopments.example.com', '+971-50-100-0101', '$2a$10$Kwu8tGuJXAMAqNmh58V2.uoAubXM7ZUUsOZRa0nKgXb07XAX2yVm.', 'ACTIVE', 'Noura Al Mansoori', TRUE),
('DXB-PM', 'property.manager@dubaidevelopments.example.com', '+971-50-100-0102', '$2a$10$Kwu8tGuJXAMAqNmh58V2.uoAubXM7ZUUsOZRa0nKgXb07XAX2yVm.', 'ACTIVE', 'Omar Haddad', TRUE),
('DXB-FIN', 'finance@dubaidevelopments.example.com', '+971-50-100-0103', '$2a$10$Kwu8tGuJXAMAqNmh58V2.uoAubXM7ZUUsOZRa0nKgXb07XAX2yVm.', 'ACTIVE', 'Leila Farooq', TRUE),
('DXB-TENANT-RES', 'resident@dubaidevelopments.example.com', '+971-50-100-0104', '$2a$10$Kwu8tGuJXAMAqNmh58V2.uoAubXM7ZUUsOZRa0nKgXb07XAX2yVm.', 'ACTIVE', 'Aisha Rahman', TRUE),
('DXB-OWNER', 'owner@dubaidevelopments.example.com', '+971-50-100-0105', '$2a$10$Kwu8tGuJXAMAqNmh58V2.uoAubXM7ZUUsOZRa0nKgXb07XAX2yVm.', 'ACTIVE', 'Khalid Al Nuaimi', TRUE);

SET @admin_user_id := (SELECT id FROM users WHERE user_code = 'DXB-ADMIN');
SET @manager_user_id := (SELECT id FROM users WHERE user_code = 'DXB-PM');
SET @finance_user_id := (SELECT id FROM users WHERE user_code = 'DXB-FIN');
SET @tenant_user_id := (SELECT id FROM users WHERE user_code = 'DXB-TENANT-RES');
SET @owner_user_id := (SELECT id FROM users WHERE user_code = 'DXB-OWNER');

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
) VALUES
(@company_id, 'Business Bay Head Office', 'DXB-BB-HQ', 'Vision Tower, Business Bay', 'Dubai', 'Dubai', 'United Arab Emirates', '00000', 'ACTIVE'),
(@company_id, 'Dubai Marina Leasing Office', 'DXB-MARINA', 'Marina Plaza, Dubai Marina', 'Dubai', 'Dubai', 'United Arab Emirates', '00000', 'ACTIVE');

SET @branch_hq_id := (SELECT id FROM company_branches WHERE company_id = @company_id AND branch_code = 'DXB-BB-HQ');
SET @branch_marina_id := (SELECT id FROM company_branches WHERE company_id = @company_id AND branch_code = 'DXB-MARINA');

INSERT IGNORE INTO properties (
    company_id, branch_id, property_code, property_name, property_type, ownership_type,
    owner_reference, ownership_details, address, city, state, country, pincode, total_floors,
    total_units, property_manager_user_id, property_manager_name, amenities_summary,
    document_summary, status
) VALUES
(@company_id, @branch_marina_id, 'DXB-MARINA-RES', 'Marina Pearl Residences', 'RESIDENTIAL', 'OWNER_MANAGED',
 'OWN-DXB-001', 'Flagship residential tower developed and managed by Dubai Developments Company.',
 'Plot 392, Dubai Marina Waterfront', 'Dubai', 'Dubai', 'United Arab Emirates', '00000', 48, 240,
 @manager_user_id, 'Omar Haddad', 'Infinity pool, gym, concierge, basement parking, marina promenade access',
 'Title deed, handover certificates, Oqood registration, building insurance', 'ACTIVE'),
(@company_id, @branch_hq_id, 'DXB-BB-SQUARE', 'Business Bay Square Offices', 'COMMERCIAL', 'OWNER_MANAGED',
 'OWN-DXB-002', 'Commercial leasing asset with offices, retail podium, and managed common-area services.',
 'Al Abraj Street, Business Bay', 'Dubai', 'Dubai', 'United Arab Emirates', '00000', 28, 160,
 @manager_user_id, 'Omar Haddad', 'Reception, visitor parking, service lift, district cooling, retail podium',
 'Title deed, DCD certificate, elevator AMC, chiller maintenance contracts', 'ACTIVE'),
(@company_id, @branch_hq_id, 'DXB-JAFZA-LP', 'Jebel Ali Logistics Park', 'COMMERCIAL', 'COMPANY_OWNED',
 'DEV-DXB-003', 'Industrial and logistics development under asset management with warehouse leasing.',
 'JAFZA South, Jebel Ali', 'Dubai', 'Dubai', 'United Arab Emirates', '00000', 2, 36,
 @manager_user_id, 'Omar Haddad', 'Loading bays, yard access, 24/7 security, fire suppression, truck staging',
 'Development permits, DCD approval, warehouse lease templates', 'ACTIVE');

SET @property_res_id := (SELECT id FROM properties WHERE company_id = @company_id AND property_code = 'DXB-MARINA-RES');
SET @property_office_id := (SELECT id FROM properties WHERE company_id = @company_id AND property_code = 'DXB-BB-SQUARE');
SET @property_logistics_id := (SELECT id FROM properties WHERE company_id = @company_id AND property_code = 'DXB-JAFZA-LP');

INSERT IGNORE INTO property_buildings (company_id, property_id, building_code, building_name, number_of_floors, amenities_summary, description, status) VALUES
(@company_id, @property_res_id, 'TOWER-A', 'Marina Pearl Tower A', 48, 'Residential amenities deck, elevators, pool, gym', 'Premium residential development tower', 'ACTIVE'),
(@company_id, @property_office_id, 'OFFICE-A', 'Business Bay Square Tower', 28, 'Office lobby, visitor management, service lift', 'Commercial office and retail tower', 'ACTIVE'),
(@company_id, @property_logistics_id, 'WH-A', 'Warehouse Cluster A', 2, 'Dock levellers, fire systems, truck access', 'Asset-managed logistics warehouse cluster', 'ACTIVE');

SET @building_res_id := (SELECT id FROM property_buildings WHERE property_id = @property_res_id AND building_code = 'TOWER-A');
SET @building_office_id := (SELECT id FROM property_buildings WHERE property_id = @property_office_id AND building_code = 'OFFICE-A');
SET @building_logistics_id := (SELECT id FROM property_buildings WHERE property_id = @property_logistics_id AND building_code = 'WH-A');

INSERT IGNORE INTO property_floors (company_id, property_id, building_id, floor_code, floor_name, floor_number, status) VALUES
(@company_id, @property_res_id, @building_res_id, 'F18', 'Eighteenth Floor', 18, 'ACTIVE'),
(@company_id, @property_res_id, @building_res_id, 'F32', 'Thirty Second Floor', 32, 'ACTIVE'),
(@company_id, @property_office_id, @building_office_id, 'POD-G', 'Retail Podium Ground', 0, 'ACTIVE'),
(@company_id, @property_office_id, @building_office_id, 'F12', 'Office Floor 12', 12, 'ACTIVE'),
(@company_id, @property_logistics_id, @building_logistics_id, 'WH-G', 'Warehouse Ground', 0, 'ACTIVE');

SET @floor_res_18_id := (SELECT id FROM property_floors WHERE building_id = @building_res_id AND floor_code = 'F18');
SET @floor_res_32_id := (SELECT id FROM property_floors WHERE building_id = @building_res_id AND floor_code = 'F32');
SET @floor_retail_id := (SELECT id FROM property_floors WHERE building_id = @building_office_id AND floor_code = 'POD-G');
SET @floor_office_12_id := (SELECT id FROM property_floors WHERE building_id = @building_office_id AND floor_code = 'F12');
SET @floor_wh_id := (SELECT id FROM property_floors WHERE building_id = @building_logistics_id AND floor_code = 'WH-G');

INSERT IGNORE INTO property_units (
    company_id, property_id, building_id, floor_id, unit_code, unit_number, unit_type,
    area_value, area_unit, base_rent, security_deposit_amount, unit_status, availability_date,
    photo_summary, document_summary
) VALUES
(@company_id, @property_res_id, @building_res_id, @floor_res_18_id, 'MP-A-1804', '1804', 'TWO_BHK',
 1420.00, 'SQ_FT', 145000.00, 72500.00, 'OCCUPIED', '2026-01-01', 'Marina view living room and balcony photos', 'Ejari-ready apartment file'),
(@company_id, @property_res_id, @building_res_id, @floor_res_32_id, 'MP-A-3201', '3201', 'THREE_BHK',
 2150.00, 'SQ_FT', 235000.00, 117500.00, 'AVAILABLE', '2026-06-01', 'High-floor premium apartment photos', 'Ready for residential leasing'),
(@company_id, @property_office_id, @building_office_id, @floor_retail_id, 'BBS-G-03', 'G03', 'RETAIL',
 1280.00, 'SQ_FT', 310000.00, 155000.00, 'OCCUPIED', '2025-11-01', 'Retail frontage and fitout photos', 'Retail lease and fitout approvals'),
(@company_id, @property_office_id, @building_office_id, @floor_office_12_id, 'BBS-1205', '1205', 'OFFICE',
 2650.00, 'SQ_FT', 420000.00, 210000.00, 'OCCUPIED', '2026-02-01', 'Fitted office suite photos', 'Commercial lease document set'),
(@company_id, @property_logistics_id, @building_logistics_id, @floor_wh_id, 'JLP-WH-08', 'WH-08', 'WAREHOUSE',
 18500.00, 'SQ_FT', 920000.00, 460000.00, 'AVAILABLE', '2026-07-01', 'Warehouse bay, loading dock, yard photos', 'Warehouse leasing checklist');

SET @unit_res_id := (SELECT id FROM property_units WHERE property_id = @property_res_id AND unit_code = 'MP-A-1804');
SET @unit_res_available_id := (SELECT id FROM property_units WHERE property_id = @property_res_id AND unit_code = 'MP-A-3201');
SET @unit_retail_id := (SELECT id FROM property_units WHERE property_id = @property_office_id AND unit_code = 'BBS-G-03');
SET @unit_office_id := (SELECT id FROM property_units WHERE property_id = @property_office_id AND unit_code = 'BBS-1205');

INSERT IGNORE INTO tenants (
    company_id, tenant_code, tenant_type, first_name, last_name, company_name, phone_number,
    email, alternate_phone, date_of_birth_or_registration, id_proof_type, id_proof_number,
    tax_number, gst_number, emergency_contact, employer_details, current_address,
    permanent_address, kyc_status, blacklist_status, tenant_status, kyc_stage,
    id_proof_document_note, address_proof_document_note, financial_document_note
) VALUES
(@company_id, 'TEN-DXB-RES-001', 'INDIVIDUAL', 'Aisha', 'Rahman', NULL, '+971-55-210-1101',
 'aisha.rahman@example.com', '+971-55-210-1199', '1990-04-18', 'EMIRATES_ID', '784-1990-1234567-1',
 NULL, NULL, 'Yusuf Rahman +971-55-210-1122', 'Senior Architect at Gulf Design Studio',
 'Unit 1804, Marina Pearl Residences', 'Dubai Marina, Dubai', 'VERIFIED', 'CLEAR', 'ACTIVE',
 'APPROVED', 'Emirates ID verified', 'DEWA bill verified', 'Salary certificate reviewed'),
(@company_id, 'TEN-DXB-COM-001', 'COMPANY', NULL, NULL, 'GulfTech Solutions FZ-LLC', '+971-4-555-2201',
 'accounts@gulftech.example.com', NULL, '2017-09-10', 'TRADE_LICENSE', 'DMCC-987654',
 'TRN100765432100003', 'TRN100765432100003', 'Finance Desk +971-4-555-2299', 'Technology services company',
 'Office 1205, Business Bay Square Offices', 'DMCC, Dubai', 'VERIFIED', 'CLEAR', 'ACTIVE',
 'APPROVED', 'Trade license verified', 'Registered office proof verified', 'Audited financials reviewed'),
(@company_id, 'TEN-DXB-RET-001', 'COMPANY', NULL, NULL, 'Saffron Market Gourmet LLC', '+971-4-555-3301',
 'leasing@saffronmarket.example.com', NULL, '2020-02-14', 'TRADE_LICENSE', 'DED-554433',
 'TRN100112233400003', 'TRN100112233400003', 'Store Manager +971-55-330-4411', 'Premium grocery and cafe retail operator',
 'Shop G03, Business Bay Square Offices', 'Al Quoz, Dubai', 'VERIFIED', 'CLEAR', 'ACTIVE',
 'APPROVED', 'Trade license verified', 'Tenancy address proof verified', 'Bank statement reviewed');

SET @tenant_res_id := (SELECT id FROM tenants WHERE company_id = @company_id AND tenant_code = 'TEN-DXB-RES-001');
SET @tenant_office_id := (SELECT id FROM tenants WHERE company_id = @company_id AND tenant_code = 'TEN-DXB-COM-001');
SET @tenant_retail_id := (SELECT id FROM tenants WHERE company_id = @company_id AND tenant_code = 'TEN-DXB-RET-001');

INSERT IGNORE INTO vendors (
    company_id, vendor_code, vendor_name, contact_person, phone, email, address, service_category,
    tax_number, bank_details, contract_status, insurance_details, rating, vendor_status, assignment_stage
) VALUES
(@company_id, 'VEN-DXB-FM-001', 'Emirates Facilities Services LLC', 'Sameer Khan', '+971-4-555-4101',
 'helpdesk@emiratesfm.example.com', 'Al Quoz Industrial Area 3, Dubai', 'Integrated facilities management',
 'TRN100445566700003', 'Emirates NBD A/C ending 7712', 'ACTIVE', 'Public liability and workmen compensation valid until 2027-12-31',
 4.7, 'ACTIVE', 'VENDOR_ASSIGNED'),
(@company_id, 'VEN-DXB-LIFT-001', 'Gulf Vertical Transport LLC', 'Mariam Saleh', '+971-4-555-4201',
 'service@gulfvertical.example.com', 'Ras Al Khor, Dubai', 'Elevator and escalator AMC',
 'TRN100998877600003', 'Mashreq Bank A/C ending 2290', 'ACTIVE', 'Elevator AMC insurance valid until 2027-06-30',
 4.8, 'ACTIVE', 'VENDOR_ASSIGNED'),
(@company_id, 'VEN-DXB-CHILLER-001', 'BluePeak Cooling Services LLC', 'Tariq Latif', '+971-4-555-4301',
 'contracts@bluepeak.example.com', 'Dubai Investment Park', 'HVAC and district cooling',
 'TRN100665544300003', 'ADCB A/C ending 4419', 'ACTIVE', 'HVAC service liability cover valid until 2027-03-31',
 4.5, 'ACTIVE', 'VENDOR_ASSIGNED');

SET @vendor_fm_id := (SELECT id FROM vendors WHERE company_id = @company_id AND vendor_code = 'VEN-DXB-FM-001');
SET @vendor_lift_id := (SELECT id FROM vendors WHERE company_id = @company_id AND vendor_code = 'VEN-DXB-LIFT-001');
SET @vendor_chiller_id := (SELECT id FROM vendors WHERE company_id = @company_id AND vendor_code = 'VEN-DXB-CHILLER-001');

INSERT IGNORE INTO owners (
    company_id, owner_code, owner_name, phone, email, address, tax_details, bank_account_details,
    ownership_percentage, payout_frequency, statement_preference, owner_status, statement_stage
) VALUES
(@company_id, 'OWN-DXB-001', 'Khalid Al Nuaimi', '+971-50-100-0105', 'khalid.owner@example.com',
 'Emirates Hills, Dubai', 'TRN: Individual owner not VAT registered', 'Emirates NBD A/C ending 8801', 100.00,
 'MONTHLY', 'EMAIL_AND_PORTAL', 'ACTIVE', 'OWNER_STATEMENT_GENERATED'),
(@company_id, 'OWN-DXB-002', 'Dubai Developments Asset Holdings LLC', '+971-4-555-0199', 'asset.holdings@dubaidevelopments.example.com',
 'Business Bay, Dubai', 'TRN100234567800003', 'Emirates NBD A/C ending 5402', 100.00,
 'MONTHLY', 'EMAIL', 'ACTIVE', 'MANAGEMENT_FEE_DEDUCTED');

SET @owner_res_id := (SELECT id FROM owners WHERE company_id = @company_id AND owner_code = 'OWN-DXB-001');
SET @owner_company_id := (SELECT id FROM owners WHERE company_id = @company_id AND owner_code = 'OWN-DXB-002');

INSERT IGNORE INTO owner_properties (owner_id, property_id) VALUES
(@owner_res_id, @property_res_id),
(@owner_company_id, @property_office_id),
(@owner_company_id, @property_logistics_id);

INSERT IGNORE INTO leases (
    company_id, lease_number, tenant_id, property_id, unit_id, lease_start_date, lease_end_date,
    rent_amount, security_deposit_amount, billing_cycle, due_day, grace_period_days,
    late_fee_rule, agreement_document, status, activation_date
) VALUES
(@company_id, 'LEASE-DXB-RES-001', @tenant_res_id, @property_res_id, @unit_res_id,
 '2026-01-01', '2026-12-31', 145000.00, 72500.00, 'YEARLY', 1, 7,
 'AED 500 admin charge after grace period plus applicable legal notices', 'Residential Ejari lease agreement stored as document record.', 'ACTIVE', '2026-01-01'),
(@company_id, 'LEASE-DXB-OFF-001', @tenant_office_id, @property_office_id, @unit_office_id,
 '2026-02-01', '2029-01-31', 420000.00, 210000.00, 'QUARTERLY', 10, 10,
 'Quarterly rent late fee as per commercial lease schedule', 'Commercial office lease agreement stored as document record.', 'ACTIVE', '2026-02-01'),
(@company_id, 'LEASE-DXB-RET-001', @tenant_retail_id, @property_office_id, @unit_retail_id,
 '2025-11-01', '2028-10-31', 310000.00, 155000.00, 'QUARTERLY', 10, 10,
 'Retail rent late fee and turnover rent review clause', 'Retail lease and fitout approval stored as document record.', 'ACTIVE', '2025-11-01');

SET @lease_res_id := (SELECT id FROM leases WHERE company_id = @company_id AND lease_number = 'LEASE-DXB-RES-001');
SET @lease_office_id := (SELECT id FROM leases WHERE company_id = @company_id AND lease_number = 'LEASE-DXB-OFF-001');
SET @lease_retail_id := (SELECT id FROM leases WHERE company_id = @company_id AND lease_number = 'LEASE-DXB-RET-001');

INSERT IGNORE INTO rent_schedules (
    company_id, lease_id, tenant_id, property_id, unit_id, schedule_number,
    billing_period_start, billing_period_end, due_date, rent_amount, late_fee_amount,
    paid_amount, due_amount, invoice_id, status
) VALUES
(@company_id, @lease_res_id, @tenant_res_id, @property_res_id, @unit_res_id,
 'RS-DXB-RES-2026-001', '2026-01-01', '2026-12-31', '2026-01-01',
 145000.00, 0.00, 145000.00, 0.00, NULL, 'PAID'),
(@company_id, @lease_office_id, @tenant_office_id, @property_office_id, @unit_office_id,
 'RS-DXB-OFF-2026-Q2', '2026-05-01', '2026-07-31', '2026-05-10',
 105000.00, 0.00, 70000.00, 35000.00, NULL, 'PARTIALLY_PAID'),
(@company_id, @lease_retail_id, @tenant_retail_id, @property_office_id, @unit_retail_id,
 'RS-DXB-RET-2026-Q2', '2026-05-01', '2026-07-31', '2026-05-10',
 77500.00, 0.00, 0.00, 77500.00, NULL, 'DUE');

SET @schedule_res_id := (SELECT id FROM rent_schedules WHERE company_id = @company_id AND schedule_number = 'RS-DXB-RES-2026-001');
SET @schedule_office_id := (SELECT id FROM rent_schedules WHERE company_id = @company_id AND schedule_number = 'RS-DXB-OFF-2026-Q2');
SET @schedule_retail_id := (SELECT id FROM rent_schedules WHERE company_id = @company_id AND schedule_number = 'RS-DXB-RET-2026-Q2');

INSERT IGNORE INTO invoices (
    company_id, invoice_number, invoice_type, lease_id, rent_schedule_id, tenant_id,
    property_id, unit_id, invoice_date, due_date, subtotal_amount, tax_amount,
    discount_amount, late_fee_amount, total_amount, paid_amount, due_amount, status,
    description, pdf_document
) VALUES
(@company_id, 'INV-DXB-RES-2026-001', 'RENT', @lease_res_id, @schedule_res_id,
 @tenant_res_id, @property_res_id, @unit_res_id, '2026-01-01', '2026-01-01',
 145000.00, 0.00, 0.00, 0.00, 145000.00, 145000.00, 0.00, 'PAID',
 'Annual residential rent invoice for Marina Pearl unit 1804.', 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K'),
(@company_id, 'INV-DXB-OFF-2026-Q2', 'RENT', @lease_office_id, @schedule_office_id,
 @tenant_office_id, @property_office_id, @unit_office_id, '2026-05-01', '2026-05-10',
 105000.00, 5250.00, 0.00, 0.00, 110250.00, 70000.00, 40250.00, 'PARTIALLY_PAID',
 'Q2 2026 commercial office rent invoice for GulfTech Solutions.', 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K'),
(@company_id, 'INV-DXB-RET-2026-Q2', 'RENT', @lease_retail_id, @schedule_retail_id,
 @tenant_retail_id, @property_office_id, @unit_retail_id, '2026-05-01', '2026-05-10',
 77500.00, 3875.00, 0.00, 0.00, 81375.00, 0.00, 81375.00, 'ISSUED',
 'Q2 2026 retail rent invoice for Saffron Market.', 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K');

SET @invoice_res_id := (SELECT id FROM invoices WHERE company_id = @company_id AND invoice_number = 'INV-DXB-RES-2026-001');
SET @invoice_office_id := (SELECT id FROM invoices WHERE company_id = @company_id AND invoice_number = 'INV-DXB-OFF-2026-Q2');
SET @invoice_retail_id := (SELECT id FROM invoices WHERE company_id = @company_id AND invoice_number = 'INV-DXB-RET-2026-Q2');

UPDATE rent_schedules SET invoice_id = @invoice_res_id WHERE id = @schedule_res_id AND invoice_id IS NULL;
UPDATE rent_schedules SET invoice_id = @invoice_office_id WHERE id = @schedule_office_id AND invoice_id IS NULL;
UPDATE rent_schedules SET invoice_id = @invoice_retail_id WHERE id = @schedule_retail_id AND invoice_id IS NULL;

INSERT IGNORE INTO receipts (
    company_id, receipt_number, invoice_id, tenant_id, receipt_date, payment_mode,
    amount, advance_amount, reference_number, remarks, pdf_document, status
) VALUES
(@company_id, 'REC-DXB-RES-2026-001', @invoice_res_id, @tenant_res_id,
 '2026-01-01', 'BANK_TRANSFER', 145000.00, 0.00, 'ENBD-RES-145000', 'Annual residential rent collected.',
 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K', 'POSTED'),
(@company_id, 'REC-DXB-OFF-2026-Q2-001', @invoice_office_id, @tenant_office_id,
 '2026-05-06', 'BANK_TRANSFER', 70000.00, 0.00, 'MASHREQ-OFF-70000', 'Partial Q2 office rent collection.',
 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K', 'POSTED');

SET @receipt_res_id := (SELECT id FROM receipts WHERE company_id = @company_id AND receipt_number = 'REC-DXB-RES-2026-001');
SET @receipt_office_id := (SELECT id FROM receipts WHERE company_id = @company_id AND receipt_number = 'REC-DXB-OFF-2026-Q2-001');

INSERT IGNORE INTO security_deposits (
    company_id, lease_id, tenant_id, property_id, unit_id, deposit_number, deposit_amount,
    collected_amount, adjusted_amount, refunded_amount, refundable_amount,
    deposit_invoice_id, deposit_receipt_id, status, remarks
) VALUES
(@company_id, @lease_res_id, @tenant_res_id, @property_res_id, @unit_res_id,
 'SD-DXB-RES-001', 72500.00, 72500.00, 0.00, 0.00, 72500.00, NULL, @receipt_res_id, 'COLLECTED', 'Residential security deposit collected at lease start.'),
(@company_id, @lease_office_id, @tenant_office_id, @property_office_id, @unit_office_id,
 'SD-DXB-OFF-001', 210000.00, 210000.00, 0.00, 0.00, 210000.00, NULL, @receipt_office_id, 'COLLECTED', 'Commercial office security deposit collected.');

INSERT IGNORE INTO utility_types (
    company_id, type_code, type_name, category, billing_method, unit_of_measure,
    default_rate, fixed_charge, common_area, status, description
) VALUES
(@company_id, 'DEWA-ELEC-DXB', 'DEWA Electricity', 'ELECTRICITY', 'METERED', 'KWH', 0.4450, 35.00, FALSE, 'ACTIVE', 'Unit electricity recharge for Dubai properties'),
(@company_id, 'CHILLER-DXB', 'District Cooling', 'COOLING', 'METERED', 'RTH', 0.6500, 250.00, FALSE, 'ACTIVE', 'District cooling recharge for commercial tenants'),
(@company_id, 'COMMON-FM-DXB', 'Common Area FM Charge', 'SERVICE_CHARGE', 'FIXED', 'MONTH', 0.0000, 1200.00, TRUE, 'ACTIVE', 'Common-area facilities management charge');

SET @utility_elec_id := (SELECT id FROM utility_types WHERE company_id = @company_id AND type_code = 'DEWA-ELEC-DXB');
SET @utility_chiller_id := (SELECT id FROM utility_types WHERE company_id = @company_id AND type_code = 'CHILLER-DXB');

INSERT IGNORE INTO meter_readings (
    company_id, reading_number, utility_type_id, property_id, unit_id, tenant_id,
    meter_number, reading_date, previous_reading, current_reading, consumption,
    common_area, status, remarks
) VALUES
(@company_id, 'MRD-DXB-RES-2026-05', @utility_elec_id, @property_res_id, @unit_res_id,
 @tenant_res_id, 'DEWA-MP-1804', '2026-05-01', 8200.0000, 8585.0000, 385.0000, FALSE, 'RECORDED', 'May electricity reading for residential unit 1804.'),
(@company_id, 'MRD-DXB-OFF-2026-05', @utility_chiller_id, @property_office_id, @unit_office_id,
 @tenant_office_id, 'CHL-BBS-1205', '2026-05-01', 4120.0000, 4410.0000, 290.0000, FALSE, 'RECORDED', 'May district cooling reading for office 1205.');

SET @meter_res_id := (SELECT id FROM meter_readings WHERE company_id = @company_id AND reading_number = 'MRD-DXB-RES-2026-05');
SET @meter_office_id := (SELECT id FROM meter_readings WHERE company_id = @company_id AND reading_number = 'MRD-DXB-OFF-2026-05');

INSERT IGNORE INTO utility_bills (
    company_id, bill_number, utility_type_id, meter_reading_id, tenant_id, property_id,
    unit_id, bill_date, due_date, billing_period_start, billing_period_end, billing_method,
    consumption, rate, fixed_charge, usage_amount, common_area_amount, tax_amount,
    total_amount, paid_amount, due_amount, status, remarks
) VALUES
(@company_id, 'UBILL-DXB-RES-2026-05', @utility_elec_id, @meter_res_id, @tenant_res_id,
 @property_res_id, @unit_res_id, '2026-05-02', '2026-05-12', '2026-04-01', '2026-04-30',
 'METERED', 385.0000, 0.4450, 35.00, 171.33, 0.00, 10.32, 216.65, 0.00, 216.65, 'ISSUED', 'DEWA electricity recharge.'),
(@company_id, 'UBILL-DXB-OFF-2026-05', @utility_chiller_id, @meter_office_id, @tenant_office_id,
 @property_office_id, @unit_office_id, '2026-05-02', '2026-05-12', '2026-04-01', '2026-04-30',
 'METERED', 290.0000, 0.6500, 250.00, 188.50, 0.00, 21.93, 460.43, 0.00, 460.43, 'ISSUED', 'District cooling recharge.');

INSERT IGNORE INTO property_assets (
    company_id, asset_code, asset_name, asset_category, property_id, building_id,
    unit_id, serial_number, manufacturer, model_number, purchase_date, purchase_cost,
    installation_date, condition_status, warranty_provider, warranty_start_date,
    warranty_end_date, warranty_terms, maintenance_frequency, next_maintenance_date,
    status, remarks
) VALUES
(@company_id, 'AST-DXB-ELV-001', 'Marina Pearl Elevator Bank 1', 'ELEVATOR', @property_res_id,
 @building_res_id, NULL, 'GV-DXB-MP-ELV-001', 'Gulf Vertical Transport', 'GVX-1800',
 '2024-08-10', 2750000.00, '2024-11-15', 'GOOD', 'Gulf Vertical Transport LLC',
 '2024-11-15', '2027-11-14', 'Three-year warranty plus AMC coverage.', 'MONTHLY', '2026-05-20',
 'ACTIVE', 'Critical vertical transport asset.'),
(@company_id, 'AST-DXB-CHL-001', 'Business Bay Square Chiller Interface', 'HVAC', @property_office_id,
 @building_office_id, NULL, 'BP-BBS-CHL-001', 'BluePeak Cooling', 'BPC-500',
 '2023-05-01', 1500000.00, '2023-06-01', 'GOOD', 'BluePeak Cooling Services LLC',
 '2023-06-01', '2027-05-31', 'AMC-backed district cooling interface.', 'MONTHLY', '2026-05-18',
 'ACTIVE', 'Asset management record for commercial cooling plant interface.');

SET @asset_elevator_id := (SELECT id FROM property_assets WHERE company_id = @company_id AND asset_code = 'AST-DXB-ELV-001');
SET @asset_chiller_id := (SELECT id FROM property_assets WHERE company_id = @company_id AND asset_code = 'AST-DXB-CHL-001');

INSERT IGNORE INTO asset_maintenance_schedules (
    company_id, schedule_number, asset_id, maintenance_type, frequency, planned_date,
    assigned_vendor_id, estimated_cost, priority, status, remarks
) VALUES
(@company_id, 'AMS-DXB-ELV-2026-05', @asset_elevator_id, 'AMC_SERVICE', 'MONTHLY', '2026-05-20',
 @vendor_lift_id, 18500.00, 'HIGH', 'SCHEDULED', 'Monthly elevator safety and performance inspection.'),
(@company_id, 'AMS-DXB-CHL-2026-05', @asset_chiller_id, 'AMC_SERVICE', 'MONTHLY', '2026-05-18',
 @vendor_chiller_id, 22000.00, 'HIGH', 'SCHEDULED', 'Monthly cooling interface inspection before summer peak.');

SET @asset_schedule_id := (SELECT id FROM asset_maintenance_schedules WHERE company_id = @company_id AND schedule_number = 'AMS-DXB-ELV-2026-05');

INSERT IGNORE INTO asset_service_history (
    company_id, service_number, asset_id, maintenance_schedule_id, service_date,
    service_type, vendor_id, technician_name, condition_before, condition_after,
    work_performed, parts_replaced, service_cost, next_service_date, status, remarks
) VALUES (
    @company_id, 'ASH-DXB-ELV-2026-04', @asset_elevator_id, @asset_schedule_id, '2026-04-20',
    'AMC_SERVICE', @vendor_lift_id, 'Farid Malik', 'GOOD', 'GOOD',
    'Door sensor calibration, brake test, controller diagnostics, cabin inspection.',
    'Door roller kit', 18200.00, '2026-05-20', 'COMPLETED', 'Asset remains in good operating condition.'
);

INSERT IGNORE INTO maintenance_requests (
    company_id, request_number, tenant_id, property_id, unit_id, category, priority,
    description, assigned_vendor_id, assigned_user_id, estimated_cost, actual_cost,
    status, approval_status, attachments_json, completion_remarks
) VALUES (
    @company_id, 'MR-DXB-OFF-001', @tenant_office_id, @property_office_id, @unit_office_id,
    'HVAC', 'HIGH', 'Tenant reported warm air and low cooling in office suite 1205.',
    @vendor_chiller_id, @manager_user_id, 8500.00, 0.00, 'SUBMITTED',
    'PENDING_APPROVAL', '[{"fileName":"office-1205-thermostat.jpg"}]', 'Awaiting chiller vendor inspection.'
);

SET @maintenance_request_id := (SELECT id FROM maintenance_requests WHERE company_id = @company_id AND request_number = 'MR-DXB-OFF-001');

INSERT IGNORE INTO maintenance_work_orders (
    company_id, work_order_number, maintenance_request_id, vendor_id, technician_user_id,
    materials_used, labor_charges, vendor_invoice_document, completion_remarks,
    approval_status, status
) VALUES (
    @company_id, 'WO-DXB-OFF-001', @maintenance_request_id, @vendor_chiller_id, @manager_user_id,
    'Diagnostic visit pending', 0.00, NULL,
    'Work order issued to cooling vendor.', 'PENDING_APPROVAL', 'OPEN'
);

INSERT IGNORE INTO preventive_maintenance_schedules (
    company_id, schedule_number, property_id, unit_id, asset_name, maintenance_type,
    recurrence_frequency, next_due_date, responsible_user_id, vendor_id, notify_before_days,
    completion_status, last_completed_date, completion_remarks, status
) VALUES (
    @company_id, 'PM-DXB-COM-CHILLER-001', @property_office_id, NULL, 'Business Bay Square cooling interface',
    'HVAC AMC', 'MONTHLY', '2026-05-18', @manager_user_id, @vendor_chiller_id,
    7, 'SCHEDULED', '2026-04-18', 'April cooling preventive service completed.', 'ACTIVE'
);

INSERT IGNORE INTO purchase_requests (
    company_id, request_number, property_id, unit_id, expense_type, description,
    estimated_amount, status, approval_status
) VALUES (
    @company_id, 'PR-DXB-OFF-HVAC-001', @property_office_id, @unit_office_id, 'HVAC_REPAIR',
    'Cooling diagnostic and spare parts allowance for office 1205.', 8500.00, 'SUBMITTED', 'PENDING_APPROVAL'
);

SET @purchase_request_id := (SELECT id FROM purchase_requests WHERE company_id = @company_id AND request_number = 'PR-DXB-OFF-HVAC-001');

INSERT IGNORE INTO purchase_orders (
    company_id, purchase_order_number, purchase_request_id, vendor_id, property_id,
    unit_id, order_date, expected_delivery_date, total_amount, status, approval_status, remarks
) VALUES (
    @company_id, 'PO-DXB-OFF-HVAC-001', @purchase_request_id, @vendor_chiller_id, @property_office_id,
    @unit_office_id, '2026-05-07', '2026-05-09', 8500.00, 'DRAFT', 'PENDING_APPROVAL',
    'Draft PO for HVAC diagnostic and spare parts.'
);

SET @purchase_order_id := (SELECT id FROM purchase_orders WHERE company_id = @company_id AND purchase_order_number = 'PO-DXB-OFF-HVAC-001');

INSERT IGNORE INTO vendor_invoices (
    company_id, invoice_number, purchase_order_id, vendor_id, property_id, unit_id,
    invoice_date, due_date, invoice_amount, paid_amount, payment_status,
    approval_status, status, remarks
) VALUES (
    @company_id, 'VINV-DXB-FM-2026-05', NULL, @vendor_fm_id, @property_res_id,
    NULL, '2026-05-01', '2026-05-31', 38500.00, 0.00, 'UNPAID',
    'APPROVED', 'POSTED', 'Monthly facilities management invoice for Marina Pearl Residences.'
);

SET @vendor_invoice_id := (SELECT id FROM vendor_invoices WHERE company_id = @company_id AND invoice_number = 'VINV-DXB-FM-2026-05');

INSERT IGNORE INTO property_expenses (
    company_id, expense_number, vendor_invoice_id, vendor_id, property_id, unit_id,
    expense_date, expense_type, amount, description, approval_status, payment_status, status
) VALUES (
    @company_id, 'EXP-DXB-FM-2026-05', @vendor_invoice_id, @vendor_fm_id, @property_res_id,
    NULL, '2026-05-01', 'FACILITIES_MANAGEMENT', 38500.00,
    'Monthly FM service expense for residential tower.', 'APPROVED', 'UNPAID', 'RECORDED'
);

INSERT IGNORE INTO property_inspections (
    company_id, inspection_number, inspection_type, property_id, unit_id, lease_id,
    tenant_id, scheduled_date, inspection_date, inspector_name, overall_condition,
    damage_status, estimated_repair_cost, checklist_json, photo_attachments_json,
    damage_notes, tenant_acknowledgement_status, tenant_acknowledged_by,
    tenant_acknowledged_at, status, remarks
) VALUES (
    @company_id, 'INSP-DXB-RES-1804', 'MOVE_IN', @property_res_id, @unit_res_id,
    @lease_res_id, @tenant_res_id, '2025-12-28', '2025-12-28',
    'Omar Haddad', 'EXCELLENT', 'NONE', 0.00,
    '{"walls":"excellent","flooring":"excellent","appliances":"tested","balcony":"safe"}',
    '[{"fileName":"marina-pearl-1804-move-in.jpg"}]', 'No damages noted at handover.',
    'ACKNOWLEDGED', 'Aisha Rahman', '2025-12-28 16:45:00', 'COMPLETED',
    'Move-in handover completed for Marina Pearl unit 1804.'
);

INSERT IGNORE INTO documents (
    company_id, document_number, document_title, document_type, file_name, content_type,
    file_size, data_url, property_id, unit_id, tenant_id, lease_id, vendor_id, invoice_id,
    expiry_date, version_number, previous_document_id, status, access_level, remarks
) VALUES
(@company_id, 'DOC-DXB-LEASE-RES-001', 'Ejari Lease Agreement MP-A-1804', 'LEASE_AGREEMENT',
 'ejari-mp-a-1804.pdf', 'application/pdf', 2048, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 @property_res_id, @unit_res_id, @tenant_res_id, @lease_res_id, NULL, NULL,
 '2026-12-31', 1, NULL, 'ACTIVE', 'TENANT', 'Tenant-visible residential lease agreement.'),
(@company_id, 'DOC-DXB-DCD-BBS-001', 'Business Bay Square DCD Certificate', 'COMPLIANCE_CERTIFICATE',
 'bbs-dcd-certificate.pdf', 'application/pdf', 2048, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 @property_office_id, NULL, NULL, NULL, NULL, NULL,
 '2027-04-30', 1, NULL, 'ACTIVE', 'INTERNAL', 'Dubai Civil Defence certificate for commercial tower.'),
(@company_id, 'DOC-DXB-VENDOR-FM-001', 'Emirates FM Service Contract', 'VENDOR_CONTRACT',
 'emirates-fm-contract.pdf', 'application/pdf', 2048, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 @property_res_id, NULL, NULL, NULL, @vendor_fm_id, NULL,
 '2027-12-31', 1, NULL, 'ACTIVE', 'INTERNAL', 'Integrated facilities management contract.'),
(@company_id, 'DOC-DXB-INVOICE-OFF-Q2', 'Office Q2 Rent Invoice PDF', 'INVOICE_PDF',
 'invoice-dxb-off-2026-q2.pdf', 'application/pdf', 2048, 'data:application/pdf;base64,JVBERi0xLjQKJURlbW8K',
 @property_office_id, @unit_office_id, @tenant_office_id, @lease_office_id, NULL, @invoice_office_id,
 NULL, 1, NULL, 'ACTIVE', 'TENANT', 'Commercial invoice available for tenant portal.');

INSERT INTO notifications (
    company_id, recipient_user_id, recipient_name, recipient_email, recipient_phone,
    notification_type, title, message, entity_type, entity_id, priority, read_at
)
SELECT @company_id, @finance_user_id, 'Leila Farooq', 'finance@dubaidevelopments.example.com', '+971-50-100-0103',
       'RENT_DUE_REMINDER', 'Commercial rent balance pending', 'GulfTech Solutions has AED 40,250 outstanding for Q2 2026.',
       'INVOICE', @invoice_office_id, 'HIGH', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM notifications WHERE company_id = @company_id AND title = 'Commercial rent balance pending' AND entity_id = @invoice_office_id
);

SET @notification_id := (
    SELECT id FROM notifications
    WHERE company_id = @company_id AND title = 'Commercial rent balance pending' AND entity_id = @invoice_office_id
    ORDER BY id LIMIT 1
);

INSERT INTO notification_deliveries (notification_id, channel, destination, status, provider_message, attempted_at)
SELECT @notification_id, 'EMAIL', 'finance@dubaidevelopments.example.com', 'SENT', 'Demo email delivery recorded.', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM notification_deliveries WHERE notification_id = @notification_id AND channel = 'EMAIL'
);

INSERT IGNORE INTO approval_workflow_configs (
    company_id, transaction_type, level_no, approver_role_id, min_amount, max_amount, active
) VALUES
(@company_id, 'COMMERCIAL_LEASE_APPROVAL', 1, @manager_role_id, NULL, 500000.00, TRUE),
(@company_id, 'ASSET_MAINTENANCE_APPROVAL', 1, @manager_role_id, 5000.00, 50000.00, TRUE),
(@company_id, 'VENDOR_INVOICE_APPROVAL', 1, @finance_role_id, NULL, NULL, TRUE);

INSERT IGNORE INTO approval_requests (
    company_id, transaction_type, entity_id, reference_number, amount, status,
    current_level, requested_by, submitted_at, completed_at, requester_remarks, final_remarks
) VALUES (
    @company_id, 'ASSET_MAINTENANCE_APPROVAL', @maintenance_request_id, 'MR-DXB-OFF-001',
    8500.00, 'PENDING', 1, @manager_user_id, '2026-05-07 09:30:00',
    NULL, 'HVAC issue affecting commercial tenant operations.', NULL
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-01', 'RENT_RECEIVABLE', 'TENANT', @tenant_office_id,
       @property_office_id, @unit_office_id, 'INVOICE', @invoice_office_id, 'INV-DXB-OFF-2026-Q2',
       'Commercial rent receivable posted for Q2 2026.', 110250.00, 0.00, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'INVOICE' AND source_reference = 'INV-DXB-OFF-2026-Q2' AND account_type = 'RENT_RECEIVABLE'
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-06', 'CASH_BANK', 'TENANT', @tenant_office_id,
       @property_office_id, @unit_office_id, 'RECEIPT', @receipt_office_id, 'REC-DXB-OFF-2026-Q2-001',
       'Partial commercial rent collection received.', 70000.00, 0.00, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'RECEIPT' AND source_reference = 'REC-DXB-OFF-2026-Q2-001' AND account_type = 'CASH_BANK'
);

INSERT INTO accounting_entries (
    company_id, entry_date, account_type, party_type, party_id, property_id, unit_id,
    source_type, source_id, source_reference, description, debit_amount, credit_amount, reconciled
)
SELECT @company_id, '2026-05-01', 'PROPERTY_EXPENSE', 'VENDOR', @vendor_fm_id,
       @property_res_id, NULL, 'VENDOR_INVOICE', @vendor_invoice_id, 'VINV-DXB-FM-2026-05',
       'Facilities management expense for Marina Pearl Residences.', 38500.00, 0.00, FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM accounting_entries
    WHERE company_id = @company_id AND source_type = 'VENDOR_INVOICE' AND source_reference = 'VINV-DXB-FM-2026-05' AND account_type = 'PROPERTY_EXPENSE'
);

INSERT INTO audit_logs (
    company_id, user_id, user_name, action, screen, entity_type, entity_id,
    old_value, new_value, ip_address, action_at
)
SELECT @company_id, @manager_user_id, 'Omar Haddad', 'Commercial lease activated',
       'Leases', 'LEASE', @lease_office_id, NULL,
       '{"leaseNumber":"LEASE-DXB-OFF-001","status":"ACTIVE"}', '127.0.0.1', '2026-02-01 10:00:00'
WHERE NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE company_id = @company_id AND action = 'Commercial lease activated' AND entity_id = @lease_office_id
);

INSERT INTO audit_logs (
    company_id, user_id, user_name, action, screen, entity_type, entity_id,
    old_value, new_value, ip_address, action_at
)
SELECT @company_id, @finance_user_id, 'Leila Farooq', 'Commercial payment received',
       'Rent Billing', 'RECEIPT', @receipt_office_id, NULL,
       '{"receiptNumber":"REC-DXB-OFF-2026-Q2-001","amount":70000}', '127.0.0.1', '2026-05-06 14:00:00'
WHERE NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE company_id = @company_id AND action = 'Commercial payment received' AND entity_id = @receipt_office_id
);
