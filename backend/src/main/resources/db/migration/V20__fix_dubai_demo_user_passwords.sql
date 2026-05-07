UPDATE users
SET password_hash = '$2y$10$PTgY3CtEl7ntPv5TSNRt4OOrCRW3Bm9Sof/g0qEz/PVpWwG5CrVB.',
    email_verified = TRUE,
    status = 'ACTIVE'
WHERE user_code IN ('DXB-ADMIN', 'DXB-PM', 'DXB-FIN', 'DXB-TENANT-RES', 'DXB-OWNER');
