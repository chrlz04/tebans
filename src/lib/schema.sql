CREATE DATABASE IF NOT EXISTS tebans_db;
USE tebans_db;

-- ─── Login ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Login (
  Login_ID   VARCHAR(36)  PRIMARY KEY,
  User_name  VARCHAR(100) NOT NULL UNIQUE,
  Password   VARCHAR(255) NOT NULL,
  Must_Change_Password BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── User ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User (
  User_ID        VARCHAR(36)  PRIMARY KEY,
  First_Name     VARCHAR(100) NOT NULL,
  Last_Name      VARCHAR(100) NOT NULL,
  Contact_No     VARCHAR(20)  NOT NULL,
  User_Type      ENUM('admin','meter_reader','cashier','consumer') NOT NULL,
  Account_Status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  Registration_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Login_ID       VARCHAR(36)  UNIQUE,
  FOREIGN KEY (Login_ID) REFERENCES Login(Login_ID)
);

-- ─── Admin ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Admin (
  Admin_ID        VARCHAR(36) PRIMARY KEY,
  Clearance_Level INT         NOT NULL DEFAULT 1,
  Login_ID        VARCHAR(36) NOT NULL UNIQUE,
  User_ID         VARCHAR(36) NOT NULL UNIQUE,
  FOREIGN KEY (Login_ID) REFERENCES Login(Login_ID),
  FOREIGN KEY (User_ID)  REFERENCES User(User_ID)
);

-- ─── Area ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Area (
  Area_ID VARCHAR(36) PRIMARY KEY,
  Name    VARCHAR(100) NOT NULL UNIQUE
);

-- ─── MeterReader ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MeterReader (
  MeterReader_ID VARCHAR(36)  PRIMARY KEY,
  Assigned_Area_ID VARCHAR(36),
  User_ID        VARCHAR(36)  NOT NULL UNIQUE,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID),
  FOREIGN KEY (Assigned_Area_ID) REFERENCES Area(Area_ID) ON DELETE SET NULL
);

-- ─── Cashier ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Cashier (
  Cashier_ID    VARCHAR(36)  PRIMARY KEY,
  Assigned_Area_ID VARCHAR(36),
  User_ID       VARCHAR(36)  NOT NULL UNIQUE,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID),
  FOREIGN KEY (Assigned_Area_ID) REFERENCES Area(Area_ID) ON DELETE SET NULL
);

-- ─── Consumer ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Consumer (
  Consumer_ID    VARCHAR(36)  PRIMARY KEY,
  Address        TEXT         NOT NULL,
  Province       VARCHAR(100),
  Municipality   VARCHAR(100),
  Barangay       VARCHAR(100),
  Area_ID        VARCHAR(36),
  Meter_Serial_No VARCHAR(100) NOT NULL UNIQUE,
  User_ID        VARCHAR(36)  NOT NULL UNIQUE,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID),
  FOREIGN KEY (Area_ID) REFERENCES Area(Area_ID) ON DELETE SET NULL
);

-- ─── MeterReading ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MeterReading (
  MeterReading_ID      VARCHAR(36)    PRIMARY KEY,
  Consumer_ID          VARCHAR(36)    NOT NULL,
  MeterReader_ID       VARCHAR(36)    NOT NULL,
  Previous_Reading     DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Current_Reading      DECIMAL(10,2)  NOT NULL,
  Date_Recorded        DATE           NOT NULL,
  Billing_Month        VARCHAR(20)    NOT NULL,
  FOREIGN KEY (Consumer_ID)    REFERENCES Consumer(Consumer_ID),
  FOREIGN KEY (MeterReader_ID) REFERENCES MeterReader(MeterReader_ID),
  UNIQUE (Consumer_ID, Billing_Month)
);

-- ─── Bill ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Bill (
  Bill_ID          VARCHAR(36)   PRIMARY KEY,
  Consumer_ID      VARCHAR(36)   NOT NULL,
  MeterReading_ID  VARCHAR(36)   NOT NULL UNIQUE,
  Amount           DECIMAL(10,2) NOT NULL,
  Due_Date         DATE          NOT NULL,
  Payment_Status   ENUM('Paid','Unpaid') NOT NULL DEFAULT 'Unpaid',
  Billing_Month    VARCHAR(20)   NOT NULL,
  FOREIGN KEY (Consumer_ID)     REFERENCES Consumer(Consumer_ID),
  FOREIGN KEY (MeterReading_ID) REFERENCES MeterReading(MeterReading_ID),
  UNIQUE (Consumer_ID, Billing_Month)
);

