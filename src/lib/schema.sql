CREATE DATABASE IF NOT EXISTS tebans_db;
USE tebans_db;

-- ─── Login ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Login (
  Login_ID   VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  User_name  VARCHAR(100) NOT NULL UNIQUE,
  Password   VARCHAR(255) NOT NULL
);

-- ─── User ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User (
  User_ID        VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  First_Name     VARCHAR(100) NOT NULL,
  Last_Name      VARCHAR(100) NOT NULL,
  Contact_No     VARCHAR(20)  NOT NULL,
  User_Type      ENUM('admin','meter_reader','cashier') NOT NULL,
  Account_Status ENUM('Active','Inactive','Pending') NOT NULL DEFAULT 'Pending',
  Registration_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Login_ID       VARCHAR(36)  NOT NULL UNIQUE,
  FOREIGN KEY (Login_ID) REFERENCES Login(Login_ID)
);

-- ─── Admin ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Admin (
  Admin_ID        VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  Clearance_Level INT         NOT NULL DEFAULT 1,
  Login_ID        VARCHAR(36) NOT NULL UNIQUE,
  User_ID         VARCHAR(36) NOT NULL UNIQUE,
  FOREIGN KEY (Login_ID) REFERENCES Login(Login_ID),
  FOREIGN KEY (User_ID)  REFERENCES User(User_ID)
);

-- ─── MeterReader ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MeterReader (
  MeterReader_ID VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  Assigned_Area  VARCHAR(100) NOT NULL,
  User_ID        VARCHAR(36)  NOT NULL UNIQUE,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

-- ─── Cashier ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Cashier (
  Cashier_ID    VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  Assigned_Area VARCHAR(100) NOT NULL,
  User_ID       VARCHAR(36)  NOT NULL UNIQUE,
  FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

-- ─── Consumer ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Consumer (
  Consumer_ID    VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  First_Name     VARCHAR(100) NOT NULL,
  Last_Name      VARCHAR(100) NOT NULL,
  Address        TEXT         NOT NULL,
  Meter_Serial_No VARCHAR(100) NOT NULL UNIQUE,
  Area_Name      VARCHAR(100) NOT NULL,
  Contact_No     VARCHAR(20)  NOT NULL,
  Account_Status ENUM('Active','Inactive','Pending') NOT NULL DEFAULT 'Pending',
  Registration_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Login_ID       VARCHAR(36)  UNIQUE,
  FOREIGN KEY (Login_ID) REFERENCES Login(Login_ID)
);

-- ─── MeterReading ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MeterReading (
  MeterReading_ID      VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
  Consumer_ID          VARCHAR(36)    NOT NULL,
  MeterReader_ID       VARCHAR(36)    NOT NULL,
  Previous_Reading     DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Current_Reading      DECIMAL(10,2)  NOT NULL,
  Consumption_kWh      DECIMAL(10,2)  NOT NULL,
  Date_Recorded        DATE           NOT NULL,
  Amount_with_Tax_EVAT DECIMAL(10,2)  NOT NULL DEFAULT 0,
  VAT_PassThrough_Taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
  Total_KWH            DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Pro_Rated_KWH_Loss   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Billing_Month        VARCHAR(20)    NOT NULL,
  FOREIGN KEY (Consumer_ID)    REFERENCES Consumer(Consumer_ID),
  FOREIGN KEY (MeterReader_ID) REFERENCES MeterReader(MeterReader_ID)
);

-- ─── Bill ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Bill (
  Bill_ID          VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  Consumer_ID      VARCHAR(36)   NOT NULL,
  MeterReading_ID  VARCHAR(36)   NOT NULL UNIQUE,
  Amount           DECIMAL(10,2) NOT NULL,
  Due_Date         DATE          NOT NULL,
  Payment_Status   ENUM('Paid','Unpaid','Partial') NOT NULL DEFAULT 'Unpaid',
  Billing_Month    VARCHAR(20)   NOT NULL,
  FOREIGN KEY (Consumer_ID)     REFERENCES Consumer(Consumer_ID),
  FOREIGN KEY (MeterReading_ID) REFERENCES MeterReading(MeterReading_ID)
);

-- ─── Payment ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Payment (
  Payment_ID     VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
  Bill_ID        VARCHAR(36)   NOT NULL,
  Cashier_ID     VARCHAR(36)   NOT NULL,
  Consumer_ID    VARCHAR(36)   NOT NULL,
  Amount_Paid    DECIMAL(10,2) NOT NULL,
  Date_Paid      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Payment_Method ENUM('Cash','Check','Online') NOT NULL,
  Receipt_Number VARCHAR(50)   NOT NULL UNIQUE,
  FOREIGN KEY (Bill_ID)     REFERENCES Bill(Bill_ID),
  FOREIGN KEY (Cashier_ID)  REFERENCES Cashier(Cashier_ID),
  FOREIGN KEY (Consumer_ID) REFERENCES Consumer(Consumer_ID)
);

-- ─── DisconnectionRequest ─────────────────────────────────
CREATE TABLE IF NOT EXISTS DisconnectionRequest (
  DisconnectionRequest_ID VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
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
  Notification_ID         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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