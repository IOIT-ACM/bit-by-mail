import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import type { RecipientIssue, CampaignData } from '@/types'
import { toast } from 'sonner'
import { queryClient } from '@/services/queryClient'

export const useWebSocket = () => {
  const router = useRouter()
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    addLog,
    setIsSending,
    setIsStopping,
    clearLogs,
    setConnectionStatus,
    setProgress,
    setRecipientIssues,
    clearRecipientIssues,
    setCampaignSummary,
    setShowCampaignSummaryModal,
    setIsPasswordSet,
  } = useAppStore()

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return
    const socket = new WebSocket('ws://localhost:8888/ws')
    ws.current = socket
    apiService.setSocket(socket)
    setConnectionStatus('connecting')

    socket.onopen = () => {
      setConnectionStatus('open')
      apiService.flushQueue()
      apiService.getCampaigns()
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
    }

    socket.onclose = () => {
      setConnectionStatus('closed')
      reconnectTimeout.current = setTimeout(connect, 3000)
    }

    socket.onerror = () => {
      setConnectionStatus('closed')
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const { action, payload } = data

      switch (action) {
        case 'initial_data':
          queryClient.setQueryData(['campaigns'], payload.campaigns)
          queryClient.setQueryData(['config'], payload.config)
          setIsPasswordSet(payload.is_password_set)
          apiService.handleResponse('initial_data', payload)
          apiService.handleResponse('campaigns_list', payload.campaigns)
          break
        case 'campaigns_list':
          queryClient.setQueryData(['campaigns'], payload)
          apiService.handleResponse('campaigns_list', payload)
          break
        case 'campaign_created':
          queryClient.invalidateQueries({ queryKey: ['campaigns'] })
          router.navigate({
            to: '/campaigns/$campaignId',
            params: { campaignId: payload.id },
          })
          break
        case 'campaign_data':
          queryClient.setQueryData(
            ['campaignData', payload.campaign_id],
            payload,
          )
          apiService.handleResponse('campaign_data', payload)
          clearLogs()
          const currentConfig = queryClient.getQueryData(['config'])
          apiService.runPreflightCheck(
            payload.campaign_id,
            currentConfig as any,
          )
          break
        case 'recipients_updated':
          {
            const matches = router.state.matches
            const currentMatch = matches[matches.length - 1]
            const params = currentMatch?.params as Record<
              string,
              string | undefined
            >
            const campaignId = params?.campaignId
            if (campaignId) {
              queryClient.setQueryData<CampaignData>(
                ['campaignData', campaignId],
                (old) => (old ? { ...old, recipients: payload } : old),
              )
              toast.success(`${payload.length} recipients loaded successfully`)
              apiService.runPreflightCheck(campaignId)
            }
          }
          break
        case 'mailing_started':
          setIsSending(true)
          setIsStopping(false)
          setProgress(0, payload.total_to_send)
          break
        case 'status_update':
          {
            const statusLevelMap: { [key: string]: string } = {
              SENT: 'success',
              ERROR: 'error',
              SKIPPED: 'warn',
            }
            const level = statusLevelMap[payload.status.toUpperCase()] || 'info'
            addLog({
              level,
              message: `To: ${payload.email} - ${payload.details}`,
            })

            const matchesStatus = router.state.matches
            const currentMatchStatus = matchesStatus[matchesStatus.length - 1]
            const paramsStatus = currentMatchStatus?.params as Record<
              string,
              string | undefined
            >
            const campaignIdStatus = paramsStatus?.campaignId
            if (campaignIdStatus) {
              queryClient.setQueryData<CampaignData>(
                ['campaignData', campaignIdStatus],
                (old) =>
                  old ? { ...old, recipients: payload.recipients } : old,
              )
            }
            setProgress(payload.sent_count, payload.total_to_send)
          }
          break
        case 'log':
          addLog({ level: payload.level, message: payload.message })
          break
        case 'finish':
          setIsSending(false)
          setIsStopping(false)
          break
        case 'preflight_result':
          clearRecipientIssues()
          addLog({ level: 'info', message: '--- PREFLIGHT CHECK RESULTS ---' })
          if (payload.successes && payload.successes.length > 0) {
            addLog({ level: 'info', message: 'CHECKS PASSED:' })
            payload.successes.forEach((msg: string) =>
              addLog({ level: 'success', message: `+ ${msg}` }),
            )
          }
          if (payload.errors && payload.errors.length > 0) {
            addLog({ level: 'info', message: 'ERRORS:' })
            payload.errors.forEach((err: string) =>
              addLog({ level: 'error', message: `- ${err}` }),
            )
          }
          if (payload.warnings && payload.warnings.length > 0) {
            addLog({ level: 'info', message: 'WARNINGS:' })
            payload.warnings.forEach((warn: string) =>
              addLog({ level: 'warn', message: `! ${warn}` }),
            )
          }
          if (payload.ok) {
            addLog({
              level: 'success',
              message: 'Preflight complete. System is ready.',
            })
          } else {
            toast.error('Preflight failed. See logs for details.')
            addLog({
              level: 'error',
              message: 'Preflight failed. Please resolve the errors above.',
            })
          }
          addLog({ level: 'info', message: '-----------------------------' })
          const issues: Record<number, RecipientIssue> = {}
          if (
            payload.recipient_issues &&
            Array.isArray(payload.recipient_issues)
          ) {
            payload.recipient_issues.forEach((issue: any) => {
              if (typeof issue.index === 'number') {
                issues[issue.index] = {
                  type: issue.type,
                  message: issue.message,
                  index: issue.index,
                }
              }
            })
          }
          setRecipientIssues(issues)
          break
        case 'campaign_summary':
          setCampaignSummary(payload)
          setShowCampaignSummaryModal(true)
          break
        case 'report_generated':
          toast.success('Report generated and download started.')
          const link = document.createElement('a')
          link.href = payload.url
          link.setAttribute(
            'download',
            payload.url.split('/').pop() || 'report.csv',
          )
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          break
      }
    }
  }, [
    addLog,
    setIsSending,
    setIsStopping,
    clearLogs,
    setProgress,
    setRecipientIssues,
    clearRecipientIssues,
    setCampaignSummary,
    setShowCampaignSummaryModal,
    setIsPasswordSet,
    setConnectionStatus,
    router,
  ])

  useEffect(() => {
    connect()
    return () => {
      if (ws.current) {
        ws.current.close()
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      apiService.setSocket(null)
    }
  }, [connect])
}
