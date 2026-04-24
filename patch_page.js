const fs = require('fs')
let code = fs.readFileSync('src/app/meter-reader/readings/batch/page.tsx', 'utf8')
code = code.replace("render: (row) => \\`₱\\${row.amountWithTaxEvat.toLocaleString('en-US', { minimumFractionDigits: 2 })}\\`,", "render: (row) => `₱${row.amountWithTaxEvat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,")
fs.writeFileSync('src/app/meter-reader/readings/batch/page.tsx', code)
