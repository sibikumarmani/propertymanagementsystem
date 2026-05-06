CREATE TABLE leases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lease_number VARCHAR(80) NOT NULL,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    rent_amount DECIMAL(18,2) NOT NULL,
    security_deposit_amount DECIMAL(18,2) NOT NULL,
    billing_cycle VARCHAR(40) NOT NULL,
    due_day INT NOT NULL,
    grace_period_days INT NULL,
    late_fee_rule VARCHAR(255) NULL,
    agreement_document LONGTEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    activation_date DATE NULL,
    termination_date DATE NULL,
    termination_reason TEXT NULL,
    final_settlement_amount DECIMAL(18,2) NULL,
    security_deposit_refund_amount DECIMAL(18,2) NULL,
    termination_document LONGTEXT NULL,
    renewed_from_lease_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_leases_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_leases_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_leases_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_leases_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_leases_renewed_from FOREIGN KEY (renewed_from_lease_id) REFERENCES leases(id),
    CONSTRAINT uk_leases_company_number UNIQUE (company_id, lease_number)
);

CREATE TABLE lease_renewals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lease_id BIGINT NOT NULL,
    renewal_number VARCHAR(80) NOT NULL,
    previous_start_date DATE NOT NULL,
    previous_end_date DATE NOT NULL,
    new_start_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    previous_rent_amount DECIMAL(18,2) NOT NULL,
    new_rent_amount DECIMAL(18,2) NOT NULL,
    security_deposit_amount DECIMAL(18,2) NULL,
    agreement_document LONGTEXT NULL,
    approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
    renewal_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_lease_renewals_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_lease_renewals_lease FOREIGN KEY (lease_id) REFERENCES leases(id),
    CONSTRAINT uk_lease_renewals_company_number UNIQUE (company_id, renewal_number)
);

CREATE INDEX idx_leases_company_id ON leases(company_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_unit_id ON leases(unit_id);
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_lease_renewals_company_id ON lease_renewals(company_id);
CREATE INDEX idx_lease_renewals_lease_id ON lease_renewals(lease_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'leases'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'LEASING_AGENT', 'FINANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'leases'
  );
