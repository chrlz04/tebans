USE tebans_db;

-- ─── Create Login record for admin ────────────────────────
INSERT INTO Login (Login_ID, User_name, Password)
VALUES (
  'admin-login-001',
  'admin',
  -- bcrypt hash of 'Admin@1234'
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.'
);

-- ─── Create User record for admin ─────────────────────────
INSERT INTO User (
  User_ID, First_Name, Last_Name,
  Contact_No, User_Type,
  Account_Status, Login_ID
)
VALUES (
  'admin-user-001',
  'System', 'Admin',
  '09000000000',
  'admin',
  'Active',
  'admin-login-001'
);

-- ─── Create Admin record ──────────────────────────────────
INSERT INTO Admin (Admin_ID, Clearance_Level, Login_ID, User_ID)
VALUES (
  'admin-001',
  1,
  'admin-login-001',
  'admin-user-001'
);
-- System Settings
INSERT IGNORE INTO System_Settings (Setting_Key, Setting_Value) VALUES
('SMS_API_URL', 'https://api.httpsms.com/v1/messages/send'),
('SMS_API_KEY', ''),
('SMS_PHONE_NUMBER', '');
