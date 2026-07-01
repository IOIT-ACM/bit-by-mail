import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { apiService } from '@/services/apiService'
import type { Config } from '@/types'
import { Button } from '@/components/common/Button'
import { Save, Server, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const [formData, setFormData] = useState<Partial<Config>>({})
  const [password, setPassword] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData(config)
    }
  }, [config])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (name === 'sender_password') {
      setPassword(value)
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === 'checkbox'
            ? checked
            : type === 'number'
              ? Number(value)
              : value,
      }))
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    apiService.saveConfig(formData, password ? password : undefined)
    toast.success('Settings saved successfully.')
    if (password) setPassword('')
  }

  const handleClear = () => {
    apiService.clearConfig()
    toast.success('Settings cleared successfully.')
    setShowClearConfirm(false)
    setPassword('')
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
            <Trash2 size={16} />
            Clear Settings
          </Button>
        </div>
        <form onSubmit={handleSave} className="space-y-8">
          <section className="bg-surface-card p-6 rounded-card border border-borders-primary shadow-card">
            <div className="flex items-center gap-2 mb-6 text-text-primary">
              <Server size={20} />
              <h2 className="text-xl font-semibold">SMTP Configuration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  SMTP Server
                </label>
                <input
                  type="text"
                  name="smtp_server"
                  value={formData.smtp_server || ''}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  name="smtp_port"
                  value={formData.smtp_port || ''}
                  onChange={handleChange}
                  placeholder="587"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Sender Email
                </label>
                <input
                  type="email"
                  name="sender_email"
                  value={formData.sender_email || ''}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Sender Password / App Password
                </label>
                <input
                  type="password"
                  name="sender_password"
                  value={password}
                  onChange={handleChange}
                  placeholder={
                    config?.sender_password
                      ? '••••••••'
                      : 'Leave blank to keep unchanged'
                  }
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use_ssl"
                  name="use_ssl"
                  checked={formData.use_ssl || false}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <label
                  htmlFor="use_ssl"
                  className="text-sm font-medium text-text-primary"
                >
                  Use SSL/TLS (Port 465 usually)
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary">
              <Save size={18} />
              Save Settings
            </Button>
          </div>
        </form>
      </div>
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Settings"
        message="Are you sure you want to completely clear your global SMTP configuration? This action cannot be undone."
        confirmText="Clear Settings"
        isDestructive={true}
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  )
}
