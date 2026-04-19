Data Dictionary
Authentication (All Actors)
Input Credentials = Username + Password
Credential Query = Username + Password
Auth Result  = Login_Status (Success / Failure)
Login Successful/Unsuccessful  = Auth Result
Account Update Request  = Current_Password + New_Password + Confirm_Password
Updated Account Data  = User_ID + New_Password

Admin
Admin Credential Query = Username + Password
View Request (Dashboard) = Admin_ID
Dashboard Display = Disconnection_Count + Registration_List + Active_Consumer_Count
Registration List = {User_ID + First_Name + Last_Name + User_Type + Registration_Date}
Active Records = {Consumer_ID + First_Name + Last_Name + Account_Status}
Request Accounts = Admin_ID + (Account_Type_Filter)
Account List =  {User_ID + First_Name + Last_Name + User_Type + Account_Status}
Count Query = Admin_ID + (Status_Filter = "Pending")
Records = {Disconnection_ID + Consumer_ID + Date + Reason + Status}
Consumer Query = Admin_ID + (Status_Filter = "Active")
Active Count = Total_Active_Consumers
Consumer Record = {User_ID + First_Name + Last_Name + User_Type + Registration_Date}
Activation Request = User_ID + New_Status
Deactivation Request = User_ID + New_Status
Update Account Status = User_ID + Account_Status
User List = {User_ID + First_Name + Last_Name + User_Type + Account_Status}
View Request (Staff) = Admin_ID
Staff Account List = {User_ID + First_Name + Last_Name + User_Type + Assigned_Area + Account_Status}
Staff Accounts Display = Staff_Account_List
Search Query (Staff) = Search_Keyword (Name / ID / Role)
Staff Query = Search_Keyword
Matching Staff = {User_ID + First_Name + Last_Name + User_Type + Assigned_Area}
Filtered Results (Staff) = {Matching_Staff_Record}
New Account Details (Staff) = First_Name + Last_Name + User_Type + Contact_No + Assigned_Area + Password
New Staff Account = User_ID + First_Name + Last_Name + User_Type + Contact_No + Assigned_Area + Account_Status
Update Account Details = User_ID + (First_Name) + (Last_Name) + (Contact_No) + (Assigned_Area)
Update Staff Account = User_ID + Updated_Fields
View Request (Consumer Accounts) = Admin_ID
Consumer Account List = {Consumer_ID + First_Name + Last_Name + Address + Meter_Serial_No + Account_Status}
Consumer Accounts Display = Consumer_Account_List
Search Query (Consumer) = Search_Keyword (Name / ID / Area)
Consumer Query = Search_Keyword
Matching Consumer = {Consumer_ID + First_Name + Last_Name + Address + Meter_Serial_No}
Filtered Results (Consumer) = {Matching_Consumer_Record}

Consumer
View Request (Billing History) = Consumer_ID
Data Retrieval Request = Consumer_ID
Billing Records = {Bill_ID + Amount + Due_Date + Status + Reading_Date}
Billing History Display = {Billing_Record}
View Request (Profile) = Consumer_ID
Profile Query = Consumer_ID
Consumer Data (Profile) = Consumer_ID + First_Name + Last_Name + Address + Meter_Serial_No + Area_Name + Contact_No + Account_Status
Profile Display = Consumer_Data
View Request (Payment History) = Consumer_ID
Payment Query = Consumer_ID
Payment Records = {Payment_ID + Amount_Paid + Payment_Date + Payment_Method + Bill_ID}
Payment History Display = {Payment_Record}
Search Query (Transaction) = Consumer_ID + Search_Keyword  (Date / Amount / Bill_ID)
Transaction Query = Search_Keyword
Matching Records (Transaction) = {Payment_ID + Amount_Paid + Payment_Date + Bill_ID}
Filtered Results (Transaction) = {Matching_Transaction_Record}

