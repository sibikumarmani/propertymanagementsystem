SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS owner_properties;
DROP TABLE IF EXISTS owners;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS rental_applications;
DROP TABLE IF EXISTS leasing_leads;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS property_units;
DROP TABLE IF EXISTS property_floors;
DROP TABLE IF EXISTS property_buildings;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS company_branches;
DROP TABLE IF EXISTS user_menu_access;
DROP TABLE IF EXISTS role_menu_access;
DROP TABLE IF EXISTS user_companies;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS password_reset_codes;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL
);

CREATE TABLE companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(200) NOT NULL,
    company_code VARCHAR(50) NULL UNIQUE,
    email VARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    gst_number VARCHAR(50) NULL,
    tax_number VARCHAR(50) NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL
);

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_code VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    full_name VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_image LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL
);

CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(768) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE email_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_reset_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_password_reset_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uk_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE user_companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_user_companies_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_companies_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_user_companies_user_company UNIQUE (user_id, company_id)
);

CREATE TABLE role_menu_access (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    menu_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_role_menu_access_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uk_role_menu_access_role_menu UNIQUE (role_id, menu_key)
);

CREATE TABLE user_menu_access (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    menu_key VARCHAR(100) NOT NULL,
    allowed BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_user_menu_access_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_user_menu_access_user_menu UNIQUE (user_id, menu_key)
);

CREATE TABLE company_branches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    branch_name VARCHAR(200) NOT NULL,
    branch_code VARCHAR(50) NULL,
    address TEXT NULL,
    city VARCHAR(120) NULL,
    state VARCHAR(120) NULL,
    country VARCHAR(120) NULL,
    postal_code VARCHAR(40) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_company_branches_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_company_branches_company_code UNIQUE (company_id, branch_code)
);

CREATE TABLE properties (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    branch_id BIGINT NULL,
    property_code VARCHAR(80) NOT NULL,
    property_name VARCHAR(200) NOT NULL,
    property_type VARCHAR(60) NOT NULL,
    ownership_type VARCHAR(40) NOT NULL,
    owner_reference VARCHAR(120) NULL,
    ownership_details TEXT NULL,
    address TEXT NULL,
    city VARCHAR(120) NULL,
    state VARCHAR(120) NULL,
    country VARCHAR(120) NULL,
    pincode VARCHAR(30) NULL,
    total_floors INT NULL,
    total_units INT NULL,
    property_manager_user_id BIGINT NULL,
    property_manager_name VARCHAR(150) NULL,
    amenities_summary TEXT NULL,
    document_summary LONGTEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_properties_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_properties_branch FOREIGN KEY (branch_id) REFERENCES company_branches(id),
    CONSTRAINT fk_properties_property_manager FOREIGN KEY (property_manager_user_id) REFERENCES users(id),
    CONSTRAINT uk_properties_company_code UNIQUE (company_id, property_code)
);

CREATE TABLE property_buildings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    building_code VARCHAR(80) NOT NULL,
    building_name VARCHAR(200) NOT NULL,
    number_of_floors INT NULL,
    amenities_summary TEXT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_property_buildings_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_property_buildings_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT uk_property_buildings_property_code UNIQUE (property_id, building_code)
);

CREATE TABLE property_floors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    building_id BIGINT NOT NULL,
    floor_code VARCHAR(80) NOT NULL,
    floor_name VARCHAR(200) NOT NULL,
    floor_number INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_property_floors_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_property_floors_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_property_floors_building FOREIGN KEY (building_id) REFERENCES property_buildings(id),
    CONSTRAINT uk_property_floors_building_code UNIQUE (building_id, floor_code),
    CONSTRAINT uk_property_floors_building_number UNIQUE (building_id, floor_number)
);

CREATE TABLE property_units (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    building_id BIGINT NOT NULL,
    floor_id BIGINT NOT NULL,
    unit_code VARCHAR(80) NOT NULL,
    unit_number VARCHAR(80) NOT NULL,
    unit_type VARCHAR(80) NOT NULL,
    area_value DECIMAL(18,2) NULL,
    area_unit VARCHAR(20) NOT NULL DEFAULT 'SQ_FT',
    base_rent DECIMAL(18,2) NULL,
    security_deposit_amount DECIMAL(18,2) NULL,
    unit_status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE',
    availability_date DATE NULL,
    photo_summary LONGTEXT NULL,
    document_summary LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_property_units_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_property_units_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_property_units_building FOREIGN KEY (building_id) REFERENCES property_buildings(id),
    CONSTRAINT fk_property_units_floor FOREIGN KEY (floor_id) REFERENCES property_floors(id),
    CONSTRAINT uk_property_units_property_code UNIQUE (property_id, unit_code)
);

