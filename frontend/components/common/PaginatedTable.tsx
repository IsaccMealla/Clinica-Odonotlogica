// FILE: frontend/components/common/PaginatedTable.tsx
"use client"

import React, { useMemo, useState } from 'react'

type SearchField<T> = {
  key: string
  label: string
  accessor: (item: T) => string
}

type Props<T> = {
  data: T[]
  renderRow: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  searchFields: SearchField<T>[]
  header?: React.ReactNode
}

export default function PaginatedTable<T>({ data, renderRow, emptyMessage = 'No hay registros', searchFields, header }: Props<T>){
  const [rowsPerPage, setRowsPerPage] = useState<number>(5)
  const [page, setPage] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchField, setSearchField] = useState<string>(searchFields[0]?.key || '')

  const filtered = useMemo(()=>{
    if(!searchQuery) return data
    const q = searchQuery.toLowerCase()
    const field = searchFields.find(f => f.key === searchField) || searchFields[0]
    if(!field) return data
    return data.filter(d => field.accessor(d).toLowerCase().includes(q))
  }, [data, searchQuery, searchField, searchFields])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageSafe = Math.min(page, totalPages)
  const paged = useMemo(()=>{
    const start = (pageSafe -1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, pageSafe, rowsPerPage])

  function changeRowsPerPage(v:number){ setRowsPerPage(v); setPage(1) }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={e=>{ setSearchQuery(e.target.value); setPage(1) }}
            placeholder={`Buscar...`}
            className="input input-sm px-3 py-2 border rounded-md"
          />
          <select value={searchField} onChange={e=>setSearchField(e.target.value)} className="select select-sm border rounded-md px-2 py-1">
            {searchFields.map(f=> (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filas por página:</label>
          <select value={rowsPerPage} onChange={e=>changeRowsPerPage(Number(e.target.value))} className="select select-sm border rounded-md px-2 py-1">
            {[5,10,20,50].map(v=> <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-md shadow-sm">
        <table className="table-auto w-full">
          {header ? <thead>{header}</thead> : null}
          <tbody>
            {paged.length === 0 ? (
              <tr><td className="p-4 text-center" colSpan={99}>{emptyMessage}</td></tr>
            ) : paged.map((item, idx) => (
              <tr key={idx} className="border-b last:border-b-0">{renderRow(item, idx)}</tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Mostrando {Math.min(filtered.length, (pageSafe-1)*rowsPerPage+1)} - {Math.min(filtered.length, pageSafe*rowsPerPage)} de {filtered.length}</div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" disabled={pageSafe<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</button>
          <div className="px-2 py-1 rounded border bg-gray-50">{pageSafe} / {totalPages}</div>
          <button className="btn btn-sm" disabled={pageSafe>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Siguiente</button>
        </div>
      </div>
    </div>
  )
}

export type { SearchField }