Meter Reader
Account ID/Request = Consumer_ID / View_Request
Query Request = Consumer_ID
Account Records = Consumer_ID + First_Name + Last_Name + Address + Meter_Serial_No + Area_Name + Account_Status
Consumer Account Display = Account_Records
Search Query (Consumer Account) = Search_Keyword (Name / ID / Area)
Matching Records (Consumer) = {Consumer_ID + First_Name + Last_Name + Address + Meter_Serial_No}
Filtered Results (Consumer Account) = {Matching_Consumer_Record}
New Account Details (Consumer) = First_Name + Last_Name + Address + Meter_Serial_No + Area_Name + Contact_No
New Consumer Account = Consumer_ID + First_Name + Last_Name + Address + Meter_Serial_No + Area_Name + Account_Status
Existing Account Data = Consumer_ID + Meter_Serial_No
Account Creation Confirmation = Success / Failure + Consumer_ID
Updated Account Data (Consumer) = Consumer_ID + (First_Name) + (Last_Name) + (Address) + (Contact_No) + (Area_Name)
Update Record = Consumer_ID + Updated_Fields
Update Record (Update Consumer Account) = Consumer_ID + Updated_Fields
Existing Account Data (Update) = Consumer_ID + Current_Fields
Overdue Records = {Consumer_ID + First_Name + Last_Name + Bill_ID + Amount + Due_Date + Days_Overdue}
Display list = {Overdue_Record}
Billing Input = Consumer_ID + Meter_Reading + Reading_Date
Query (Consumer) = Consumer_ID
Query (Send Disconnection Request) = Consumer_ID
Consumer Data (Send Disconnection Request) = Consumer_ID + First_Name + Last_Name + Address + Contact_No + Account_Status
Consumer Data = Consumer_ID + First_Name + Last_Name + Meter_Serial_No + Rate_Type + Address + Contact_No
Billing Data = Bill_ID + Consumer_ID + Amount + Due_Date + Reading_Date + Status
Bill Details = Consumer_Name + Bill_Amount + Due_Date + Contact_No
Billing Alert SMS = Consumer_Name + Bill_Amount + Due_Date
Disconnection Order = Consumer_ID + Reason
Disconnection Record = Disconnection_ID + Consumer_ID + Date + Reason + Status
Disconnection Details = Consumer_Name + Disconnection_Date + Reason + Contact_No
Disconnection Alert SMS = Consumer_Name + Disconnection_Date + Reason
Billing Details (View Bill) = Consumer_ID
Billing Data Query = Consumer_ID
Consumer Bill = {Bill_ID + Amount + Due_Date + Status + Reading_Date}
Display Consumer Bill = {Bill_Record}
View Request (Payment Collection) = Meter_Reader_ID
Payment Records (Collection) = {Payment_ID + Consumer_Name + Amount_Paid + Payment_Date}
Display Payment Collection = {Payment_Record}
Date Range Input = Start_Date + End_Date
Date Query = Start_Date + End_Date
Matching Records (Date) = {Payment_Record within Date_Range}
Filtered Results (Date) = {Matching_Payment_Record}

