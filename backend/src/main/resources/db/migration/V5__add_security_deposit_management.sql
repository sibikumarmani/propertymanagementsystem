CREATE TABLE security_deposits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    lease_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    deposit_number VARCHAR(80) NOT NULL,
    deposit_amount DECIMAL(18,2) NOT NULL,
    collected_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    adjusted_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    refunded_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    refundable_amount DECIMAL(18,2) NOT NULL,
    deposit_invoice_id BIGINT NULL,
    deposit_receipt_id BIGINT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_security_deposits_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_security_deposits_lease FOREIGN KEY (lease_id) REFERENCES leases(id),
    CONSTRAINT fk_security_deposits_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_security_deposits_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_security_deposits_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_security_deposits_invoice FOREIGN KEY (deposit_invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_security_deposits_receipt FOREIGN KEY (deposit_receipt_id) REFERENCES receipts(id),
    CONSTRAINT uk_security_deposits_company_number UNIQUE (company_id, deposit_number),
    CONSTRAINT uk_security_deposits_lease UNIQUE (lease_id)
);

CREATE TABLE security_deposit_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    security_deposit_id BIGINT NOT NULL,
    transaction_type VARCHAR(40) NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    invoice_id BIGINT NULL,
    receipt_id BIGINT NULL,
    reference_number VARCHAR(120) NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_security_deposit_tx_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_security_deposit_tx_deposit FOREIGN KEY (security_deposit_id) REFERENCES security_deposits(id),
    CONSTRAINT fk_security_deposit_tx_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_security_deposit_tx_receipt FOREIGN KEY (receipt_id) REFERENCES receipts(id)
);

CREATE INDEX idx_security_deposits_company_id ON security_deposits(company_id);
CREATE INDEX idx_security_deposits_status ON security_deposits(status);
CREATE INDEX idx_security_deposit_tx_deposit_id ON security_deposit_transactions(security_deposit_id);
