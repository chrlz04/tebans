import re

with open('src/app/api/meter-reader/consumers/route.ts', 'r') as f:
    content = f.read()

# Replace ConsumerRow interface
content = re.sub(
    r'interface ConsumerRow extends RowDataPacket {.*?Account_Status:\s+string\n}',
    '''interface ConsumerRow extends RowDataPacket {
  Consumer_ID:     string
  First_Name:      string
  Last_Name:       string
  Address:         string
  Province:        string
  Municipality:    string
  Barangay:        string
  Area_ID:         string
  Area_Name:       string
  Meter_Serial_No: string
  Contact_No:      string
  Account_Status:  string
}''', content, flags=re.DOTALL)

# Replace GET query
content = re.sub(
    r'const meterReader = await queryOne.*?SELECT Assigned_Area FROM MeterReader WHERE User_ID = \?\`,.*?const assignedArea = meterReader\.Assigned_Area',
    '''const meterReader = await queryOne<{ Assigned_Area_ID: string } & RowDataPacket>(
      `SELECT Assigned_Area_ID FROM MeterReader WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader profile not found', 404)
    }

    const assignedArea = meterReader.Assigned_Area_ID''', content, flags=re.DOTALL)

content = re.sub(
    r'SELECT\s+c\.Consumer_ID,.*?FROM Consumer c\s+JOIN User u ON u\.User_ID = c\.User_ID\s+WHERE c\.Area_Name = \?\s+AND \(.*?\).*?ORDER BY u\.First_Name ASC',
    '''SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        c.Province,
        c.Municipality,
        c.Barangay,
        c.Area_ID,
        a.Name AS Area_Name,
        c.Meter_Serial_No,
        u.Contact_No,
        u.Account_Status
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       LEFT JOIN Area a ON a.Area_ID = c.Area_ID
       WHERE c.Area_ID = ?
         AND (
           u.First_Name   LIKE ? OR
           u.Last_Name    LIKE ? OR
           c.Consumer_ID  LIKE ? OR
           a.Name         LIKE ?
         )
       ORDER BY u.First_Name ASC''', content, flags=re.DOTALL)

content = re.sub(
    r'return ok\(consumers\.map\(\(c\) => \(\{.*?\}\)\)\)',
    '''return ok(consumers.map((c) => ({
      consumerId:    c.Consumer_ID,
      firstName:     c.First_Name,
      lastName:      c.Last_Name,
      address:       c.Address,
      province:      c.Province,
      municipality:  c.Municipality,
      barangay:      c.Barangay,
      areaId:        c.Area_ID,
      areaName:      c.Area_Name,
      meterSerialNo: c.Meter_Serial_No,
      contactNo:     c.Contact_No,
      accountStatus: c.Account_Status,
    })))''', content, flags=re.DOTALL)

# Replace POST parameters
content = re.sub(
    r'const \{\s*firstName,\s*lastName,\s*address,\s*meterSerialNo,\s*areaName,\s*contactNo,\s*\} = await req\.json\(\)',
    '''const {
      firstName,
      lastName,
      address,
      province,
      municipality,
      barangay,
      meterSerialNo,
      areaId,
      contactNo,
    } = await req.json()''', content)

content = re.sub(
    r"const reqError = validateRequired\(\{.*?\}, \['firstName', 'lastName', 'address', 'meterSerialNo', 'areaName', 'contactNo'\]\)",
    '''const reqError = validateRequired({
      firstName, lastName, address, meterSerialNo, areaId, contactNo
    }, ['firstName', 'lastName', 'address', 'meterSerialNo', 'areaId', 'contactNo'])''', content, flags=re.DOTALL)

# Replace INSERT
content = re.sub(
    r'INSERT INTO Consumer \(\s*Consumer_ID, Address, Meter_Serial_No, Area_Name, User_ID\s*\) VALUES \(\?, \?, \?, \?, \?\)`,\s*\[consumerId, address, meterSerialNo, areaName, userId\]',
    '''INSERT INTO Consumer (
        Consumer_ID, Address, Province, Municipality, Barangay, Meter_Serial_No, Area_ID, User_ID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)\`,
      [consumerId, address, province, municipality, barangay, meterSerialNo, areaId, userId]''', content)


with open('src/app/api/meter-reader/consumers/route.ts', 'w') as f:
    f.write(content)
