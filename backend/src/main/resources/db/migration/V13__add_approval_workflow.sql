CREATE TABLE approval_workflow_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    transaction_type VARCHAR(80) NOT NULL,
    level_no INT NOT NULL,
    approver_role_id BIGINT NOT NULL,
    min_amount DECIMAL(18,2) NULL,
    max_amount DECIMAL(18,2) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_approval_configs_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_approval_configs_role FOREIGN KEY (approver_role_id) REFERENCES roles(id),
    CONSTRAINT uk_approval_config_level UNIQUE (company_id, transaction_type, level_no, approver_role_id)
);

CREATE TABLE approval_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    transaction_type VARCHAR(80) NOT NULL,
    entity_id BIGINT NOT NULL,
    reference_number VARCHAR(120) NOT NULL,
    amount DECIMAL(18,2) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    current_level INT NOT NULL DEFAULT 1,
    requested_by BIGINT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    requester_remarks TEXT NULL,
    final_remarks TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_approval_requests_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_approval_requests_user FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT uk_approval_request_entity UNIQUE (company_id, transaction_type, entity_id)
);

CREATE TABLE approval_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    approval_request_id BIGINT NOT NULL,
    level_no INT NOT NULL,
    action VARCHAR(30) NOT NULL,
    approver_user_id BIGINT NULL,
    approver_role_id BIGINT NULL,
    remarks TEXT NULL,
    action_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_approval_actions_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_actions_user FOREIGN KEY (approver_user_id) REFERENCES users(id),
    CONSTRAINT fk_approval_actions_role FOREIGN KEY (approver_role_id) REFERENCES roles(id)
);

CREATE INDEX idx_approval_configs_company_type ON approval_workflow_configs(company_id, transaction_type);
CREATE INDEX idx_approval_requests_company_status ON approval_requests(company_id, status);
CREATE INDEX idx_approval_requests_type_entity ON approval_requests(transaction_type, entity_id);
CREATE INDEX idx_approval_actions_request ON approval_actions(approval_request_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'approvals'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'FINANCE_USER', 'MAINTENANCE_MANAGER', 'FACILITY_MANAGER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'approvals'
  );
