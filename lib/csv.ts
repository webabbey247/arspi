function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function downloadCsv<T>(
  filename: string,
  columns: Array<{ header: string; value: (row: T) => unknown }>,
  rows: T[],
) {
  const headerLine = columns.map((column) => escapeCell(column.header)).join(",")
  const bodyLines = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(","),
  )
  const csv = "﻿" + [headerLine, ...bodyLines].join("\r\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
