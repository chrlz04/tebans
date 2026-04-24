const fs = require('fs')
let code = fs.readFileSync('src/app/meter-reader/readings/batch/page.tsx', 'utf8')
code = code.replace("keyExtractor={(row, index) => \\`${row.consumerId}-${index}\\`}", "keyExtractor={(row) => row.consumerId}")
fs.writeFileSync('src/app/meter-reader/readings/batch/page.tsx', code)
