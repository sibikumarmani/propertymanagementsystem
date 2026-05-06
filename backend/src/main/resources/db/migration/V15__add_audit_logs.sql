CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NULL,
    user_id BIGINT NULL,
    user_name VARCHAR(200) NULL,
    action VARCHAR(120) NOT NULL,
    screen VARCHAR(120) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id BIGINT NULL,
    old_value LONGTEXT NULL,
    new_value LONGTEXT NULL,
    ip_address VARCHAR(80) NULL,
    action_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_audit_logs_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_company_time ON audit_logs(company_id, action_at);
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, action_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'audit-logs'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'audit-logs'
  );
