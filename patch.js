const fs = require('fs');

let content = fs.readFileSync('src/app/meter-reader/readings/batch/page.tsx', 'utf8');

// Update ParsedReading interface
content = content.replace(
`interface ParsedReading {
  consumerId: string
  currentReading: number
  amountWithTaxEvat: number
  readingDate: string
  dueDate: string
}`,
`interface ParsedReading {
  consumerId: string
  currentReading: number
  amountWithTaxEvat: number
  readingDate: string
  dueDate: string
  consumerName?: string
  assignedArea?: string
  meterSerialNo?: string
}`
);

// Add loading state for preview
content = content.replace(
  `const [validationErrors, setValidationErrors] = useState<{ row: number, errors: string[] }[]>([])
  const [isCompleted, setIsCompleted] = useState(false)`,
  `const [validationErrors, setValidationErrors] = useState<{ row: number, errors: string[] }[]>([])
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)`
);

// Update preview columns
content = content.replace(
  `const previewColumns: Column<ParsedReading>[] = [
    {
      key: 'consumerId',
      label: 'Account No.',
      render: (row) => <span className="font-mono text-xs">{row.consumerId}</span>,
    },
    {
      key: 'currentReading',`,
  `const previewColumns: Column<ParsedReading>[] = [
    {
      key: 'consumerId',
      label: 'Account No.',
      render: (row) => <span className="font-mono text-xs">{row.consumerId}</span>,
    },
    {
      key: 'consumerName',
      label: 'Consumer Name',
      render: (row) => <span className="font-medium text-foreground">{row.consumerName || 'N/A'}</span>,
    },
    {
      key: 'assignedArea',
      label: 'Assigned Area',
      render: (row) => <span className="text-muted-foreground text-xs">{row.assignedArea || 'N/A'}</span>,
    },
    {
      key: 'meterSerialNo',
      label: 'Meter Serial No.',
      render: (row) => <span className="font-mono text-xs">{row.meterSerialNo || 'N/A'}</span>,
    },
    {
      key: 'currentReading',`
);

// Replace processParsedRows to handle async fetching
content = content.replace(
`  const processParsedRows = (rows: any[]) => {
    const formattedData: ParsedReading[] = []
    let hasError = false
    const rowErrors: { row: number, errors: string[] }[] = []`,
`  const processParsedRows = async (rows: any[]) => {
    setIsPreviewLoading(true)
    const formattedData: ParsedReading[] = []
    let hasError = false
    const rowErrors: { row: number, errors: string[] }[] = []`
);

// Need to update Papa.parse complete callback
content = content.replace(
`        complete: (results) => {
          processParsedRows(results.data)
        },`,
`        complete: async (results) => {
          await processParsedRows(results.data)
        },`
);

// Also need to handle exceljs processParsedRows inside onload
content = content.replace(
`          processParsedRows(data)
        } catch (error: any) {`,
`          await processParsedRows(data)
        } catch (error: any) {`
);

fs.writeFileSync('src/app/meter-reader/readings/batch/page.tsx', content);
