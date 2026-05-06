DELETE FROM user_menu_access WHERE menu_key IN ('leads', 'applications');
DELETE FROM role_menu_access WHERE menu_key IN ('leads', 'applications');

DROP TABLE IF EXISTS rental_applications;
DROP TABLE IF EXISTS leasing_leads;
