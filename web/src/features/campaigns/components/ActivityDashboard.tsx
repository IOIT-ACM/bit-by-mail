import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { apiService } from '@/services/apiService'
import {
  BarChart3,
  AlertCircle,
  Mail,
  FastForward,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  LayoutTemplate,
  Calendar,
  Server,
  Download,
} from 'lucide-react'
import type {
  CampaignAnalytics,
  CampaignEvent,
  CampaignData,
  Campaign,
  Database as DatabaseType,
  EmailTemplate,
  Config,
} from '@/types'
import { Button } from '@/components/common/Button'

const getEventIcon = (type: string) => {
  switch (type) {
    case 'SENT':
      return <CheckCircle2 size={14} className="text-status-success-text" />
    case 'ERROR':
      return <AlertCircle size={14} className="text-status-danger-text" />
    case 'SKIPPED':
      return <FastForward size={14} className="text-accent-orange" />
    default:
      return <Mail size={14} className="text-text-secondary" />
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'SENT':
      return 'text-status-success-text bg-status-success-bg/20 border-status-success-bg/30'
    case 'ERROR':
      return 'text-status-danger-text bg-status-danger-bg/20 border-status-danger-bg/30'
    case 'SKIPPED':
      return 'text-accent-orange bg-accent-orange/10 border-accent-orange/20'
    default:
      return 'text-text-secondary bg-surface-element border-borders-primary'
  }
}

