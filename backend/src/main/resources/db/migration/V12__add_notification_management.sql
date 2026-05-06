CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    recipient_user_id BIGINT NULL,
    recipient_name VARCHAR(200) NULL,
    recipient_email VARCHAR(255) NULL,
    recipient_phone VARCHAR(40) NULL,
    notification_type VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(80) NULL,
    entity_id BIGINT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_notifications_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (recipient_user_id) REFERENCES users(id)
);

CREATE TABLE notification_deliveries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    notification_id BIGINT NOT NULL,
    channel VARCHAR(30) NOT NULL,
    destination VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL,
    provider_message TEXT NULL,
    attempted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_notification_deliveries_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_company_created ON notifications(company_id, created_at);
CREATE INDEX idx_notifications_company_type ON notifications(company_id, notification_type);
CREATE INDEX idx_notifications_user_read ON notifications(recipient_user_id, read_at);
CREATE INDEX idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_channel ON notification_deliveries(channel);

INSERT INTO role_menu_access (role_id, menu_key)
SELECT r.id, 'notifications'
FROM roles r
WHERE UPPER(r.role_name) IN ('ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'LEASING_AGENT', 'FINANCE_USER', 'MAINTENANCE_MANAGER', 'FACILITY_MANAGER', 'AUDITOR')
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_access existing
      WHERE existing.role_id = r.id AND existing.menu_key = 'notifications'
  );
