import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiService } from '@/services/apiService'
import type { Config, Account } from '@/types'
import { Button } from '@/components/common/Button'
import {
  Server,
  Trash2,
  Plus,
  Edit2,
  Star,
  Save,
  Mail,
  Globe,
  Shield,
  Key,
  Info,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Modal } from '@/components/common/Modal'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

const DetailRow = ({
  icon,
  label,
  value,
  valueClass = 'text-text-primary',
  isCode = false,
}: any) => (
  <div className="flex items-center justify-between py-2 border-b border-borders-primary/30 last:border-0">
    <div className="flex items-center gap-2 text-text-secondary text-sm">
      <div className="text-text-tertiary">{icon}</div>
      <span>{label}</span>
    </div>
    <div
      className="text-sm text-right max-w-[60%] truncate"
      title={String(value)}
    >
      {isCode ? (
        <code
          className={`bg-surface-element border border-borders-primary/50 px-2 py-1 rounded text-xs font-mono shadow-inner ${valueClass}`}
        >
          {value}
        </code>
      ) : (
        <span className={`font-medium ${valueClass}`}>{value}</span>
      )}
    </div>
  </div>
)

function SettingsPage() {
  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const accounts = config?.accounts || []

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Partial<Account> | null>(
    null,
  )

  const handleClear = () => {
    apiService.clearConfig()
    toast.success('Settings cleared successfully.')
    setShowClearConfirm(false)
  }

  const handleEditAccount = (acc: Account) => {
    setEditingAccount({ ...acc })
  }

  const handleCreateAccount = () => {
    setEditingAccount({
      name: '',
      smtp_server: '',
      smtp_port: 587,
      sender_email: '',
      sender_password: '',
      use_ssl: false,
      is_default: accounts.length === 0,
    })
  }

  const handleDeleteAccount = (id: string) => {
    const newAccounts = accounts.filter((a) => a.id !== id)
    if (newAccounts.length > 0 && !newAccounts.some((a) => a.is_default)) {
      newAccounts[0].is_default = true
    }
    apiService.saveConfig({ accounts: newAccounts })
    toast.success('Account deleted.')
  }

  const handleSetDefault = (id: string) => {
    const newAccounts = accounts.map((a) => ({
      ...a,
      is_default: a.id === id,
    }))
    apiService.saveConfig({ accounts: newAccounts })
    toast.success('Default account updated.')
  }

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return

    let newAccounts = [...accounts]
    const accToSave = { ...editingAccount }

    if (accToSave.is_default) {
      newAccounts = newAccounts.map((a) => ({ ...a, is_default: false }))
    }

    if (accToSave.id) {
      newAccounts = newAccounts.map((a) =>
        a.id === accToSave.id ? ({ ...a, ...accToSave } as Account) : a,
      )
    } else {
      newAccounts.push({
        ...accToSave,
        id: crypto.randomUUID(),
      } as Account)
    }

    apiService.saveConfig({ accounts: newAccounts })
    toast.success('Account saved.')
    setEditingAccount(null)
  }

  const isGmail =
    editingAccount?.smtp_server?.toLowerCase().includes('gmail.com') ||
    editingAccount?.sender_email?.toLowerCase().includes('@gmail.com')

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
              Global Settings
            </h1>
            <p className="text-text-secondary text-sm">
              Manage your email sender accounts and SMTP server configurations.
            </p>
          </div>
          <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
            <Trash2 size={16} />
            Clear All Settings
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between bg-surface-header p-4 border-b border-borders-primary">
            <div className="flex items-center gap-2 text-text-primary">
              <Server size={20} className="text-accent-blue" />
              <h2 className="text-xl font-semibold">Sender Accounts</h2>
            </div>
            <Button variant="primary" onClick={handleCreateAccount}>
              <Plus size={16} /> Add Account
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className={`bg-surface-card p-6 rounded-2xl border transition-all duration-200 group flex flex-col ${
                  acc.is_default
                    ? 'border-accent-blue/50 shadow-[0_0_20px_rgba(59,130,246,0.05)] bg-accent-blue/[0.02]'
                    : 'border-borders-primary hover:border-borders-primary/80 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-text-primary text-lg tracking-tight">
                        {acc.name || acc.sender_email}
                      </h3>
                      {acc.is_default && (
                        <span className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Star size={10} className="fill-current" /> Default
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {!acc.is_default && (
                      <button
                        onClick={() => handleSetDefault(acc.id)}
                        className="p-2 text-text-secondary hover:text-accent-blue hover:bg-surface-element rounded-lg transition-colors"
                        title="Set as default"
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditAccount(acc)}
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-element rounded-lg transition-colors"
                      title="Edit account"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-2 text-text-secondary hover:text-status-danger-text hover:bg-surface-element rounded-lg transition-colors"
                      title="Delete account"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-grow flex flex-col justify-end">
                  <div className="bg-background-base rounded-xl p-4 border border-borders-primary/50">
                    <DetailRow
                      icon={<Mail size={15} />}
                      label="Email Address"
                      value={acc.sender_email}
                    />
                    <DetailRow
                      icon={<Globe size={15} />}
                      label="SMTP Server"
                      value={`${acc.smtp_server}:${acc.smtp_port}`}
                      isCode
                    />
                    <DetailRow
                      icon={<Shield size={15} />}
                      label="SSL/TLS"
                      value={acc.use_ssl ? 'Enabled' : 'Disabled'}
                      valueClass={
                        acc.use_ssl
                          ? 'text-status-success-text'
                          : 'text-text-secondary'
                      }
                    />
                    <DetailRow
                      icon={<Key size={15} />}
                      label="Password"
                      value={acc.sender_password || 'Not configured'}
                      valueClass={
                        !acc.sender_password
                          ? 'text-status-danger-text'
                          : 'text-text-primary'
                      }
                      isCode={!!acc.sender_password}
                    />
                  </div>
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-borders-primary rounded-2xl bg-surface-element/30">
                <Server size={48} className="text-text-tertiary mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No accounts configured
                </h3>
                <p className="text-sm text-text-secondary max-w-md text-center mb-6">
                  Add an SMTP sender account to start sending emails. You can
                  configure multiple accounts and set a default.
                </p>
                <Button variant="primary" onClick={handleCreateAccount}>
                  <Plus size={16} /> Add Your First Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Settings"
        message="Are you sure you want to completely clear all SMTP configurations? This action cannot be undone."
        confirmText="Clear Settings"
        isDestructive={true}
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
      />

      {editingAccount && (
        <Modal
          isOpen={true}
          onClose={() => setEditingAccount(null)}
          title={editingAccount.id ? 'Edit Account' : 'New Account'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveAccount} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Account Name (Alias)
                </label>
                <input
                  type="text"
                  value={editingAccount.name || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Marketing Team"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  SMTP Server
                </label>
                <input
                  type="text"
                  value={editingAccount.smtp_server || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      smtp_server: e.target.value,
                    })
                  }
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
                  value={editingAccount.smtp_port || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      smtp_port: Number(e.target.value),
                    })
                  }
                  placeholder="587"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Sender Email
                </label>
                <input
                  type="email"
                  value={editingAccount.sender_email || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      sender_email: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Sender Password / App Password
                </label>
                <input
                  type="text"
                  value={editingAccount.sender_password || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      sender_password: e.target.value,
                    })
                  }
                  placeholder="Enter password"
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue font-mono text-sm"
                  required={!editingAccount.has_password}
                />

                {isGmail && (
                  <div className="mt-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg flex items-start gap-3">
                    <Info
                      className="text-accent-blue mt-0.5 flex-shrink-0"
                      size={18}
                    />
                    <div className="text-sm text-text-secondary">
                      <p className="font-semibold text-accent-blue mb-1">
                        Using Gmail?
                      </p>
                      <p className="mb-2 leading-relaxed">
                        Google blocks SMTP access with your normal account
                        password. You must generate a 16-character{' '}
                        <strong>App Password</strong> and paste it here instead.
                      </p>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:text-accent-blue/80 transition-colors bg-accent-blue/10 px-3 py-1.5 rounded-md"
                      >
                        Generate Google App Password <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 bg-surface-element p-4 rounded-lg border border-borders-primary/50">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    id="use_ssl"
                    checked={editingAccount.use_ssl || false}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        use_ssl: e.target.checked,
                      })
                    }
                    className="custom-checkbox"
                  />
                  <label
                    htmlFor="use_ssl"
                    className="text-sm font-medium text-text-primary cursor-pointer select-none"
                  >
                    Use SSL/TLS (Port 465 usually)
                  </label>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={editingAccount.is_default || false}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        is_default: e.target.checked,
                      })
                    }
                    className="custom-checkbox"
                  />
                  <label
                    htmlFor="is_default"
                    className="text-sm font-medium text-text-primary cursor-pointer select-none"
                  >
                    Default Account
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-borders-primary">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingAccount(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                <Save size={18} />
                Save Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
