CREATE TABLE property_assets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    asset_code VARCHAR(80) NOT NULL,
    asset_name VARCHAR(160) NOT NULL,
    asset_category VARCHAR(80) NOT NULL,
    property_id BIGINT NOT NULL,
    building_id BIGINT NULL,
    unit_id BIGINT NULL,
    serial_number VARCHAR(120) NULL,
    manufacturer VARCHAR(120) NULL,
    model_number VARCHAR(120) NULL,
    purchase_date DATE NULL,
    purchase_cost DECIMAL(18,2) NULL,
    installation_date DATE NULL,
    condition_status VARCHAR(60) NOT NULL DEFAULT 'GOOD',
    warranty_provider VARCHAR(160) NULL,
    warranty_start_date DATE NULL,
    warranty_end_date DATE NULL,
    warranty_terms TEXT NULL,
    maintenance_frequency VARCHAR(60) NULL,
    next_maintenance_date DATE NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_property_assets_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_property_assets_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_property_assets_building FOREIGN KEY (building_id) REFERENCES property_buildings(id),
    CONSTRAINT fk_property_assets_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_property_assets_company_code UNIQUE (company_id, asset_code)
);

CREATE TABLE asset_maintenance_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    schedule_number VARCHAR(80) NOT NULL,
    asset_id BIGINT NOT NULL,
    maintenance_type VARCHAR(80) NOT NULL,
    frequency VARCHAR(60) NOT NULL,
    planned_date DATE NOT NULL,
    assigned_vendor_id BIGINT NULL,
    estimated_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
    priority VARCHAR(40) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(40) NOT NULL DEFAULT 'SCHEDULED',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_asset_schedules_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_asset_schedules_asset FOREIGN KEY (asset_id) REFERENCES property_assets(id),
    CONSTRAINT fk_asset_schedules_vendor FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id),
    CONSTRAINT uk_asset_schedules_company_number UNIQUE (company_id, schedule_number)
);

CREATE TABLE asset_service_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    service_number VARCHAR(80) NOT NULL,
    asset_id BIGINT NOT NULL,
    maintenance_schedule_id BIGINT NULL,
    service_date DATE NOT NULL,
    service_type VARCHAR(80) NOT NULL,
    vendor_id BIGINT NULL,
    technician_name VARCHAR(160) NULL,
    condition_before VARCHAR(60) NULL,
    condition_after VARCHAR(60) NOT NULL,
    work_performed TEXT NOT NULL,
    parts_replaced TEXT NULL,
    service_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
    next_service_date DATE NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_asset_history_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_asset_history_asset FOREIGN KEY (asset_id) REFERENCES property_assets(id),
    CONSTRAINT fk_asset_history_schedule FOREIGN KEY (maintenance_schedule_id) REFERENCES asset_maintenance_schedules(id),
    CONSTRAINT fk_asset_history_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT uk_asset_history_company_number UNIQUE (company_id, service_number)
);

CREATE INDEX idx_property_assets_company_id ON property_assets(company_id);
CREATE INDEX idx_property_assets_property_id ON property_assets(property_id);
CREATE INDEX idx_property_assets_category ON property_assets(asset_category);
CREATE INDEX idx_property_assets_condition ON property_assets(condition_status);
CREATE INDEX idx_asset_schedules_company_id ON asset_maintenance_schedules(company_id);
CREATE INDEX idx_asset_schedules_asset_id ON asset_maintenance_schedules(asset_id);
CREATE INDEX idx_asset_schedules_planned_date ON asset_maintenance_schedules(planned_date);
CREATE INDEX idx_asset_history_company_id ON asset_service_history(company_id);
CREATE INDEX idx_asset_history_asset_id ON asset_service_history(asset_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'assets'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'assets'
  );
