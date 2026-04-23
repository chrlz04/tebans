import os
import re

def update_file(filepath, replacements):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        for old, new in replacements:
            content = re.sub(old, new, content)

        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
    except Exception as e:
        print(f"Failed to update {filepath}: {e}")

# meter-reader/dashboard
update_file('src/app/api/meter-reader/dashboard/route.ts', [
    (r"const assignedArea = meterReader\.Assigned_Area", "const assignedAreaId = meterReader.Assigned_Area_ID"),
    (r"SELECT Assigned_Area FROM MeterReader", "SELECT Assigned_Area_ID FROM MeterReader"),
    (r"WHERE c\.Area_Name = \?", "WHERE c.Area_ID = ?"),
    (r"\[assignedArea\]", "[assignedAreaId]"),
    (r"\[assignedArea, prevMonthStr\]", "[assignedAreaId, prevMonthStr]")
])

# admin/consumers
update_file('src/app/api/admin/consumers/route.ts', [
    (r"Area_Name:\s*string", "Area_Name: string"),
    (r"c\.Area_Name,", "a.Name AS Area_Name,\nc.Area_ID,"),
    (r"FROM Consumer c\s*JOIN User u ON u\.User_ID = c\.User_ID", "FROM Consumer c\n       JOIN User u ON u.User_ID = c.User_ID\n       LEFT JOIN Area a ON a.Area_ID = c.Area_ID"),
    (r"c\.Area_Name\s*LIKE \?", "a.Name LIKE ?"),
    (r"areaName:\s*c\.Area_Name,", "areaId: c.Area_ID, areaName: c.Area_Name,")
])

# cashier/dashboard
update_file('src/app/api/cashier/dashboard/route.ts', [
    (r"SELECT Assigned_Area FROM Cashier WHERE User_ID = \?", "SELECT Assigned_Area_ID FROM Cashier WHERE User_ID = ?"),
    (r"const assignedArea = cashier\.Assigned_Area", "const assignedAreaId = cashier.Assigned_Area_ID"),
    (r"AND c\.Area_Name = \?", "AND c.Area_ID = ?"),
    (r"\[today, assignedArea\]", "[today, assignedAreaId]"),
    (r"\[startDate, endDate, assignedArea\]", "[startDate, endDate, assignedAreaId]"),
    (r"\[assignedArea\]", "[assignedAreaId]"),
])

# cashier/collections
update_file('src/app/api/cashier/collections/route.ts', [
    (r"SELECT Assigned_Area FROM Cashier WHERE User_ID = \?", "SELECT Assigned_Area_ID FROM Cashier WHERE User_ID = ?"),
    (r"const assignedArea = cashier\.Assigned_Area", "const assignedAreaId = cashier.Assigned_Area_ID"),
    (r"WHERE c\.Area_Name = \?`", "WHERE c.Area_ID = ?`"),
    (r"const queryParams: any\[\] = \[assignedArea\]", "const queryParams: any[] = [assignedAreaId]")
])

# cashier/bills/unpaid
update_file('src/app/api/cashier/bills/unpaid/route.ts', [
    (r"SELECT Assigned_Area FROM Cashier WHERE User_ID = \?", "SELECT Assigned_Area_ID FROM Cashier WHERE User_ID = ?"),
    (r"const assignedArea = cashier\.Assigned_Area", "const assignedAreaId = cashier.Assigned_Area_ID"),
    (r"AND c\.Area_Name = \?", "AND c.Area_ID = ?"),
    (r"\[assignedArea,", "[assignedAreaId,")
])
