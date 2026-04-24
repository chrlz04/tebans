const fs = require('fs')
let code = fs.readFileSync('src/app/api/meter-reader/readings/bulk/route.ts', 'utf8')
code = code.replace('const consumerIds = readings.map(r => r.consumerId)', 'const consumerIds = readings.map((r: any) => r.consumerId)')
fs.writeFileSync('src/app/api/meter-reader/readings/bulk/route.ts', code)
