UPDATE users
SET password_hash = '$2a$10$Kwu8tGuJXAMAqNmh58V2.uoAubXM7ZUUsOZRa0nKgXb07XAX2yVm.',
    email_verified = TRUE,
    status = 'ACTIVE'
WHERE user_code IN ('DEMO-ADMIN', 'DEMO-MANAGER', 'DEMO-FINANCE', 'DEMO-TENANT', 'DEMO-OWNER');