-- ─── Payment ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Payment (
  Payment_ID     VARCHAR(36)   PRIMARY KEY,
  Bill_ID        VARCHAR(36)   NOT NULL,
  Cashier_ID     VARCHAR(36)   NOT NULL,
  Consumer_ID    VARCHAR(36)   NOT NULL,
  Amount_Paid    DECIMAL(10,2) NOT NULL,
  Date_Paid      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Payment_Method ENUM('Cash') NOT NULL,
  Receipt_Number VARCHAR(50)   NOT NULL UNIQUE,
  FOREIGN KEY (Bill_ID)     REFERENCES Bill(Bill_ID),
  FOREIGN KEY (Cashier_ID)  REFERENCES Cashier(Cashier_ID),
  FOREIGN KEY (Consumer_ID) REFERENCES Consumer(Consumer_ID)
);

-- ─── DisconnectionRequest ─────────────────────────────────
CREATE TABLE IF NOT EXISTS DisconnectionRequest (
  DisconnectionRequest_ID VARCHAR(36)  PRIMARY KEY,
  Consumer_ID             VARCHAR(36)  NOT NULL,
  MeterReader_ID          VARCHAR(36)  NOT NULL,
  Reason_for_Disconnection TEXT        NOT NULL,
  Scheduled_Date          DATE         NOT NULL,
  Request_Status          ENUM('Pending','Executed','Cancelled') NOT NULL DEFAULT 'Pending',
  Date_Requested          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Consumer_ID)    REFERENCES Consumer(Consumer_ID),
  FOREIGN KEY (MeterReader_ID) REFERENCES MeterReader(MeterReader_ID)
);

-- ─── Notification ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Notification (
  Notification_ID         VARCHAR(36) PRIMARY KEY,
  Consumer_ID             VARCHAR(36) NOT NULL,
  MeterReading_ID         VARCHAR(36),
  DisconnectionRequest_ID VARCHAR(36),
  Alert_Type              ENUM('Billing','Disconnection') NOT NULL,
  Message_Content         TEXT        NOT NULL,
  Date_Sent               DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Reference_Type          ENUM('MeterReading','DisconnectionRequest') NOT NULL,
  FOREIGN KEY (Consumer_ID)             REFERENCES Consumer(Consumer_ID),
  FOREIGN KEY (MeterReading_ID)         REFERENCES MeterReading(MeterReading_ID),
  FOREIGN KEY (DisconnectionRequest_ID) REFERENCES DisconnectionRequest(DisconnectionRequest_ID)
);
-- ─── System Settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS System_Settings (
  Setting_Key   VARCHAR(100) PRIMARY KEY,
  Setting_Value TEXT NOT NULL,
  Updated_At    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default SMS settings
INSERT IGNORE INTO System_Settings (Setting_Key, Setting_Value) VALUES
('SMS_PROVIDER', 'httpsms'),
('SMS_API_URL', 'https://api.httpsms.com/v1/messages/send'),
('SMS_API_KEY', ''),
('SMS_PHONE_NUMBER', ''),
('SMS_DEVICE_ID', ''),
('SMS_USERNAME', ''),
('SMS_PASSWORD', ''),
('SMS_CUSTOM_AUTH_TYPE', ''),
('SMS_CUSTOM_AUTH_HEADER', ''),
('SMS_CUSTOM_PAYLOAD', ''),
('SMS_BATCH_SENDING_ENABLED', '0'),
('SMS_BATCH_SIZE_LIMIT', '500'),
('SMS_BATCH_DELAY', '1'),
('SMS_REQUIRE_CONFIRMATION', '0'),
('SMS_AUTO_MARK_SENT', '0'),
('SMS_MESSAGE_TEMPLATE', 'Dear {name}, your electricity bill for {month} is P{amount} (Previous: {previous_reading} kWh, Present: {current_reading} kWh) with a total of {usage} kWh used this month. Please pay on or before {due_date}. - TEBANS'),
('SMS_LAST_TEST_DATE', ''),
('SMS_LAST_TEST_STATUS', ''),
('BILLING_CYCLE_START_DAY', '28'),
('BILLING_CYCLE_END_DAY', '27');

-- Seed default Areas
INSERT IGNORE INTO Area (Area_ID, Name) VALUES
('area-001', 'Centro'),
('area-002', 'Kabugnayan'),
('area-003', 'Ukay'),
('area-004', 'Molave');
