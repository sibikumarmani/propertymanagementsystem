CREATE TABLE rent_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lease_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    schedule_number VARCHAR(80) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    rent_amount DECIMAL(18,2) NOT NULL,
    late_fee_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    due_amount DECIMAL(18,2) NOT NULL,
    invoice_id BIGINT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_rent_schedules_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_rent_schedules_lease FOREIGN KEY (lease_id) REFERENCES leases(id),
    CONSTRAINT fk_rent_schedules_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_rent_schedules_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_rent_schedules_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_rent_schedules_company_number UNIQUE (company_id, schedule_number),
    CONSTRAINT uk_rent_schedules_lease_period UNIQUE (lease_id, billing_period_start, billing_period_end)
);

CREATE TABLE invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    invoice_number VARCHAR(80) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL,
    lease_id BIGINT NULL,
    rent_schedule_id BIGINT NULL,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NULL,
    unit_id BIGINT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_amount DECIMAL(18,2) NOT NULL,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    late_fee_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    due_amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    description TEXT NULL,
    pdf_document LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_invoices_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_invoices_lease FOREIGN KEY (lease_id) REFERENCES leases(id),
    CONSTRAINT fk_invoices_schedule FOREIGN KEY (rent_schedule_id) REFERENCES rent_schedules(id),
    CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_invoices_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_invoices_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_invoices_company_number UNIQUE (company_id, invoice_number)
);

ALTER TABLE rent_schedules
    ADD CONSTRAINT fk_rent_schedules_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id);

CREATE TABLE receipts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    receipt_number VARCHAR(80) NOT NULL,
    invoice_id BIGINT NULL,
    tenant_id BIGINT NOT NULL,
    receipt_date DATE NOT NULL,
    payment_mode VARCHAR(60) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    advance_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    reference_number VARCHAR(120) NULL,
    remarks TEXT NULL,
    pdf_document LONGTEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_receipts_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_receipts_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_receipts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_receipts_company_number UNIQUE (company_id, receipt_number)
);

CREATE INDEX idx_rent_schedules_company_id ON rent_schedules(company_id);
CREATE INDEX idx_rent_schedules_lease_id ON rent_schedules(lease_id);
CREATE INDEX idx_rent_schedules_status ON rent_schedules(status);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_receipts_company_id ON receipts(company_id);
CREATE INDEX idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX idx_receipts_tenant_id ON receipts(tenant_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'rent-billing'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'FINANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'rent-billing'
  );