CREATE TABLE leasing_leads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lead_code VARCHAR(80) NOT NULL,
    lead_source VARCHAR(50) NOT NULL,
    lead_status VARCHAR(40) NOT NULL DEFAULT 'NEW',
    prospect_name VARCHAR(180) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(180) NULL,
    assigned_leasing_agent_user_id BIGINT NULL,
    assigned_leasing_agent_name VARCHAR(180) NULL,
    requirement_summary TEXT NULL,
    property_id BIGINT NULL,
    unit_id BIGINT NULL,
    site_visit_at TIMESTAMP NULL,
    visit_feedback TEXT NULL,
    quotation_rent DECIMAL(18,2) NULL,
    quotation_deposit DECIMAL(18,2) NULL,
    quotation_maintenance_charges DECIMAL(18,2) NULL,
    quotation_other_charges DECIMAL(18,2) NULL,
    quotation_discount DECIMAL(18,2) NULL,
    quotation_notes TEXT NULL,
    quotation_sent_at TIMESTAMP NULL,
    application_received_at TIMESTAMP NULL,
    screening_notes TEXT NULL,
    lost_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_leasing_leads_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_leasing_leads_agent FOREIGN KEY (assigned_leasing_agent_user_id) REFERENCES users(id),
    CONSTRAINT fk_leasing_leads_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_leasing_leads_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_leasing_leads_company_code UNIQUE (company_id, lead_code)
);

CREATE TABLE tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    tenant_code VARCHAR(80) NOT NULL,
    tenant_type VARCHAR(40) NOT NULL,
    first_name VARCHAR(120) NULL,
    last_name VARCHAR(120) NULL,
    company_name VARCHAR(200) NULL,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(180) NULL,
    alternate_phone VARCHAR(30) NULL,
    date_of_birth_or_registration DATE NULL,
    id_proof_type VARCHAR(80) NULL,
    id_proof_number VARCHAR(120) NULL,
    tax_number VARCHAR(80) NULL,
    gst_number VARCHAR(80) NULL,
    emergency_contact VARCHAR(180) NULL,
    employer_details TEXT NULL,
    current_address TEXT NULL,
    permanent_address TEXT NULL,
    kyc_status VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED',
    blacklist_status VARCHAR(30) NOT NULL DEFAULT 'CLEAR',
    tenant_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    kyc_stage VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    id_proof_document_note LONGTEXT NULL,
    address_proof_document_note LONGTEXT NULL,
    financial_document_note LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_tenants_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_tenants_company_code UNIQUE (company_id, tenant_code)
);

CREATE TABLE rental_applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    application_code VARCHAR(80) NOT NULL,
    tenant_id BIGINT NULL,
    lead_id BIGINT NULL,
    unit_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    occupancy_type VARCHAR(40) NOT NULL,
    proposed_move_in_date DATE NULL,
    lease_term_months INT NULL,
    adult_occupants_count INT NULL,
    child_occupants_count INT NULL,
    pet_details TEXT NULL,
    occupancy_notes TEXT NULL,
    document_summary LONGTEXT NULL,
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    employment_verified BOOLEAN NOT NULL DEFAULT FALSE,
    income_verified BOOLEAN NOT NULL DEFAULT FALSE,
    reference_checked BOOLEAN NOT NULL DEFAULT FALSE,
    previous_landlord_checked BOOLEAN NOT NULL DEFAULT FALSE,
    company_approval_verified BOOLEAN NOT NULL DEFAULT FALSE,
    document_completeness_checked BOOLEAN NOT NULL DEFAULT FALSE,
    internal_blacklist_checked BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT NULL,
    application_status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    more_information_notes TEXT NULL,
    rejection_reason TEXT NULL,
    approved_at TIMESTAMP NULL,
    lease_draft_reference VARCHAR(120) NULL,
    lease_draft_generated_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_rental_applications_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_rental_applications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_rental_applications_lead FOREIGN KEY (lead_id) REFERENCES leasing_leads(id),
    CONSTRAINT fk_rental_applications_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_rental_applications_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT uk_rental_applications_company_code UNIQUE (company_id, application_code)
);

