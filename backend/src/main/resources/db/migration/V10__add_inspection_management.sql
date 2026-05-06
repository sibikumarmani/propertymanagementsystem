CREATE TABLE property_inspections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    inspection_number VARCHAR(80) NOT NULL,
    inspection_type VARCHAR(60) NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    lease_id BIGINT NULL,
    tenant_id BIGINT NULL,
    scheduled_date DATE NULL,
    inspection_date DATE NOT NULL,
    inspector_name VARCHAR(160) NULL,
    overall_condition VARCHAR(60) NOT NULL DEFAULT 'GOOD',
    damage_status VARCHAR(60) NOT NULL DEFAULT 'NONE',
    estimated_repair_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
    checklist_json LONGTEXT NULL,
    photo_attachments_json LONGTEXT NULL,
    damage_notes TEXT NULL,
    tenant_acknowledgement_status VARCHAR(60) NOT NULL DEFAULT 'NOT_REQUIRED',
    tenant_acknowledged_by VARCHAR(160) NULL,
    tenant_acknowledged_at TIMESTAMP NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_property_inspections_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_property_inspections_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_property_inspections_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_property_inspections_lease FOREIGN KEY (lease_id) REFERENCES leases(id),
    CONSTRAINT fk_property_inspections_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_property_inspections_company_number UNIQUE (company_id, inspection_number)
);

CREATE INDEX idx_property_inspections_company_id ON property_inspections(company_id);
CREATE INDEX idx_property_inspections_property_id ON property_inspections(property_id);
CREATE INDEX idx_property_inspections_unit_id ON property_inspections(unit_id);
CREATE INDEX idx_property_inspections_type ON property_inspections(inspection_type);
CREATE INDEX idx_property_inspections_status ON property_inspections(status);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'inspections'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'inspections'
  );
