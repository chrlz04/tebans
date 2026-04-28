-- =============================================================
-- TEBANS Database Seed Data
-- Generated: 2026-04-28
-- Run schema.sql first before executing this file.
-- =============================================================

USE `tebans_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- SEED: login
-- Passwords are bcrypt hashed.
-- Plain-text equivalents (for testing):
--   admin              → password: admin123
--   cashier            → password: test123
--   cashier-kabugnayan → password: test123
--   consumer           → password: test123
--   lgomez             → password: test123
--   daryl              → password: test123
--   charles            → password: test123
--   meterreader        → password: test123
--   dry                → password: test123
--   Krisha             → password: Krisha123
--   jdcruz             → password: test123
--   avillanueva        → password: test123
--   pramos             → password: test123  (inactive consumer)
-- =============================================================
INSERT INTO `login` (`Login_ID`, `User_name`, `Password`, `Must_Change_Password`) VALUES
  ('admin-login-001',      'admin',              '$2b$10$u4hPHpBA1frWQ0HfjFTiMugZHevfpKr0acxrnLy4tszwpZCrInfX6', 0),
  ('login-cashier-001',    'cashier',            '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-cashier-002',    'cashier-kabugnayan', '$2b$10$ma8tSACCGMMPyL2iisyTneHcAJcom4s3tg1yercQsHGWFLSvmdsUq', 0),
  ('login-consumer-001',   'consumer',           '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-consumer-002',   'lgomez',             '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-consumer-005',   'daryl',              '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-consumer-006',   'charles',            '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-mr-001',         'meterreader',        '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-mr-002',         'dry',                '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-mr-003',         'Krisha',             '$2b$10$69iT.KWnM.wEI36dnmZzCeRA84OxhP1UDZBMvOK0poVUkMkfYxx3a', 0),
  ('login-consumer-007',   'jdcruz',             '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-consumer-008',   'avillanueva',        '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0),
  ('login-consumer-003',   'pramos',             '$2b$10$IFt3l0FVekMFK18NRF22M.D6mOzR98NxmNHkeLj/DM9Nar4G/NbtW', 0);

-- =============================================================
-- SEED: area
-- =============================================================
INSERT INTO `area` (`Area_ID`, `Name`) VALUES
  ('area-001', 'Centro'),
  ('area-002', 'Kabugnayan'),
  ('area-003', 'Ukay'),
  ('area-004', 'Molave');

-- =============================================================
-- SEED: user
-- user-mr-002 corrected to meter_reader (was incorrectly 'cashier').
-- user-consumer-003 linked to login for testing inactive account flow.
-- =============================================================
INSERT INTO `user` (`User_ID`, `First_Name`, `Last_Name`, `Contact_No`, `User_Type`, `Account_Status`, `Registration_Date`, `Login_ID`) VALUES
  ('admin-user-001',    'Mary',    'Infanso',    '09000000001',  'admin',        'Active',   '2026-04-01 22:18:23', 'admin-login-001'),
  ('user-cashier-001',  'Maria',   'Santos',     '09281234567',  'cashier',      'Active',   '2026-04-01 21:22:34', 'login-cashier-001'),
  ('user-cashier-002',  'cashier', 'kabugnayan', '0900000000h',  'cashier',      'Active',   '2026-04-15 05:20:51', 'login-cashier-002'),
  ('user-consumer-001', 'Ricardo', 'Reyes',      '09167928436',  'consumer',     'Active',   '2026-03-30 21:22:34', 'login-consumer-001'),
  ('user-consumer-002', 'Lorna',   'Gomez',      '09461234567',  'consumer',     'Active',   '2026-03-30 21:22:34', 'login-consumer-002'),
  ('user-consumer-003', 'Pedro',   'Ramos',      '09571234567',  'consumer',     'Inactive', '2026-03-30 21:22:34', 'login-consumer-003'),
  ('user-consumer-004', 'Nelia',   'Flores',     '09681234567',  'consumer',     'Active',   '2026-03-30 21:22:34', NULL),
  ('user-consumer-005', 'Daryl',   'Valdez',     '09351234567',  'consumer',     'Active',   '2026-04-21 10:04:10', 'login-consumer-005'),
  ('user-consumer-006', 'Charles', 'Carcallas',  '09167928436',  'consumer',     'Active',   '2026-04-24 10:56:24', 'login-consumer-006'),
  ('user-mr-001',       'Juan',    'DelaCruz',   '09171234567',  'meter_reader', 'Active',   '2026-04-01 21:22:34', 'login-mr-001'),
  ('user-mr-002',       'Daryl',   'Maglinte',   '09222222222',  'meter_reader', 'Active',   '2026-04-07 12:13:15', 'login-mr-002'),
  ('user-mr-003',       'Krisha',  'Basio',      '09000000000',  'meter_reader', 'Active',   '2026-04-25 17:00:31', 'login-mr-003'),
  ('user-consumer-007', 'Jose',    'dela Cruz',  '09211234567',  'consumer',     'Active',   '2026-04-26 08:00:00', 'login-consumer-007'),
  ('user-consumer-008', 'Ana',     'Villanueva', '09221234567',  'consumer',     'Active',   '2026-04-26 08:05:00', 'login-consumer-008');

-- =============================================================
-- SEED: admin
-- =============================================================
INSERT INTO `admin` (`Admin_ID`, `Clearance_Level`, `User_ID`) VALUES
  ('admin-001', 1, 'admin-user-001');

-- =============================================================
-- SEED: cashier
-- cashier-001 → area-001 (Centro)
-- cashier-002 → area-002 (Kabugnayan)
-- =============================================================
INSERT INTO `cashier` (`Cashier_ID`, `Assigned_Area_ID`, `User_ID`) VALUES
  ('cashier-001', 'area-001', 'user-cashier-001'),
  ('cashier-002', 'area-002', 'user-cashier-002');

-- =============================================================
-- SEED: meterreader
-- mr-001 → area-001 (Centro)
-- mr-002 → area-002 (Kabugnayan)
-- mr-003 → area-001 (Centro)
-- =============================================================
INSERT INTO `meterreader` (`MeterReader_ID`, `Assigned_Area_ID`, `User_ID`) VALUES
  ('mr-001', 'area-001', 'user-mr-001'),
  ('mr-002', 'area-002', 'user-mr-002'),
  ('mr-003', 'area-001', 'user-mr-003');

-- =============================================================
-- SEED: consumer
-- consumer-002 assigned to area-001 (was NULL).
-- consumer-003 marked Inactive via user table (login: pramos).
-- =============================================================
INSERT INTO `consumer` (`Consumer_ID`, `Address`, `Province`, `Municipality`, `Barangay`, `Area_ID`, `Meter_Serial_No`, `User_ID`) VALUES
  ('consumer-001', 'Purok 3, Tubod, Clarin, Bohol',  'Bohol', 'Clarin', 'Tubod', 'area-001', 'MSN-2024-0001', 'user-consumer-001'),
  ('consumer-002', 'Purok 5, Tubod, Clarin, Bohol',  'Bohol', 'Clarin', 'Tubod', 'area-001', 'MSN-2024-0002', 'user-consumer-002'),
  ('consumer-003', 'Purok 1, Tubod, Clarin, Bohol',  'Bohol', 'Clarin', 'Tubod', 'area-002', 'MSN-2024-0003', 'user-consumer-003'),
  ('consumer-004', 'Purok 7, Tubod, Clarin, Bohol',  'Bohol', 'Clarin', 'Tubod', 'area-002', 'MSN-2024-0004', 'user-consumer-004'),
  ('consumer-005', 'Tubod, Clarin',                  'Bohol', 'Clarin', 'Tubod', 'area-001', '5437563485634', 'user-consumer-005'),
  ('consumer-006', '14, Tubod, Clarin, Bohol',       'Bohol', 'Clarin', 'Tubod', 'area-001', '534525245254',  'user-consumer-006'),
  ('consumer-007', 'Purok 2, Tubod, Clarin, Bohol',  'Bohol', 'Clarin', 'Tubod', 'area-001', 'MSN-2024-0007', 'user-consumer-007'),
  ('consumer-008', 'Purok 4, Tubod, Clarin, Bohol',  'Bohol', 'Clarin', 'Tubod', 'area-002', 'MSN-2024-0008', 'user-consumer-008');

-- =============================================================
-- SEED: meterreading
-- Covers March 2025 and April 2026 billing months.
-- consumer-007 and consumer-008 have no readings → available for
--   meter reader to record a new single reading.
-- All consumers are unread for May 2026 → use batch template.
-- =============================================================
INSERT INTO `meterreading` (`MeterReading_ID`, `Consumer_ID`, `MeterReader_ID`, `Previous_Reading`, `Current_Reading`, `Date_Recorded`, `Billing_Month`) VALUES
  -- March 2025 baseline readings
  ('mr-read-001', 'consumer-001', 'mr-001',  0.00,   5.00,  '2025-03-05', 'March 2025'),
  ('mr-read-002', 'consumer-002', 'mr-001',  0.00,   6.00,  '2025-03-05', 'March 2025'),
  ('mr-read-003', 'consumer-003', 'mr-001',  0.00,   7.00,  '2025-03-05', 'March 2025'),
  ('mr-read-004', 'consumer-004', 'mr-001',  0.00,   5.00,  '2025-03-05', 'March 2025'),
  -- April 2026 readings (area-001)
  ('mr-read-006', 'consumer-001', 'mr-001',  5.00,  12.00,  '2026-04-02', 'April 2026'),
  ('mr-read-009', 'consumer-006', 'mr-001',  0.00,  15.00,  '2026-04-24', 'April 2026'),
  ('mr-read-011', 'consumer-005', 'mr-003',  0.00,  45.20,  '2026-04-25', 'April 2026'),
  -- April 2026 readings (area-002) — for cashier-kabugnayan to process
  ('mr-read-012', 'consumer-003', 'mr-002',  7.00,  35.00,  '2026-04-26', 'April 2026'),
  ('mr-read-013', 'consumer-004', 'mr-002',  5.00,  28.00,  '2026-04-26', 'April 2026');

-- =============================================================
-- SEED: bill
-- Covers multiple payment statuses to test all cashier flows.
-- consumer-007 and consumer-008 have no bills → meter reader
--   must record their readings before bills can be paid.
-- =============================================================
INSERT INTO `bill` (`Bill_ID`, `Consumer_ID`, `MeterReading_ID`, `Amount`, `Due_Date`, `Payment_Status`, `Billing_Month`) VALUES
  -- March 2025
  ('bill-001', 'consumer-001', 'mr-read-001', 1856.75, '2025-03-25', 'Paid',   'March 2025'),
  ('bill-002', 'consumer-002', 'mr-read-002', 1598.40, '2025-03-25', 'Unpaid', 'March 2025'),
  ('bill-003', 'consumer-003', 'mr-read-003', 1024.00, '2025-03-25', 'Paid',   'March 2025'),
  ('bill-004', 'consumer-004', 'mr-read-004',    0.00, '2025-03-25', 'Unpaid', 'March 2025'),
  -- April 2026 (area-001)
  ('bill-005', 'consumer-001', 'mr-read-006',  180.00, '2026-04-27', 'Paid',   'April 2026'),
  ('bill-008', 'consumer-006', 'mr-read-009',  160.00, '2026-04-27', 'Unpaid', 'April 2026'),
  ('bill-010', 'consumer-005', 'mr-read-011',  800.50, '2026-04-27', 'Unpaid', 'April 2026'),
  -- April 2026 (area-002) — for cashier-kabugnayan to collect
  ('bill-011', 'consumer-003', 'mr-read-012',  560.00, '2026-04-27', 'Unpaid', 'April 2026'),
  ('bill-012', 'consumer-004', 'mr-read-013',  480.00, '2026-04-27', 'Unpaid', 'April 2026');

-- =============================================================
-- SEED: payment
-- =============================================================
INSERT INTO `payment` (`Payment_ID`, `Bill_ID`, `Cashier_ID`, `Consumer_ID`, `Amount_Paid`, `Date_Paid`, `Payment_Method`, `Receipt_Number`) VALUES
  ('pay-001', 'bill-001', 'cashier-001', 'consumer-001', 1856.75, '2025-03-18 09:30:00', 'Cash', 'REC-2025-0001'),
  ('pay-002', 'bill-003', 'cashier-001', 'consumer-003', 1024.00, '2025-03-20 14:15:00', 'Cash', 'REC-2025-0002'),
  ('pay-003', 'bill-005', 'cashier-001', 'consumer-001',  180.00, '2026-04-03 14:15:00', 'Cash', 'REC-2026-0003');

-- =============================================================
-- SEED: disconnectionrequest
-- dreq-001, dreq-002 → Executed  (historical)
-- dreq-003            → Pending   (meter reader can Execute/Cancel)
-- dreq-004            → Cancelled (shows cancelled status in UI)
-- =============================================================
INSERT INTO `disconnectionrequest` (`DisconnectionRequest_ID`, `Consumer_ID`, `MeterReader_ID`, `Reason_for_Disconnection`, `Scheduled_Date`, `Request_Status`, `Date_Requested`) VALUES
  ('dreq-001', 'consumer-007', 'mr-001', 'Unpaid bill for two consecutive months.',                        '2026-03-28', 'Executed',  '2026-03-30 21:22:34'),
  ('dreq-002', 'consumer-008', 'mr-001', 'Account flagged as Inactive with no meter usage.',               '2026-03-27', 'Executed',  '2026-03-30 21:22:34'),
  ('dreq-003', 'consumer-002', 'mr-001', 'Unpaid bill since March 2025. No payment after multiple notices.','2026-04-30', 'Pending',   '2026-04-26 09:00:00'),
  ('dreq-004', 'consumer-004', 'mr-002', 'Meter suspected tampered. Pending verification.',                 '2026-04-28', 'Cancelled', '2026-04-22 10:30:00');

-- =============================================================
-- SEED: notification
-- =============================================================
INSERT INTO `notification` (`Notification_ID`, `Consumer_ID`, `MeterReading_ID`, `DisconnectionRequest_ID`, `Alert_Type`, `Message_Content`, `Date_Sent`, `Reference_Type`, `Status`) VALUES
  ('notif-001', 'consumer-001', 'mr-read-001', NULL,       'Billing',       'Your bill for March 2025 amounting to ₱1,856.75 is due on March 25, 2025.',                  '2026-03-30 21:22:34', 'MeterReading',        'Sent'),
  ('notif-002', 'consumer-002', 'mr-read-002', NULL,       'Billing',       'Your bill for March 2025 amounting to ₱1,598.40 is due on March 25, 2025.',                  '2026-03-30 21:22:34', 'MeterReading',        'Sent'),
  ('notif-003', 'consumer-007', NULL,           'dreq-001', 'Disconnection', 'A disconnection has been scheduled on March 28, 2026 due to unpaid bills.',                  '2026-03-30 21:22:34', 'DisconnectionRequest', 'Sent'),
  ('notif-004', 'consumer-008', NULL,           'dreq-002', 'Disconnection', 'Your account has been disconnected on March 27, 2026. Please contact the office.',           '2026-03-30 21:22:34', 'DisconnectionRequest', 'Sent'),
  ('notif-005', 'consumer-002', NULL,           'dreq-003', 'Disconnection', 'A disconnection is scheduled on April 30, 2026 due to unpaid bills since March 2025.',       '2026-04-26 09:00:00', 'DisconnectionRequest', 'Pending'),
  ('notif-006', 'consumer-004', NULL,           'dreq-004', 'Disconnection', 'Your scheduled disconnection on April 28, 2026 has been cancelled. No further action needed.','2026-04-22 10:30:00', 'DisconnectionRequest', 'Pending');

-- =============================================================
-- SEED: system_settings
-- =============================================================
INSERT INTO `system_settings` (`Setting_Key`, `Setting_Value`, `Updated_At`) VALUES
  ('SMS_API_KEY',               'uk_EccluA-qPYqStmLWVYpfbWrBLFo8z5R9X0jeNJmWoalIEByEUQjOuUOMxJkLYkAZ', '2026-04-24 10:43:09'),
  ('SMS_API_URL',               'https://api.httpsms.com/v1/messages/send',                               '2026-04-24 10:43:09'),
  ('SMS_AUTO_MARK_SENT',        '1',                                                                       '2026-04-26 10:52:21'),
  ('SMS_BATCH_DELAY',           '2000',                                                                    '2026-04-26 10:52:21'),
  ('SMS_BATCH_SENDING_ENABLED', '1',                                                                       '2026-04-26 11:50:14'),
  ('SMS_BATCH_SIZE_LIMIT',      '500',                                                                     '2026-04-26 10:52:21'),
  ('SMS_CUSTOM_AUTH_HEADER',    '',                                                                        '2026-04-24 10:43:09'),
  ('SMS_CUSTOM_AUTH_TYPE',      '',                                                                        '2026-04-24 10:43:09'),
  ('SMS_CUSTOM_PAYLOAD',        '',                                                                        '2026-04-24 10:43:09'),
  ('SMS_DEVICE_ID',             '',                                                                        '2026-04-24 10:43:09'),
  ('SMS_LAST_TEST_DATE',        '',                                                                        '2026-04-26 10:57:06'),
  ('SMS_LAST_TEST_STATUS',      '',                                                                        '2026-04-26 10:57:06'),
  ('SMS_MESSAGE_TEMPLATE',      'Dear {name}, your electricity bill for {month} is P{amount} (Previous: {previous_reading} kWh, Present: {current_reading} kWh) with a total of {usage} kWh used this month. Please pay on or before {due_date}. - TEBANS', '2026-04-26 16:05:38'),
  ('SMS_PASSWORD',              '',                                                                        '2026-04-24 10:43:09'),
  ('SMS_PHONE_NUMBER',          '+639304958974',                                                           '2026-04-24 10:43:09'),
  ('SMS_PROVIDER',              'httpsms',                                                                 '2026-04-24 10:43:09'),
  ('SMS_REQUIRE_CONFIRMATION',  '1',                                                                       '2026-04-26 10:52:21'),
  ('SMS_USERNAME',              '',                                                                        '2026-04-24 10:43:09');

SET FOREIGN_KEY_CHECKS = 1;
