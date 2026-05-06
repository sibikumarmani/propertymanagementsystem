CREATE TABLE purchase_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    request_number VARCHAR(80) NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    expense_type VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    estimated_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_purchase_requests_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_purchase_requests_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_purchase_requests_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_purchase_requests_company_number UNIQUE (company_id, request_number)
);

CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    purchase_order_number VARCHAR(80) NOT NULL,
    purchase_request_id BIGINT NULL,
    vendor_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NULL,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_purchase_orders_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_purchase_orders_request FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id),
    CONSTRAINT fk_purchase_orders_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_purchase_orders_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_purchase_orders_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_purchase_orders_company_number UNIQUE (company_id, purchase_order_number)
);

CREATE TABLE vendor_invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    invoice_number VARCHAR(80) NOT NULL,
    purchase_order_id BIGINT NULL,
    vendor_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NULL,
    invoice_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID',
    approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_vendor_invoices_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_vendor_invoices_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_vendor_invoices_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_vendor_invoices_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_vendor_invoices_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_vendor_invoices_company_number UNIQUE (company_id, invoice_number)
);

CREATE TABLE property_expenses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    expense_number VARCHAR(80) NOT NULL,
    vendor_invoice_id BIGINT NULL,
    vendor_id BIGINT NULL,
    property_id BIGINT NOT NULL,
    unit_id BIGINT NULL,
    expense_date DATE NOT NULL,
    expense_type VARCHAR(80) NOT NULL,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    description TEXT NULL,
    approval_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_APPROVAL',
    payment_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID',
    status VARCHAR(40) NOT NULL DEFAULT 'RECORDED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_property_expenses_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_property_expenses_invoice FOREIGN KEY (vendor_invoice_id) REFERENCES vendor_invoices(id),
    CONSTRAINT fk_property_expenses_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    CONSTRAINT fk_property_expenses_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_property_expenses_unit FOREIGN KEY (unit_id) REFERENCES property_units(id),
    CONSTRAINT uk_property_expenses_company_number UNIQUE (company_id, expense_number)
);

CREATE INDEX idx_purchase_requests_company_id ON purchase_requests(company_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_purchase_orders_company_id ON purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX idx_vendor_invoices_company_id ON vendor_invoices(company_id);
CREATE INDEX idx_vendor_invoices_payment_status ON vendor_invoices(payment_status);
CREATE INDEX idx_property_expenses_company_id ON property_expenses(company_id);
CREATE INDEX idx_property_expenses_property_id ON property_expenses(property_id);
CREATE INDEX idx_property_expenses_expense_type ON property_expenses(expense_type);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'purchase-expenses'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'FINANCE_USER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'purchase-expenses'
  );
