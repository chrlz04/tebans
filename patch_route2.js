const fs = require('fs')
let code = fs.readFileSync('src/app/api/meter-reader/readings/bulk/route.ts', 'utf8')
code = code.replace('return err(\'File validation failed\', 400, { validationErrors })', 'return Response.json({ success: false, message: \'File validation failed\', validationErrors }, { status: 400 })')
fs.writeFileSync('src/app/api/meter-reader/readings/bulk/route.ts', code)
