CREATE TABLE accounting_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    entry_date DATE NOT NULL,
    account_type VARCHAR(80) NOT NULL,
    party_type VARCHAR(40) NULL,
    party_id BIGINT NULL,
    property_id BIGINT NULL,
    unit_id BIGINT NULL,
    source_type VARCHAR(80) NOT NULL,
    source_id BIGINT NOT NULL,
    source_reference VARCHAR(120) NOT NULL,
    description TEXT NULL,
    debit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_accounting_entries_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_accounting_entries_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_accounting_entries_unit FOREIGN KEY (unit_id) REFERENCES property_units(id)
);

CREATE INDEX idx_accounting_company_date ON accounting_entries(company_id, entry_date);
CREATE INDEX idx_accounting_account_type ON accounting_entries(company_id, account_type);
CREATE INDEX idx_accounting_party ON accounting_entries(company_id, party_type, party_id);
CREATE INDEX idx_accounting_property ON accounting_entries(company_id, property_id);
CREATE INDEX idx_accounting_source ON accounting_entries(company_id, source_type, source_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'accounting'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'FINANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'accounting'
  );
