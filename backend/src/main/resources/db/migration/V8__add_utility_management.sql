CREATE TABLE utility_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    type_code VARCHAR(80) NOT NULL,
    type_name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    billing_method VARCHAR(40) NOT NULL,
    unit_of_measure VARCHAR(40) NULL,
    default_rate DECIMAL(18,4) NOT NULL DEFAULT 0,
    fixed_charge DECIMAL(18,2) NOT NULL DEFAULT 0,
    common_area BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_utility_types_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uk_utility_types_company_code UNIQUE (company_id, type_code)
);

CREATE TABLE meter_readings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    reading_number VARCHAR(80) NOT NULL,
    utility_type_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    tenant_id BIGINT NULL,
    meter_number VARCHAR(100) NULL,
    reading_date DATE NOT NULL,
    previous_reading DECIMAL(18,4) NOT NULL DEFAULT 0,
    current_reading DECIMAL(18,4) NOT NULL DEFAULT 0,
    consumption DECIMAL(18,4) NOT NULL DEFAULT 0,
    common_area BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(40) NOT NULL DEFAULT 'RECORDED',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_meter_readings_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_meter_readings_type FOREIGN KEY (utility_type_id) REFERENCES utility_types(id),
    CONSTRAINT fk_meter_readings_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_meter_readings_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_meter_readings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_meter_readings_company_number UNIQUE (company_id, reading_number)
);

CREATE TABLE utility_bills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    bill_number VARCHAR(80) NOT NULL,
    utility_type_id BIGINT NOT NULL,
    meter_reading_id BIGINT NULL,
    tenant_id BIGINT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    billing_method VARCHAR(40) NOT NULL,
    consumption DECIMAL(18,4) NOT NULL DEFAULT 0,
    rate DECIMAL(18,4) NOT NULL DEFAULT 0,
    fixed_charge DECIMAL(18,2) NOT NULL DEFAULT 0,
    usage_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    common_area_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    due_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_utility_bills_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_utility_bills_type FOREIGN KEY (utility_type_id) REFERENCES utility_types(id),
    CONSTRAINT fk_utility_bills_reading FOREIGN KEY (meter_reading_id) REFERENCES meter_readings(id),
    CONSTRAINT fk_utility_bills_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_utility_bills_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_utility_bills_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_utility_bills_company_number UNIQUE (company_id, bill_number)
);

CREATE INDEX idx_utility_types_company_id ON utility_types(company_id);
CREATE INDEX idx_meter_readings_company_id ON meter_readings(company_id);
CREATE INDEX idx_meter_readings_property_id ON meter_readings(property_id);
CREATE INDEX idx_meter_readings_utility_type_id ON meter_readings(utility_type_id);
CREATE INDEX idx_utility_bills_company_id ON utility_bills(company_id);
CREATE INDEX idx_utility_bills_tenant_id ON utility_bills(tenant_id);
CREATE INDEX idx_utility_bills_status ON utility_bills(status);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'utilities'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'FINANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'utilities'
  );
