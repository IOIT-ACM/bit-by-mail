import { useQuery } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { SortingState, VisibilityState } from '@tanstack/react-table'
import {
  Eye,
  Maximize,
  Minimize,
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  Columns,
} from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { queryClient } from '@/services/queryClient'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import type { CampaignData, Config, Recipient } from '@/types'
import { EditableCell } from '@/components/common/EditableCell'
import { MaximizableView } from '@/components/common/MaximizableView'

const RecipientTableContent: React.FC<{
  isMaximized: boolean
  onToggleMaximize: () => void
  campaignId: string
}> = ({ isMaximized, onToggleMaximize, campaignId }) => {
  const { data } = useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
  })
  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const recipients = data?.recipients ?? []
  const showAttachments = config?.send_attachments ?? true

  const {
    setPreviewRecipient,
    recipientIssues,
    selectedRecipientIndices,
    toggleRecipientSelection,
    selectAllRecipients,
    clearRecipientSelection,
    setShowAddRecipientModal,
  } = useAppStore()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showColDropdown, setShowColDropdown] = useState(false)

  const isAllSelected =
    recipients.length > 0 && selectedRecipientIndices.size === recipients.length

  const handleSelectAll = () => {
    if (isAllSelected) clearRecipientSelection()
    else selectAllRecipients(recipients.length)
  }

  useDebouncedEffect(
    () => {
      if (campaignId && recipients.length > 0) {
        apiService.saveRecipients(campaignId, recipients)
      }
    },
    1500,
    [recipients],
  )

  const handleCellChange = (index: number, field: string, value: string) => {
    const newRecipients = [...recipients]
    newRecipients[index] = { ...newRecipients[index], [field]: value }
    queryClient.setQueryData<CampaignData>(
      ['campaignData', campaignId],
      (old) => (old ? { ...old, recipients: newRecipients } : old),
    )
  }

  const exportCSV = () => {
    if (recipients.length === 0) return
    const keys = Object.keys(recipients[0])
    const csvRows = [
      keys.join(','),
      ...recipients.map((row) =>
        keys
          .map((k) => `"${String(row[k] || '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recipients_export.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = useMemo(() => {
    if (recipients.length === 0) return []
    const keys = Object.keys(recipients[0]).filter(
      (k) => k !== 'Status' && k !== 'SentTimestamp',
    )

    const cols = [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="custom-checkbox m-2"
          />
        ),
        cell: ({ row }: any) => (
          <div className="text-center">
            <input
              type="checkbox"
              checked={selectedRecipientIndices.has(row.index)}
              onChange={() => toggleRecipientSelection(row.index)}
              className="custom-checkbox"
            />
          </div>
        ),
        enableSorting: false,
        size: 50,
      },
      {
        id: 'preview',
        header: '',
        cell: ({ row }: any) => (
          <div className="text-center">
            <button
              onClick={() => setPreviewRecipient(row.original)}
              aria-label="Preview Email"
              className="p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-element-hover transition-colors"
            >
              <Eye size={16} />
            </button>
          </div>
        ),
        enableSorting: false,
        size: 40,
      },
    ]

    keys.forEach((k) => {
      if (!showAttachments && k === 'AttachmentFile') return
      cols.push({
        accessorKey: k,
        header: k,
        cell: ({ row, getValue }: any) => (
          <EditableCell
            value={getValue() as string}
            onSave={(val) => handleCellChange(row.index, k, val)}
            onView={
              k === 'AttachmentFile' && showAttachments && getValue()
                ? () => {
                    const files = (getValue() as string)
                      .split(';')
                      .map((f) => f.trim())
                      .filter(Boolean)
                    if (files.length > 0)
                      window.open(
                        `/attachments/${campaignId}/${row.index}?file=${encodeURIComponent(files[0])}`,
                        '_blank',
                      )
                  }
                : undefined
            }
          />
        ),
        size: k === 'Email' ? 200 : 150,
      })
    })

    cols.push({
      accessorKey: 'Status',
      header: 'Status',
      cell: ({ getValue }: any) => {
        const status = getValue() as string
        let classes = 'bg-surface-element text-text-secondary'
        if (status?.toUpperCase() === 'SENT')
          classes = 'bg-status-success-bg text-status-success-text'
        if (status?.toUpperCase() === 'ERROR')
          classes = 'bg-status-danger-bg text-status-danger-text'
        if (status?.toUpperCase() === 'SKIPPED')
          classes = 'bg-status-info-bg text-status-info-text'

        return (
          <div className="text-center">
            <span
              className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${classes}`}
            >
              {status || 'PENDING'}
            </span>
          </div>
        )
      },
      size: 100,
    })

    return cols
  }, [
    recipients,
    selectedRecipientIndices,
    isAllSelected,
    showAttachments,
    campaignId,
  ])

  const table = useReactTable({
    data: recipients,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="p-2 flex flex-col h-full overflow-hidden relative">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-heading-3 font-medium text-text-primary">
              Recipients ({recipients.length})
            </h2>
            <button
              onClick={() => setShowAddRecipientModal(true)}
              aria-label="Add Recipient"
              className="p-1.5 rounded-full text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {!showAttachments && (
            <p className="text-sm text-text-secondary italic mt-1">
              Attachments disabled.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {recipients.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowColDropdown(!showColDropdown)}
                  className="p-1.5 rounded-md text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors"
                  title="Toggle Columns"
                >
                  <Columns size={16} />
                </button>
                {showColDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-card border border-borders-primary rounded-md shadow-lg z-50 p-2">
                    <div className="text-xs font-semibold text-text-tertiary mb-2 uppercase px-2">
                      Columns
                    </div>
                    {table.getAllLeafColumns().map((col) => {
                      if (
                        col.id === 'select' ||
                        col.id === 'preview' ||
                        col.id === 'Status'
                      )
                        return null
                      return (
                        <label
                          key={col.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-element rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={col.getIsVisible()}
                            onChange={col.getToggleVisibilityHandler()}
                            className="custom-checkbox"
                          />
                          <span className="text-sm truncate">{col.id}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={exportCSV}
                className="p-1.5 rounded-md text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors"
                title="Export CSV"
              >
                <Download size={16} />
              </button>
            </>
          )}
          <button
            onClick={onToggleMaximize}
            aria-label={isMaximized ? 'Minimize Table' : 'Maximize Table'}
            className="p-1.5 rounded-full text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors"
          >
            {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      <div className="overflow-auto flex-grow custom-scrollbar border border-borders-primary rounded-lg bg-[#1e1e2a]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase sticky top-0 bg-[#1e1e2a] z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-3 border-b border-borders-primary whitespace-nowrap"
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : 'auto',
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-1'
                            : 'flex justify-center'
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: <ChevronUp size={14} />,
                          desc: <ChevronDown size={14} />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const issue = recipientIssues[row.index]
              const status = row.original.Status?.toUpperCase()
              let rowClasses = 'hover:bg-surface-element/50 transition-colors'

              if (selectedRecipientIndices.has(row.index))
                rowClasses = 'bg-accent-blue/20 hover:bg-accent-blue/30'
              else if (issue?.type === 'error' || status === 'ERROR')
                rowClasses =
                  'bg-status-danger-bg/20 hover:bg-status-danger-bg/30'
              else if (issue?.type === 'warning')
                rowClasses = 'bg-accent-orange/20 hover:bg-accent-orange/30'

              return (
                <tr
                  key={row.id}
                  className={`border-b border-borders-primary/50 ${rowClasses}`}
                  title={issue?.message}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
            {recipients.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-text-tertiary"
                >
                  No recipients found. Please upload a CSV.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function RecipientTable({ campaignId }: { campaignId: string }) {
  return (
    <MaximizableView layoutId="recipient-table-container">
      {({ isMaximized, onToggle }) => (
        <RecipientTableContent
          isMaximized={isMaximized}
          onToggleMaximize={onToggle}
          campaignId={campaignId}
        />
      )}
    </MaximizableView>
  )
}
