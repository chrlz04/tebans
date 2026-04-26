-- =============================================================
-- TEBANS Database Schema
-- Generated: 2026-04-26
-- MySQL 8.0+
-- =============================================================

CREATE DATABASE IF NOT EXISTS `tebans_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `tebans_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- TABLE: login
-- Stores authentication credentials for all system users.
-- No foreign key dependencies.
-- =============================================================
CREATE TABLE IF NOT EXISTS `login` (
  `Login_ID`             VARCHAR(36)  NOT NULL,
  `User_name`            VARCHAR(100) NOT NULL,
  `Password`             VARCHAR(255) NOT NULL,
  `Must_Change_Password` TINYINT(1)   NOT NULL DEFAULT '0',
  PRIMARY KEY (`Login_ID`),
  UNIQUE KEY `User_name` (`User_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: area
-- Defines geographic service areas (e.g., Centro, Kabugnayan).
-- No foreign key dependencies.
-- =============================================================
CREATE TABLE IF NOT EXISTS `area` (
  `Area_ID` VARCHAR(36)  NOT NULL,
  `Name`    VARCHAR(100) NOT NULL,
  PRIMARY KEY (`Area_ID`),
  UNIQUE KEY `Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: user
-- Central user table for all roles (admin, meter_reader,
-- cashier, consumer). References login for credentials.
-- =============================================================
CREATE TABLE IF NOT EXISTS `user` (
  `User_ID`           VARCHAR(36)                                        NOT NULL,
  `First_Name`        VARCHAR(100)                                       NOT NULL,
  `Last_Name`         VARCHAR(100)                                       NOT NULL,
  `Contact_No`        VARCHAR(20)                                        NOT NULL,
  `User_Type`         ENUM('admin','meter_reader','cashier','consumer')  NOT NULL,
  `Account_Status`    ENUM('Active','Inactive')                          NOT NULL DEFAULT 'Active',
  `Registration_Date` DATETIME                                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Login_ID`          VARCHAR(36)                                        DEFAULT NULL,
  PRIMARY KEY (`User_ID`),
  UNIQUE KEY `Login_ID` (`Login_ID`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`Login_ID`) REFERENCES `login` (`Login_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: admin
-- Admin role records. References user.
-- =============================================================
CREATE TABLE IF NOT EXISTS `admin` (
  `Admin_ID`       VARCHAR(36) NOT NULL,
  `Clearance_Level` INT        NOT NULL DEFAULT '1',
  `User_ID`        VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`Admin_ID`),
  KEY `admin_ibfk_2` (`User_ID`),
  CONSTRAINT `admin_ibfk_2` FOREIGN KEY (`User_ID`) REFERENCES `user` (`User_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: cashier
-- Cashier role records. References user and area.
-- =============================================================
CREATE TABLE IF NOT EXISTS `cashier` (
  `Cashier_ID`       VARCHAR(36) NOT NULL,
  `Assigned_Area_ID` VARCHAR(36) DEFAULT NULL,
  `User_ID`          VARCHAR(36) NOT NULL,
  PRIMARY KEY (`Cashier_ID`),
  UNIQUE KEY `User_ID` (`User_ID`),
  KEY `cashier_ibfk_area` (`Assigned_Area_ID`),
  CONSTRAINT `cashier_ibfk_1`    FOREIGN KEY (`User_ID`)          REFERENCES `user` (`User_ID`),
  CONSTRAINT `cashier_ibfk_area` FOREIGN KEY (`Assigned_Area_ID`) REFERENCES `area` (`Area_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: meterreader
-- Meter reader role records. References user and area.
-- =============================================================
CREATE TABLE IF NOT EXISTS `meterreader` (
  `MeterReader_ID`   VARCHAR(36) NOT NULL,
  `Assigned_Area_ID` VARCHAR(36) DEFAULT NULL,
  `User_ID`          VARCHAR(36) NOT NULL,
  PRIMARY KEY (`MeterReader_ID`),
  UNIQUE KEY `User_ID` (`User_ID`),
  KEY `meterreader_ibfk_area` (`Assigned_Area_ID`),
  CONSTRAINT `meterreader_ibfk_1`    FOREIGN KEY (`User_ID`)          REFERENCES `user` (`User_ID`),
  CONSTRAINT `meterreader_ibfk_area` FOREIGN KEY (`Assigned_Area_ID`) REFERENCES `area` (`Area_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: consumer
-- Consumer (electricity account holder) records.
-- References user and area.
-- =============================================================
CREATE TABLE IF NOT EXISTS `consumer` (
  `Consumer_ID`    VARCHAR(36)  NOT NULL,
  `Address`        TEXT         NOT NULL,
  `Province`       VARCHAR(100) DEFAULT NULL,
  `Municipality`   VARCHAR(100) DEFAULT NULL,
  `Barangay`       VARCHAR(100) DEFAULT NULL,
  `Area_ID`        VARCHAR(36)  DEFAULT NULL,
  `Meter_Serial_No` VARCHAR(100) NOT NULL,
  `User_ID`        VARCHAR(36)  NOT NULL,
  PRIMARY KEY (`Consumer_ID`),
  UNIQUE KEY `Meter_Serial_No` (`Meter_Serial_No`),
  UNIQUE KEY `User_ID` (`User_ID`),
  KEY `consumer_ibfk_area` (`Area_ID`),
  CONSTRAINT `consumer_ibfk_1`    FOREIGN KEY (`User_ID`)  REFERENCES `user` (`User_ID`),
  CONSTRAINT `consumer_ibfk_area` FOREIGN KEY (`Area_ID`)  REFERENCES `area` (`Area_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: meterreading
-- Records monthly meter readings per consumer.
-- References consumer and meterreader.
-- Enforces one reading per consumer per billing month.
-- =============================================================
CREATE TABLE IF NOT EXISTS `meterreading` (
  `MeterReading_ID`  VARCHAR(36)   NOT NULL,
  `Consumer_ID`      VARCHAR(36)   NOT NULL,
  `MeterReader_ID`   VARCHAR(36)   NOT NULL,
  `Previous_Reading` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `Current_Reading`  DECIMAL(10,2) NOT NULL,
  `Date_Recorded`    DATE          NOT NULL,
  `Billing_Month`    VARCHAR(20)   NOT NULL,
  PRIMARY KEY (`MeterReading_ID`),
  UNIQUE KEY `unique_consumer_billing_month_reading` (`Consumer_ID`, `Billing_Month`),
  KEY `MeterReader_ID` (`MeterReader_ID`),
  CONSTRAINT `meterreading_ibfk_1` FOREIGN KEY (`Consumer_ID`)    REFERENCES `consumer`    (`Consumer_ID`),
  CONSTRAINT `meterreading_ibfk_2` FOREIGN KEY (`MeterReader_ID`) REFERENCES `meterreader` (`MeterReader_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: bill
-- Billing records generated from meter readings.
-- References consumer and meterreading.
-- Enforces one bill per consumer per billing month.
-- =============================================================
CREATE TABLE IF NOT EXISTS `bill` (
  `Bill_ID`        VARCHAR(36)                         NOT NULL,
  `Consumer_ID`    VARCHAR(36)                         NOT NULL,
  `MeterReading_ID` VARCHAR(36)                        NOT NULL,
  `Amount`         DECIMAL(10,2)                       NOT NULL,
  `Due_Date`       DATE                                NOT NULL,
  `Payment_Status` ENUM('Paid','Unpaid','Partial')     NOT NULL DEFAULT 'Unpaid',
  `Billing_Month`  VARCHAR(20)                         NOT NULL,
  PRIMARY KEY (`Bill_ID`),
  UNIQUE KEY `MeterReading_ID` (`MeterReading_ID`),
  UNIQUE KEY `unique_consumer_billing_month_bill` (`Consumer_ID`, `Billing_Month`),
  CONSTRAINT `bill_ibfk_1` FOREIGN KEY (`Consumer_ID`)     REFERENCES `consumer`     (`Consumer_ID`),
  CONSTRAINT `bill_ibfk_2` FOREIGN KEY (`MeterReading_ID`) REFERENCES `meterreading` (`MeterReading_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: payment
-- Tracks payments made by consumers for their bills.
-- References bill, cashier, and consumer.
-- =============================================================
CREATE TABLE IF NOT EXISTS `payment` (
  `Payment_ID`     VARCHAR(36)   NOT NULL,
  `Bill_ID`        VARCHAR(36)   NOT NULL,
  `Cashier_ID`     VARCHAR(36)   NOT NULL,
  `Consumer_ID`    VARCHAR(36)   NOT NULL,
  `Amount_Paid`    DECIMAL(10,2) NOT NULL,
  `Date_Paid`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Payment_Method` ENUM('Cash')  NOT NULL,
  `Receipt_Number` VARCHAR(50)   NOT NULL,
  PRIMARY KEY (`Payment_ID`),
  UNIQUE KEY `Receipt_Number` (`Receipt_Number`),
  KEY `Bill_ID`     (`Bill_ID`),
  KEY `Cashier_ID`  (`Cashier_ID`),
  KEY `Consumer_ID` (`Consumer_ID`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`Bill_ID`)     REFERENCES `bill`     (`Bill_ID`),
  CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`Cashier_ID`)  REFERENCES `cashier`  (`Cashier_ID`),
  CONSTRAINT `payment_ibfk_3` FOREIGN KEY (`Consumer_ID`) REFERENCES `consumer` (`Consumer_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: disconnectionrequest
-- Tracks disconnection requests issued against consumers.
-- References consumer and meterreader.
-- =============================================================
CREATE TABLE IF NOT EXISTS `disconnectionrequest` (
  `DisconnectionRequest_ID`  VARCHAR(36)                          NOT NULL,
  `Consumer_ID`              VARCHAR(36)                          NOT NULL,
  `MeterReader_ID`           VARCHAR(36)                          NOT NULL,
  `Reason_for_Disconnection` TEXT                                 NOT NULL,
  `Scheduled_Date`           DATE                                 NOT NULL,
  `Request_Status`           ENUM('Pending','Executed','Cancelled') NOT NULL DEFAULT 'Pending',
  `Date_Requested`           DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DisconnectionRequest_ID`),
  KEY `Consumer_ID`    (`Consumer_ID`),
  KEY `MeterReader_ID` (`MeterReader_ID`),
  CONSTRAINT `disconnectionrequest_ibfk_1` FOREIGN KEY (`Consumer_ID`)    REFERENCES `consumer`    (`Consumer_ID`),
  CONSTRAINT `disconnectionrequest_ibfk_2` FOREIGN KEY (`MeterReader_ID`) REFERENCES `meterreader` (`MeterReader_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: notification
-- Stores billing and disconnection alerts sent to consumers.
-- References consumer, meterreading, and disconnectionrequest.
-- =============================================================
CREATE TABLE IF NOT EXISTS `notification` (
  `Notification_ID`         VARCHAR(36)                              NOT NULL,
  `Consumer_ID`             VARCHAR(36)                              NOT NULL,
  `MeterReading_ID`         VARCHAR(36)                              DEFAULT NULL,
  `DisconnectionRequest_ID` VARCHAR(36)                              DEFAULT NULL,
  `Alert_Type`              ENUM('Billing','Disconnection')          NOT NULL,
  `Message_Content`         TEXT                                     NOT NULL,
  `Date_Sent`               DATETIME                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Reference_Type`          ENUM('MeterReading','DisconnectionRequest') NOT NULL,
  `Status`                  ENUM('Pending','Sent','Failed')          NOT NULL DEFAULT 'Pending',
  PRIMARY KEY (`Notification_ID`),
  KEY `Consumer_ID`             (`Consumer_ID`),
  KEY `MeterReading_ID`         (`MeterReading_ID`),
  KEY `DisconnectionRequest_ID` (`DisconnectionRequest_ID`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`Consumer_ID`)             REFERENCES `consumer`             (`Consumer_ID`),
  CONSTRAINT `notification_ibfk_2` FOREIGN KEY (`MeterReading_ID`)         REFERENCES `meterreading`         (`MeterReading_ID`),
  CONSTRAINT `notification_ibfk_3` FOREIGN KEY (`DisconnectionRequest_ID`) REFERENCES `disconnectionrequest` (`DisconnectionRequest_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================
-- TABLE: system_settings
-- Key-value store for configurable system parameters
-- (e.g., SMS provider settings, templates).
-- No foreign key dependencies.
-- =============================================================
CREATE TABLE IF NOT EXISTS `system_settings` (
  `Setting_Key`   VARCHAR(100) NOT NULL,
  `Setting_Value` TEXT         NOT NULL,
  `Updated_At`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Setting_Key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
