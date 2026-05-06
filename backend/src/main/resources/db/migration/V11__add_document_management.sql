CREATE TABLE documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    document_number VARCHAR(80) NOT NULL,
    document_title VARCHAR(200) NOT NULL,
    document_type VARCHAR(60) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    file_size BIGINT NULL,
    data_url LONGTEXT NOT NULL,
    property_id BIGINT NULL,
    unit_id BIGINT NULL,
    tenant_id BIGINT NULL,
    lease_id BIGINT NULL,
    vendor_id BIGINT NULL,
    invoice_id BIGINT NULL,
    expiry_date DATE NULL,
    version_number INT NOT NULL DEFAULT 1,
    previous_document_id BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    access_level VARCHAR(30) NOT NULL DEFAULT 'INTERNAL',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_documents_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_documents_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_documents_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_documents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_documents_lease FOREIGN KEY (lease_id) REFERENCES leases(id),
    CONSTRAINT fk_documents_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_documents_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    CONSTRAINT fk_documents_previous FOREIGN KEY (previous_document_id) REFERENCES documents(id),
    CONSTRAINT uk_documents_company_number_version UNIQUE (company_id, document_number, version_number)
);

CREATE INDEX idx_documents_company_type ON documents(company_id, document_type);
CREATE INDEX idx_documents_company_expiry ON documents(company_id, expiry_date);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_unit ON documents(unit_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_lease ON documents(lease_id);
CREATE INDEX idx_documents_vendor ON documents(vendor_id);
CREATE INDEX idx_documents_invoice ON documents(invoice_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'documents'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'LEASING_AGENT', 'FINANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'documents'
  );