CREATE TABLE vendors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    vendor_code VARCHAR(80) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(160) NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(180) NULL,
    address TEXT NULL,
    service_category VARCHAR(120) NULL,
    tax_number VARCHAR(80) NULL,
    bank_details TEXT NULL,
    contract_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    insurance_details TEXT NULL,
    rating DECIMAL(3,1) NULL,
    vendor_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    assignment_stage VARCHAR(50) NOT NULL DEFAULT 'WORK_ORDER_REQUIRES_VENDOR',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_vendors_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_vendors_company_code UNIQUE (company_id, vendor_code)
);

CREATE TABLE owners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    owner_code VARCHAR(80) NOT NULL,
    owner_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(180) NULL,
    address TEXT NULL,
    tax_details TEXT NULL,
    bank_account_details TEXT NULL,
    ownership_percentage DECIMAL(5,2) NULL,
    payout_frequency VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',
    statement_preference VARCHAR(30) NOT NULL DEFAULT 'EMAIL',
    owner_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    statement_stage VARCHAR(50) NOT NULL DEFAULT 'RENT_COLLECTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_owners_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_owners_company_code UNIQUE (company_id, owner_code)
);

CREATE TABLE owner_properties (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    owner_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_owner_properties_owner FOREIGN KEY (owner_id) REFERENCES owners(id),
    CONSTRAINT fk_owner_properties_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT uk_owner_properties_owner_property UNIQUE (owner_id, property_id)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_password_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX idx_role_menu_access_menu_key ON role_menu_access(menu_key);
CREATE INDEX idx_user_menu_access_menu_key ON user_menu_access(menu_key);
CREATE INDEX idx_company_branches_company_id ON company_branches(company_id);
CREATE INDEX idx_properties_company_id ON properties(company_id);
CREATE INDEX idx_properties_branch_id ON properties(branch_id);
CREATE INDEX idx_property_buildings_company_id ON property_buildings(company_id);
CREATE INDEX idx_property_buildings_property_id ON property_buildings(property_id);
CREATE INDEX idx_property_floors_company_id ON property_floors(company_id);
CREATE INDEX idx_property_floors_property_id ON property_floors(property_id);
CREATE INDEX idx_property_floors_building_id ON property_floors(building_id);
CREATE INDEX idx_property_units_company_id ON property_units(company_id);
CREATE INDEX idx_property_units_property_id ON property_units(property_id);
CREATE INDEX idx_property_units_building_id ON property_units(building_id);
CREATE INDEX idx_property_units_floor_id ON property_units(floor_id);
CREATE INDEX idx_property_units_status ON property_units(unit_status);
CREATE INDEX idx_leasing_leads_company_id ON leasing_leads(company_id);
CREATE INDEX idx_leasing_leads_status ON leasing_leads(lead_status);
CREATE INDEX idx_rental_applications_company_id ON rental_applications(company_id);
CREATE INDEX idx_rental_applications_status ON rental_applications(application_status);
CREATE INDEX idx_rental_applications_unit_id ON rental_applications(unit_id);
CREATE INDEX idx_tenants_company_id ON tenants(company_id);
CREATE INDEX idx_tenants_status ON tenants(tenant_status);
CREATE INDEX idx_vendors_company_id ON vendors(company_id);
CREATE INDEX idx_vendors_status ON vendors(vendor_status);
CREATE INDEX idx_owners_company_id ON owners(company_id);
CREATE INDEX idx_owners_status ON owners(owner_status);
CREATE INDEX idx_owner_properties_owner_id ON owner_properties(owner_id);
CREATE INDEX idx_owner_properties_property_id ON owner_properties(property_id);

INSERT INTO companies (
    company_name,
    company_code,
    email,
    phone,
    address,
    city,
    state,
    country,
    postal_code,
    gst_number,
    tax_number,
    is_default,
    status
) VALUES (
    'Default Company',
    'DEFAULT',
    'admin@pms.local',
    NULL,
    'Corporate Office',
    'Bengaluru',
    'Karnataka',
    'India',
    '560001',
    NULL,
    NULL,
    TRUE,
    'ACTIVE'
);

INSERT INTO roles (role_name, description, is_default, status) VALUES
('ADMIN', 'System administrator role', FALSE, 'ACTIVE'),
('SUPER_ADMIN', 'Global platform oversight role', FALSE, 'ACTIVE'),
('COMPANY_ADMIN', 'Company-level administration and setup', FALSE, 'ACTIVE'),
('PROPERTY_MANAGER', 'Property operations and occupancy oversight', FALSE, 'ACTIVE'),
('LEASING_AGENT', 'Leasing pipeline and unit conversion role', FALSE, 'ACTIVE'),
('FINANCE_USER', 'Billing, collections, payables, and statements role', FALSE, 'ACTIVE'),
('MAINTENANCE_MANAGER', 'Maintenance planning and work-order control role', FALSE, 'ACTIVE'),
('TECHNICIAN', 'Execution role for maintenance and field work', FALSE, 'ACTIVE'),
('VENDOR_USER', 'External vendor self-service role', FALSE, 'ACTIVE'),
('TENANT', 'Tenant self-service and communication role', TRUE, 'ACTIVE'),
('OWNER', 'Owner or landlord statement access role', FALSE, 'ACTIVE'),
('AUDITOR', 'Read-oriented compliance and audit role', FALSE, 'ACTIVE');

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'users'
    UNION ALL SELECT 'roles'
    UNION ALL SELECT 'companies'
    UNION ALL SELECT 'branches'
    UNION ALL SELECT 'properties'
    UNION ALL SELECT 'buildings'
    UNION ALL SELECT 'floors'
    UNION ALL SELECT 'leads'
    UNION ALL SELECT 'applications'
    UNION ALL SELECT 'units'
    UNION ALL SELECT 'tenants'
    UNION ALL SELECT 'vendors'
    UNION ALL SELECT 'owners'
) seeded
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN');

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'properties'
    UNION ALL SELECT 'buildings'
    UNION ALL SELECT 'floors'
    UNION ALL SELECT 'leads'
    UNION ALL SELECT 'applications'
    UNION ALL SELECT 'units'
    UNION ALL SELECT 'tenants'
    UNION ALL SELECT 'owners'
) seeded
WHERE UPPER(r.role_name) = 'PROPERTY_MANAGER';

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'properties'
    UNION ALL SELECT 'buildings'
    UNION ALL SELECT 'floors'
    UNION ALL SELECT 'leads'
    UNION ALL SELECT 'applications'
    UNION ALL SELECT 'units'
    UNION ALL SELECT 'tenants'
) seeded
WHERE UPPER(r.role_name) = 'LEASING_AGENT';

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'vendors'
    UNION ALL SELECT 'owners'
    UNION ALL SELECT 'tenants'
    UNION ALL SELECT 'units'
    UNION ALL SELECT 'properties'
) seeded
WHERE UPPER(r.role_name) = 'FINANCE_USER';

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'properties'
    UNION ALL SELECT 'buildings'
    UNION ALL SELECT 'floors'
    UNION ALL SELECT 'units'
    UNION ALL SELECT 'vendors'
) seeded
WHERE UPPER(r.role_name) IN ('MAINTENANCE_MANAGER', 'TECHNICIAN');

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'vendors'
) seeded
WHERE UPPER(r.role_name) = 'VENDOR_USER';

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'tenants'
) seeded
WHERE UPPER(r.role_name) = 'TENANT';

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'owners'
    UNION ALL SELECT 'properties'
    UNION ALL SELECT 'buildings'
    UNION ALL SELECT 'floors'
) seeded
WHERE UPPER(r.role_name) = 'OWNER';

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, seeded.menu_key
FROM roles r
JOIN (
    SELECT 'dashboard' AS menu_key
    UNION ALL SELECT 'reports'
    UNION ALL SELECT 'properties'
    UNION ALL SELECT 'buildings'
    UNION ALL SELECT 'floors'
    UNION ALL SELECT 'units'
    UNION ALL SELECT 'tenants'
    UNION ALL SELECT 'vendors'
    UNION ALL SELECT 'owners'
) seeded
WHERE UPPER(r.role_name) = 'AUDITOR';
