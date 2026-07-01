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
  Pencil,
} from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { queryClient } from '@/services/queryClient'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import type { CampaignData, DatabaseData, Campaign } from '@/types'
import { EditableCell } from '@/components/common/EditableCell'
import { MaximizableView } from '@/components/common/MaximizableView'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

const EMPTY_ARRAY: any[] = []

const RecipientTableContent: React.FC<{
  isMaximized: boolean
  onToggleMaximize: () => void
  contextId: string
  contextType: 'campaign' | 'database'
}> = ({ isMaximized, onToggleMaximize, contextId, contextType }) => {
  const { data: campaignData } = useQuery<CampaignData>({
    queryKey: ['campaignData', contextId],
    enabled: contextType === 'campaign',
  })
  const { data: databaseData } = useQuery<DatabaseData>({
    queryKey: ['databaseData', contextId],
    enabled: contextType === 'database',
  })
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ['campaigns'] })

  const recipients =
    contextType === 'campaign'
      ? (campaignData?.recipients ?? EMPTY_ARRAY)
      : (databaseData?.recipients ?? EMPTY_ARRAY)

  const campaign = campaigns?.find((c) => c.id === contextId)
  const showAttachments =
    contextType === 'campaign' ? (campaign?.send_attachments ?? false) : false

  const setPreviewRecipient = useAppStore((state) => state.setPreviewRecipient)
  const recipientIssues = useAppStore((state) => state.recipientIssues)
  const selectedRecipientIndices = useAppStore(
    (state) => state.selectedRecipientIndices,
  )
  const toggleRecipientSelection = useAppStore(
    (state) => state.toggleRecipientSelection,
  )
  const selectAllRecipients = useAppStore((state) => state.selectAllRecipients)
  const clearRecipientSelection = useAppStore(
    (state) => state.clearRecipientSelection,
  )
  const setShowAddRecipientModal = useAppStore(
    (state) => state.setShowAddRecipientModal,
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showColDropdown, setShowColDropdown] = useState(false)
  const [renamingCol, setRenamingCol] = useState<string | null>(null)
  const [newColName, setNewColName] = useState('')

  const isAllSelected =
    recipients.length > 0 && selectedRecipientIndices.size === recipients.length

  const handleSelectAll = () => {
    if (isAllSelected) clearRecipientSelection()
    else selectAllRecipients(recipients.length)
  }

  useDebouncedEffect(
    () => {
      if (contextId && recipients.length > 0) {
        if (contextType === 'campaign') {
          apiService.saveRecipients(contextId, recipients)
        } else {
          apiService.saveDatabaseData(contextId, recipients)
        }
      }
    },
    1500,
    [recipients],
  )

  const handleCellChange = (index: number, field: string, value: string) => {
    const newRecipients = [...recipients]
    newRecipients[index] = { ...newRecipients[index], [field]: value }
    if (contextType === 'campaign') {
      queryClient.setQueryData<CampaignData>(
        ['campaignData', contextId],
        (old) => (old ? { ...old, recipients: newRecipients } : old),
      )
    } else {
      queryClient.setQueryData<DatabaseData>(
        ['databaseData', contextId],
        (old) => (old ? { ...old, recipients: newRecipients } : old),
      )
    }
  }

  const submitRename = () => {
    if (
      !renamingCol ||
      !newColName.trim() ||
      renamingCol === newColName.trim()
    ) {
      setRenamingCol(null)
      return
    }
    const newKey = newColName.trim()
    const newRecipients = recipients.map((r) => {
      const copy = { ...r }
      copy[newKey] = copy[renamingCol]
      delete copy[renamingCol]
      return copy
    })

    if (contextType === 'campaign') {
      queryClient.setQueryData<CampaignData>(
        ['campaignData', contextId],
        (old) => (old ? { ...old, recipients: newRecipients } : old),
      )
      apiService.saveRecipients(contextId, newRecipients)
    } else {
      queryClient.setQueryData<DatabaseData>(
        ['databaseData', contextId],
        (old) => (old ? { ...old, recipients: newRecipients } : old),
      )
      apiService.saveDatabaseData(contextId, newRecipients)
    }
    setRenamingCol(null)
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
    if (recipients.length === 0) return EMPTY_ARRAY
    const keys = Object.keys(recipients[0]).filter(
      (k) => k !== 'Status' && k !== 'SentTimestamp',
    )

    const cols: any[] = [
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
    ]

    if (contextType === 'campaign') {
      cols.push({
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
      })
    }

    keys.forEach((k) => {
      if (!showAttachments && k === 'AttachmentFile') return

      const canRename = k !== 'Email' && k !== 'Name' && k !== 'AttachmentFile'

      cols.push({
        accessorKey: k,
        header: () => (
          <div className="flex items-center gap-2 group">
            <span>{k}</span>
            {canRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setRenamingCol(k)
                  setNewColName(k)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-element-hover text-text-secondary transition-opacity"
                title="Rename Column"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
        ),
        cell: ({ row, getValue }: any) => (
          <EditableCell
            value={getValue() as string}
            onSave={(val) => handleCellChange(row.index, k, val)}
            onView={
              k === 'AttachmentFile' &&
              showAttachments &&
              getValue() &&
              contextType === 'campaign'
                ? () => {
                    const files = (getValue() as string)
                      .split(';')
                      .map((f) => f.trim())
                      .filter(Boolean)
                    if (files.length > 0)
                      window.open(
                        `/attachments/${contextId}/${row.index}?file=${encodeURIComponent(files[0])}`,
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

    if (contextType === 'campaign') {
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
    }

    return cols
  }, [
    recipients,
    selectedRecipientIndices,
    isAllSelected,
    showAttachments,
    contextId,
    contextType,
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
          {!showAttachments && contextType === 'campaign' && (
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
              else if (
                contextType === 'campaign' &&
                (issue?.type === 'error' || status === 'ERROR')
              )
                rowClasses =
                  'bg-status-danger-bg/20 hover:bg-status-danger-bg/30'
              else if (contextType === 'campaign' && issue?.type === 'warning')
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

      {renamingCol && (
        <Modal
          isOpen={true}
          onClose={() => setRenamingCol(null)}
          title="Rename Column"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                New Column Name
              </label>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setRenamingCol(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitRename}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function RecipientTable({
  contextId,
  contextType,
}: {
  contextId: string
  contextType: 'campaign' | 'database'
}) {
  return (
    <MaximizableView layoutId="recipient-table-container">
      {({ isMaximized, onToggle }) => (
        <RecipientTableContent
          isMaximized={isMaximized}
          onToggleMaximize={onToggle}
          contextId={contextId}
          contextType={contextType}
        />
      )}
    </MaximizableView>
  )
}