Cashier
Account Data Query = Username + Password
Auth Status = Login_Status (Success / Failure)
View Request (Dashboard) = Cashier_ID
Summary Data = Total_Collections_Today + Transactions_Processed  + Pending_Cash_Remittance + Pending_Consumer_to_Pay
Dashboard Display = Summary_Data + Transaction_List
Transaction Query = Cashier_ID + Today_Date
History Query = Today_Date
Recent Records = {Payment_ID + Consumer_Name + Amount_Paid  + Payment_Time}
Transaction List = {Recent_Transaction_Record}
View Request (Payment Collection) = Cashier_ID
Payment Records (Cashier) = {Payment_ID + Consumer_Name + Amount_Paid + Payment_Date}
Display Payment Collection = {Payment_Record}
Date Range Input (Cashier) = Start_Date + End_Date
Date Query (Cashier) = Start_Date + End_Date
Matching Records (Cashier Date) = {Payment_Record within Date_Range}
Filtered Results (Cashier Date) = {Matching_Payment_Record}
Billing Details (Cashier) = Consumer_ID / Bill_ID
Bill Records = {Bill_ID + Consumer_Name + Amount + Due_Date + Status}
Display Consumer Bill (Cashier) = {Bill_Record}
Search Query (Billing) = Search_Keyword (Name / Bill_ID / Date)
Query Request (Billing) = Search_Keyword
Matching Records (Billing) = {Bill_ID + Consumer_Name + Amount + Status}
Filtered Results (Billing) = {Matching_Bill_Record}
Consumer Payment Details = Consumer_ID + Bill_ID + Amount_Paid + Payment_Method
Payment Data = Consumer_ID + Bill_ID + Amount_Paid + Payment_Date + Payment_Method
Current Balance = Bill_ID + Outstanding_Amount
Transaction Receipt = Payment_ID + Consumer_Name + Amount_Paid + Payment_Date + Payment_Method
Payment Record = Payment_ID + Bill_ID + Amount_Paid + Payment_Date + Status
Payment Data (Status) = Bill_ID + New_Status
Part 2: Data Elements
User_ID - unique identifier for each system user
Consumer_ID - unique identifier for each electricity consumer
Bill_ID - unique identifier for each generated bill
Payment_ID - unique identifier for each payment transaction
Disconnection_ID - unique identifier for each disconnection request
Admin_ID - identifier for the admin user
Meter_Reader_ID - identifier for the meter reader
Cashier_ID - identifier for the cashier
Login_Status - result of authentication (Success / Failure)
Username - account login username
Password - encrypted account password
First_Name - user or consumer first name
Last_Name - user or consumer last name
User_Type - role classification (Admin / Meter Reader / Cashier)
Account_Status - current state of account (Active / Inactive / Pending)
Contact_No - mobile or phone number of user or consumer
Assigned_Area - geographic zone assigned to staff member
Address - physical address of the consumer
Meter_Serial_No - serial number of the electricity meter
Area_Name - name of the barangay or zone
Rate_Type - electricity rate category for billing calculation
Meter_Reading - current meter reading value
Reading_Date - date when the meter was read
Amount - total bill amount in pesos
Due_Date - payment deadline date
Days_Overdue - number of days past the due date
Amount_Paid - payment amount received in pesos
Payment_Date - date the payment was made
Payment_Time - time the payment was processed
Payment_Method - mode of payment (Cash / Check / Online)
Payment_Status - current state of payment (Paid / Unpaid / Partial)
Outstanding_Amount - remaining balance on a bill
Reason - cause for disconnection request
Disconnection_Date - date of scheduled disconnection
Registration_Date - date when account was registered
Total_Collections_Today - sum of all payments received today
Transactions_Processed - count of payments processed today
Pending_Cash_Remittance - total unremitted cash amount
Pending_Consumer_to_Pay - count of consumers with unpaid bills
Total_Active_Consumers - count of consumers with active status
Disconnection_Count - total number of pending disconnections
Search_Keyword - text input used for searching records
Start_Date - beginning of date range filter
End_Date - end of date range filter
New_Status - updated account status value
Updated_Fields - modified data fields in an update operation

Part 3: Data Stores
Login Table - stores user authentication credentials including 
              username, password, and associated User_ID. 
              Primary key: Login_ID.

User Table - stores all system user accounts including admin, 
             meter reader, and cashier information. Contains 
             name, contact number, user type, and account status. 
             Primary key: User_ID.

Consumer Table - stores electricity consumer account information 
                 including personal details, meter serial number, 
                 address, area name, and account status. 
                 Primary key: Consumer_ID.

Billing Table - stores generated electricity bills including 
                consumer reference, amount, due date, reading date, 
                and payment status. Primary key: Bill_ID.

Payment Table - stores payment transaction records including 
                consumer reference, bill reference, amount paid, 
                payment date, and payment method. 
                Primary key: Payment_ID.

Disconnection Table - stores disconnection request records 
                      including consumer reference, request date, 
                      reason, and disconnection status. 
                      Primary key: Disconnection_ID.
