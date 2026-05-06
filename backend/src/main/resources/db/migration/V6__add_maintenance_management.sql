CREATE TABLE maintenance_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    request_number VARCHAR(80) NOT NULL,
    tenant_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    category VARCHAR(120) NOT NULL,
    priority VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    assigned_vendor_id BIGINT NULL,
    assigned_user_id BIGINT NULL,
    estimated_cost DECIMAL(18,2) NULL,
    actual_cost DECIMAL(18,2) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    approval_status VARCHAR(40) NOT NULL DEFAULT 'NOT_REQUIRED',
    attachments_json LONGTEXT NULL,
    completion_remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_maintenance_requests_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_maintenance_requests_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_maintenance_requests_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_maintenance_requests_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_maintenance_requests_vendor FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_maintenance_requests_user FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    CONSTRAINT uk_maintenance_requests_company_number UNIQUE (company_id, request_number)
);

CREATE TABLE maintenance_work_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    work_order_number VARCHAR(80) NOT NULL,
    maintenance_request_id BIGINT NOT NULL,
    vendor_id BIGINT NULL,
    technician_user_id BIGINT NULL,
    materials_used TEXT NULL,
    labor_charges DECIMAL(18,2) NULL,
    vendor_invoice_document LONGTEXT NULL,
    completion_remarks TEXT NULL,
    approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_maintenance_work_orders_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_maintenance_work_orders_request FOREIGN KEY (maintenance_request_id) REFERENCES maintenance_requests(id),
    CONSTRAINT fk_maintenance_work_orders_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_maintenance_work_orders_user FOREIGN KEY (technician_user_id) REFERENCES users(id),
    CONSTRAINT uk_maintenance_work_orders_company_number UNIQUE (company_id, work_order_number)
);

CREATE TABLE preventive_maintenance_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    schedule_number VARCHAR(80) NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    asset_name VARCHAR(160) NOT NULL,
    maintenance_type VARCHAR(120) NOT NULL,
    recurrence_frequency VARCHAR(40) NOT NULL,
    next_due_date DATE NOT NULL,
    responsible_user_id BIGINT NULL,
    vendor_id BIGINT NULL,
    notify_before_days INT NOT NULL DEFAULT 3,
    completion_status VARCHAR(40) NOT NULL DEFAULT 'SCHEDULED',
    last_completed_date DATE NULL,
    completion_remarks TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_preventive_maintenance_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_preventive_maintenance_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_preventive_maintenance_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT fk_preventive_maintenance_user FOREIGN KEY (responsible_user_id) REFERENCES users(id),
    CONSTRAINT fk_preventive_maintenance_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT uk_preventive_maintenance_company_number UNIQUE (company_id, schedule_number)
);

CREATE INDEX idx_maintenance_requests_company_id ON maintenance_requests(company_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_requests_unit_id ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_work_orders_company_id ON maintenance_work_orders(company_id);
CREATE INDEX idx_maintenance_work_orders_request_id ON maintenance_work_orders(maintenance_request_id);
CREATE INDEX idx_maintenance_work_orders_status ON maintenance_work_orders(status);
CREATE INDEX idx_preventive_maintenance_company_id ON preventive_maintenance_schedules(company_id);
CREATE INDEX idx_preventive_maintenance_due_date ON preventive_maintenance_schedules(next_due_date);
CREATE INDEX idx_preventive_maintenance_status ON preventive_maintenance_schedules(status);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'maintenance'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_MANAGER', 'FACILITY_MANAGER')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'maintenance'
  );
