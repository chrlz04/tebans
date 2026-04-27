TEBANS Official Demo Script (Role-Based Organization)
Part 1: Introduction (The 10-Second Rule)
•	[Visual Action]: Show a clean title slide. Leave it up for exactly 8 seconds.
o	Text on screen: Title: Tubod Electricity Billing Alert and Notification System (TEBANS). Developers: Charles B. Carcallas, Mary Tiffany Busalanan, Krisha Mae Basio.
•	VO (Charles): "Hello, we are presenting TEBANS, the Tubod Electricity Billing Alert and Notification System. This project was developed by Charles Carcallas, Mary Tiffany Busalanan, and Krisha Mae Basio. In this demo, we will walk through our system's functional requirements, organized seamlessly by user role."
Part 2: General & Staff Access
•	[Step-by-Step Action]:
	- Navigate to the login page (`/login`).
	- Click on the "Username" field and type in your assigned username.
	- Click on the "Password" field and type in your password.
	- Click the "Sign in" button.
	- Observe the system redirecting to the role-specific dashboard.
	- From the sidebar menu, click on "Profile".
	- Review the profile details displayed on the page.
	- Scroll down to the "Change Password" section.
	- Enter the current password, a new password, and confirm the new password in the input fields.
	- Click the "Change Password" button.
•	VO (Mary Tiffany): "Starting with general system access. First is FR-01: Login Account. Our system securely authenticates users and redirects them to their role-specific dashboard. All staff members also utilize Proposed FR-30: View Staff Profiles to securely verify their own system credentials. Finally, FR-02: Change Password allows users to update their passwords while enforcing strict security constraints."
Part 3: The Admin Role
•	[Step-by-Step Action]:
	- Log in as an Administrator.
	- Observe the Admin Dashboard (`/admin/dashboard`), showcasing the total active consumers, pending disconnections, billing cycle progress, and payment collection progress.
	- Click "Manage Accounts" in the sidebar.
	- View the Staff Accounts table, then click the "Consumer Accounts" tab to view consumer records.
	- On the Staff or Consumer table, click the "Activate" / "Deactivate" toggle button in the Actions column for a specific user.
	- Click "Create Staff" in the sidebar.
	- Fill out the new staff registration form (First Name, Last Name, Contact Number, Username, Role, and Password) and click "Register Staff Member".
	- Click the "Edit" (pencil) icon on an existing staff member in the Manage Accounts list to update their details.
	- Click "Disconnections" in the sidebar.
	- Review the list of disconnection requests. Click "Mark Executed" on a pending request (or click "View Details").
	- Click "Settings" in the sidebar.
	- Click "Manage Service Areas" to view, add, or edit Puroks/Areas.
	- Click "Back" or go back to Settings, then click "SMS Configuration" to view API provider settings.
	- Go back to Settings, then click "Billing Cycle" to view or schedule changes to the due date.
•	VO (Charles): "Moving to the Admin role. For FR-03: View Admin Dashboard, the system displays live metrics. FR-04 and FR-05: View Staff and Consumer Accounts, allow the admin to search through all users, while FR-06: Manage Registered Accounts allows them to activate or deactivate access. FR-07 and FR-08 give the admin full control to create and update staff records.
•	VO (Charles - Continuing): "To manage the broader system, we added several advanced features. Admins oversee field operations using Proposed FR-29: Manage Disconnection Requests. They also control system configurations through Proposed FR-26: Manage Service Areas, Proposed FR-27: Configure SMS Provider Settings, and Proposed FR-28: Configure Billing Cycle Settings."
Part 4: The Meter Reader Role
•	[Step-by-Step Action]:
	- Log in as a Meter Reader.
	- Observe the Meter Reader Dashboard (`/meter-reader/dashboard`), displaying the assigned area's billing progress, payment collections, and overdue accounts.
	- Click "Consumers" in the sidebar.
	- View the list of consumers in the assigned area. Use the search bar to find a specific consumer.
	- Click "Register Consumer" to create a new consumer account. Fill in the required fields and submit.
	- Click the "View" or "Edit" button on a specific consumer to view or update their details and see their existing bills.
	- Click "Record Reading" for a consumer, input the current reading, and submit to generate a bill.
	- After recording the reading, click the "Send SMS" button on the generated bill to trigger an SMS alert.
	- Navigate to the batch reading screen (often via a link or bulk action on the Consumers page or under a Batch Upload section).
	- Click "Upload File" (Excel/CSV) to perform a bulk meter reading upload, review the parsed preview, and click "Submit".
	- Click "Send SMS" in the sidebar, and navigate to the "SMS History" tab to view message delivery statuses.
	- Click "Disconnections" in the sidebar.
	- View the Overdue list, select an account, and click "Submit Disconnection Request" to flag the account and optionally send a final SMS warning.
•	VO (Mary Tiffany): "The Meter Reader handles field operations. They start at Proposed FR-31: View Meter Reader Dashboard for a real-time summary of their assigned area's billing cycle progress. With FR-12, FR-14, and FR-16, they view, update, and create consumer accounts. For single readings, FR-13 and FR-15 allow them to generate a bill and trigger an SMS alert."
•	VO (Mary Tiffany): "For large-scale operations, we built Proposed FR-23: Batch Meter Reading for bulk Excel uploads, which connects to Proposed FR-24: Batch SMS Streaming and Proposed FR-25: View SMS Notification History to track delivery. Finally, if accounts are past due, FR-17: Display Overdue Accounts and FR-18: Send Disconnection Request allow the reader to flag accounts and send final SMS warnings."
Part 5: The Cashier Role
•	[Step-by-Step Action]:
	- Log in as a Cashier.
	- Observe the Cashier Dashboard (`/cashier/dashboard`), displaying daily financial activity and collection summaries.
	- Click "Collection Reports" in the sidebar.
	- Select a date range filter to view all collected payments within that period.
	- Click "Process Payment" in the sidebar.
	- Search for a consumer by name or ID.
	- Select the consumer's unpaid bill.
	- Enter the payment amount and click "Submit Payment" to instantly update the billing status.
•	VO (Krisha Mae): "The Cashier role handles transactions. FR-20: View Cashier Dashboard summarizes daily financial activity. FR-19: View Payment Collection allows the cashier to filter all collected payments by date. Under FR-22: View Consumer Bill (Cashier), they can pull up an unpaid bill, and for FR-21: Record Payment Transaction, they process the payment. This instantly updates the billing status and recalculates the outstanding balance."
Part 6: The Consumer Role
•	[Step-by-Step Action]:
	- Log in as a Consumer.
	- Click "Profile" in the sidebar to check registered meter details and personal information.
	- Click "My Bill" (Billing History) in the sidebar to view a complete list of electricity bills and reading dates.
	- Click "Payment History" in the sidebar.
	- Use the search filter on the Payment History page to find a specific past transaction.
•	VO (Mary Tiffany): "Finally, for the Consumer role, FR-10: View Profile lets users check their registered meter details. FR-09: View Billing History provides a complete list of their electricity bills, including exact reading dates. And FR-11: Payment History gives them access to their past transactions, complete with functional search filters."
Part 7: Conclusion
•	[Visual Action]: Switch to a final "Thank You" slide with the system logo.
•	VO (Charles): "This completes the workflow loop for the Tubod Electricity Billing Alert and Notification System. Thank you for watching our demonstration."