export const ActivityDashboard: React.FC<{ campaignId: string }> = ({
  campaignId,
}) => {
  useEffect(() => {
    apiService.getCampaignAnalytics(campaignId)
    apiService.getCampaignEvents(campaignId)
    apiService.getDatabases()
    apiService.getGlobalTemplates()

    const interval = setInterval(() => {
      apiService.getCampaignAnalytics(campaignId)
      apiService.getCampaignEvents(campaignId)
    }, 5000)

    return () => clearInterval(interval)
  }, [campaignId])

  const { data: analytics } = useQuery<CampaignAnalytics>({
    queryKey: ['campaignAnalytics', campaignId],
  })
  const { data: events } = useQuery<CampaignEvent[]>({
    queryKey: ['campaignEvents', campaignId],
  })
  const { data: campaignData } = useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
  })
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ['campaigns'] })
  const { data: databases } = useQuery<DatabaseType[]>({
    queryKey: ['databases'],
  })
  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })
  const { data: config } = useQuery<Config>({ queryKey: ['config'] })

  const campaign = campaigns?.find((c) => c.id === campaignId)
  const db = databases?.find((d) => d.id === campaign?.sourceDbId)
  const tpl = templates?.find((t) => t.id === campaign?.sourceTemplateId)
  const acc =
    config?.accounts?.find((a) => a.id === campaign?.sender_account_id) ||
    config?.accounts?.find((a) => a.is_default)

  const sentCount = analytics?.['SENT'] || 0
  const errorCount = analytics?.['ERROR'] || 0
  const skippedCount = analytics?.['SKIPPED'] || 0
  const totalEvents = sentCount + errorCount + skippedCount
  const totalRecipients =
    campaignData?.recipients?.length || campaign?.recipientCount || 0
  const progressPercent =
    totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0

  const mergedData = useMemo(() => {
    if (!events) return []
    const recMap = new Map(
      campaignData?.recipients?.map((r) => [r.Email, r]) || [],
    )
    return events.map((ev) => {
      const rec = recMap.get(ev.recipient_email)
      return {
        ...ev,
        recipientName: rec?.Name || 'Unknown',
        attachmentFile: rec?.AttachmentFile || 'None',
      }
    })
  }, [events, campaignData])

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ])

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'event_type',
        header: 'Status',
        cell: ({ getValue }) => {
          const type = getValue() as string
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${getEventColor(type)}`}
            >
              {getEventIcon(type)}
              {type}
            </span>
          )
        },
        size: 130,
      },
      {
        accessorKey: 'recipientName',
        header: 'Name',
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'recipient_email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-text-secondary">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'attachmentFile',
        header: 'Attachments',
        cell: ({ getValue }) => {
          const val = getValue() as string
          return (
            <span
              className="text-text-tertiary text-xs truncate max-w-[150px] block"
              title={val}
            >
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: 'event_data',
        header: 'Details',
        cell: ({ getValue, row }) => {
          let val = getValue() as string
          if (!val || val.trim() === '') {
            if (row.original.event_type === 'SENT')
              val = 'Email dispatched successfully.'
            else if (row.original.event_type === 'SKIPPED')
              val = 'Missing email address or data.'
            else val = 'No details provided.'
          }
          return (
            <span
              className="text-text-secondary truncate max-w-xs block"
              title={val}
            >
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Time',
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string)
          return (
            <span className="text-text-tertiary text-xs font-mono">
              {date.toLocaleString()}
            </span>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: mergedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleExport = () => {
    if (mergedData.length === 0) return
    const headers = ['Status', 'Name', 'Email', 'Details', 'Time']
    const csvRows = [headers.join(',')]

    mergedData.forEach((row) => {
      const time = new Date(row.created_at).toLocaleString().replace(/,/g, '')
      const details = (row.event_data || '').replace(/,/g, ' ')
      csvRows.push(
        `${row.event_type},${row.recipientName},${row.recipient_email},${details},${time}`,
      )
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign_${campaignId}_activity.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a24] backdrop-blur-xl border border-borders-primary/80 rounded-2xl p-6 shadow-sm ring-1 ring-accent-blue/20">
      <div className="flex items-center gap-2 mb-6 flex-shrink-0">
        <BarChart3 size={24} className="text-accent-blue" />
        <h2 className="text-xl font-bold text-text-primary">
          Dispatch History
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 flex-shrink-0">
        <div className="lg:col-span-1 bg-surface-element border border-borders-primary rounded-xl p-5 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
            Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-text-secondary" />
              <span className="text-sm text-text-primary truncate">
                Created:{' '}
                {campaign?.createdAt
                  ? new Date(campaign.createdAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Database size={16} className="text-text-secondary" />
              <span className="text-sm text-text-primary truncate">
                Database: {db ? db.name : 'Custom CSV Upload'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LayoutTemplate size={16} className="text-text-secondary" />
              <span className="text-sm text-text-primary truncate">
                Template: {tpl ? tpl.name : 'Custom Design'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Server size={16} className="text-text-secondary" />
              <span className="text-sm text-text-primary truncate">
                Sender: {acc ? acc.sender_email : 'Not configured'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-element border border-borders-primary rounded-xl p-4 flex flex-col">
              <span className="text-sm font-medium text-text-secondary mb-1">
                Total Attempts
              </span>
              <span className="text-3xl font-bold text-text-primary">
                {totalEvents}
              </span>
            </div>
            <div className="bg-surface-element border border-borders-primary rounded-xl p-4 flex flex-col">
              <span className="text-sm font-medium text-text-secondary mb-1">
                Successful Sends
              </span>
              <span className="text-3xl font-bold text-status-success-text">
                {sentCount}
              </span>
            </div>
            <div className="bg-surface-element border border-borders-primary rounded-xl p-4 flex flex-col">
              <span className="text-sm font-medium text-text-secondary mb-1">
                Failures
              </span>
              <span className="text-3xl font-bold text-status-danger-text">
                {errorCount}
              </span>
            </div>
            <div className="bg-surface-element border border-borders-primary rounded-xl p-4 flex flex-col">
              <span className="text-sm font-medium text-text-secondary mb-1">
                Skipped
              </span>
              <span className="text-3xl font-bold text-accent-orange">
                {skippedCount}
              </span>
            </div>
          </div>

          <div className="bg-surface-element border border-borders-primary rounded-xl p-5 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-text-primary">
                  Campaign Progress
                </span>
                <span className="text-xs font-mono text-text-secondary">
                  {sentCount} / {totalRecipients} ({Math.round(progressPercent)}
                  %)
                </span>
              </div>
              <div className="w-full bg-surface-card rounded-full h-2.5 border border-borders-primary overflow-hidden">
                <div
                  className="bg-accent-blue h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-grow min-h-0 border border-borders-primary rounded-xl bg-surface-element">
        <div className="bg-surface-header px-4 py-3 border-b border-borders-primary flex justify-between items-center flex-shrink-0">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Activity Log
          </h3>
          <Button
            variant="secondary"
            onClick={handleExport}
            className="h-8 px-3 text-xs"
          >
            <Download size={14} />
            Export CSV
          </Button>
        </div>

        <div className="overflow-auto flex-grow custom-scrollbar bg-[#1e1e2a] rounded-b-xl">
          {mergedData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
              No activity recorded yet.
            </div>
          ) : (
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-text-secondary uppercase sticky top-0 bg-[#1e1e2a] z-30 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 border-b border-borders-primary whitespace-nowrap bg-[#1e1e2a]"
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : 'auto',
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-1 hover:text-text-primary'
                                : 'flex items-center'
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
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-borders-primary/30 last:border-0 hover:bg-surface-element/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
