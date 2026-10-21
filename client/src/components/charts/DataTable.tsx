import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

interface DataTableProps {
  columns: { label: string; align?: 'left' | 'right' }[]
  rows: (string | number)[][]
  maxHeight?: number
}

/** Plain table twin for a chart */
export function DataTable({ columns, rows, maxHeight = 280 }: DataTableProps) {
  return (
    <TableContainer sx={{ maxHeight }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.label} align={c.align ?? 'left'} sx={{ fontWeight: 600 }}>
                {c.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell
                  key={j}
                  align={columns[j]?.align ?? 'left'}
                  sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
