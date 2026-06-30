import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Braces,
  Table,
  Server,
  Rocket,
  Info,
  ChevronDown,
  Settings,
  Database,
  Mail,
  CheckCircle2,
  Library,
} from 'lucide-react'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

interface DocSectionProps {
  title: string
  icon: React.ElementType
  summary: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

const DocSection: React.FC<DocSectionProps> = ({
  title,
  icon: Icon,
  summary,
  children,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-surface-card border border-borders-primary rounded-xl overflow-hidden transition-colors hover:border-borders-primary/80">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 md:p-6 flex items-start gap-4 focus:outline-none group"
      >
        <div className="mt-0.5 flex-shrink-0 bg-surface-element p-2 rounded-lg text-text-secondary group-hover:text-accent-blue transition-colors">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-text-primary mb-1">
            {title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed pr-4 md:pr-8">
            {summary}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-text-tertiary mt-1 flex-shrink-0 bg-surface-element p-1 rounded-full"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="p-5 md:p-6 pt-0 border-t border-borders-primary/50 text-sm text-text-secondary leading-relaxed space-y-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DocsPage() {
  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar bg-background-base">
      <div className="max-w-3xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-10 mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 text-accent-blue text-sm font-medium mb-4 border border-accent-blue/20">
            <BookOpen size={16} />
            <span>Documentation</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 tracking-tight">
            Welcome to bit-by-mail
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-2xl leading-relaxed">
            Everything you need to know to start sending personalized, bulk
            emails directly from your desktop. No prior experience required.
          </p>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          <DocSection
            title="What is bit-by-mail?"
            icon={Info}
            summary="Learn about the application, its primary purpose, and the key features it offers for your mailing needs."
            defaultExpanded={true}
          >
            <p>
              <strong>bit-by-mail</strong> is a powerful, privacy-first desktop
              application designed for sending bulk, personalized emails. Unlike
              traditional SaaS email marketing platforms, this application runs
              locally on your machine and uses your own email provider (SMTP
              server) to send messages.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-surface-element p-4 rounded-lg">
                <h4 className="font-medium text-text-primary mb-1">
                  Private & Free
                </h4>
                <p className="text-xs">
                  Your recipient data never leaves your computer. Because you
                  bring your own email server, there are no monthly subscription
                  fees.
                </p>
              </div>
              <div className="bg-surface-element p-4 rounded-lg">
                <h4 className="font-medium text-text-primary mb-1">
                  Dynamic Templating
                </h4>
                <p className="text-xs">
                  Write one email template and automatically personalize it for
                  hundreds of recipients using variables injected from your CSV.
                </p>
              </div>
              <div className="bg-surface-element p-4 rounded-lg">
                <h4 className="font-medium text-text-primary mb-1">
                  Attachments
                </h4>
                <p className="text-xs">
                  Seamlessly attach personalized files (like PDFs, invoices, or
                  certificates) unique to every single recipient on your list.
                </p>
              </div>
              <div className="bg-surface-element p-4 rounded-lg">
                <h4 className="font-medium text-text-primary mb-1">
                  Safety First
                </h4>
                <p className="text-xs">
                  Built-in "Preflight Checks" simulate your campaign to catch
                  missing variables or broken files before a single email is
                  sent.
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection
            title="Getting Started"
            icon={Rocket}
            summary="A quick, step-by-step guide to configuring the app and sending your very first email campaign."
          >
            <ol className="relative border-l border-borders-primary ml-3 space-y-6">
              <li className="pl-6 relative">
                <span className="absolute -left-[13px] top-0 bg-surface-element border border-borders-primary w-6 h-6 rounded-full flex items-center justify-center text-text-primary">
                  <Settings size={12} />
                </span>
                <h4 className="font-medium text-text-primary mb-1">
                  1. Configure your Email (SMTP)
                </h4>
                <p>
                  Navigate to <strong>Global Settings</strong> and enter your
                  email provider's SMTP details. This gives the app permission
                  to send emails on your behalf.
                </p>
              </li>
              <li className="pl-6 relative">
                <span className="absolute -left-[13px] top-0 bg-surface-element border border-borders-primary w-6 h-6 rounded-full flex items-center justify-center text-text-primary">
                  <Database size={12} />
                </span>
                <h4 className="font-medium text-text-primary mb-1">
                  2. Import your Recipients
                </h4>
                <p>
                  Create a new <strong>Campaign</strong> or{' '}
                  <strong>Database</strong> and upload a CSV file containing
                  your recipients. Your CSV must have at least an Email and Name
                  column.
                </p>
              </li>
              <li className="pl-6 relative">
                <span className="absolute -left-[13px] top-0 bg-surface-element border border-borders-primary w-6 h-6 rounded-full flex items-center justify-center text-text-primary">
                  <Mail size={12} />
                </span>
                <h4 className="font-medium text-text-primary mb-1">
                  3. Write your Email
                </h4>
                <p>
                  Open your campaign and use the rich code editor to write your
                  email. Use placeholders like <code>{`{{Name}}`}</code> to
                  personalize the content for each person.
                </p>
              </li>
              <li className="pl-6 relative">
                <span className="absolute -left-[13px] top-0 bg-surface-element border border-borders-primary w-6 h-6 rounded-full flex items-center justify-center text-status-success-text">
                  <CheckCircle2 size={12} />
                </span>
                <h4 className="font-medium text-text-primary mb-1">
                  4. Preflight & Send
                </h4>
                <p>
                  Click the <strong>Preflight</strong> button. The app will scan
                  your setup to ensure everything is correct. If it passes, hit{' '}
                  <strong>Start Sending</strong>!
                </p>
              </li>
            </ol>
          </DocSection>

          <DocSection
            title="Reusable Databases & Templates"
            icon={Library}
            summary="Save time by building a global library of recipient lists and email designs that can be instantly loaded into any campaign."
          >
            <p className="mb-4">
              Instead of starting from scratch for every email blast,
              bit-by-mail allows you to create separate, reusable databases and
              templates.
            </p>

            <div className="space-y-4">
              <div className="bg-surface-element/50 p-4 rounded-lg border border-borders-primary/50">
                <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Database size={16} className="text-accent-blue" />
                  Databases
                </h4>
                <p>
                  If you frequently email the same group of people (e.g., a
                  newsletter subscriber list), you don't need to upload a CSV
                  every time. Create a <strong>Database</strong> once. When
                  setting up a new Campaign, simply click <em>"Import"</em> to
                  pull in the entire database. If you update the original
                  database later, you can click <em>"Sync DB"</em> inside the
                  campaign to pull in the latest changes without losing your
                  send history.
                </p>
              </div>

              <div className="bg-surface-element/50 p-4 rounded-lg border border-borders-primary/50">
                <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Library size={16} className="text-accent-blue" />
                  Templates
                </h4>
                <p>
                  The <strong>Templates</strong> section is your global library
                  of email designs. Build and categorize standard emails (like
                  Welcome Emails, Monthly Updates, or Invoices) separately from
                  campaigns. Inside any active campaign, you can click{' '}
                  <em>"Load Library"</em> to instantly apply a saved template to
                  your current broadcast.
                </p>
              </div>
            </div>
          </DocSection>

          <DocSection
            title="CSV Formatting & Placeholders"
            icon={Table}
            summary="Understand the required format for your recipient data, and learn how CSV headers automatically turn into dynamic placeholders."
          >
            <p>
              The application expects a standard comma-separated values (CSV)
              file. The first row must be your headers.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4 mt-2">
              <li>
                <strong>Required:</strong> You must have a <code>Name</code> and{' '}
                <code>Email</code> column.
              </li>
              <li>
                <strong>Attachments:</strong> Use an <code>AttachmentFile</code>{' '}
                column. Separate multiple files with a semicolon (<code>;</code>
                ).
              </li>
            </ul>

            <div className="bg-accent-blue/10 border border-accent-blue/20 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-accent-blue mb-1">
                The Magic of Placeholders
              </h4>
              <p className="text-text-primary">
                Any custom column you add to your CSV{' '}
                <strong>automatically becomes a placeholder</strong> you can use
                in your emails!
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                For example, if you add a column named <code>TicketNumber</code>
                , you can type <code>{`{{TicketNumber}}`}</code> anywhere in
                your email subject or body. The app will automatically swap that
                placeholder with the specific row's data before sending.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-borders-primary">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-element text-text-primary uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 border-b border-borders-primary font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 border-b border-borders-primary font-medium">
                      Email
                    </th>
                    <th className="px-4 py-3 border-b border-borders-primary font-medium text-accent-blue">
                      TicketNumber
                    </th>
                    <th className="px-4 py-3 border-b border-borders-primary font-medium text-accent-blue">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-card">
                  <tr className="border-b border-borders-primary/50">
                    <td className="px-4 py-3">John Doe</td>
                    <td className="px-4 py-3">john@example.com</td>
                    <td className="px-4 py-3 text-accent-blue font-mono text-xs">
                      A-492
                    </td>
                    <td className="px-4 py-3 text-accent-blue font-mono text-xs">
                      Admin
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Jane Smith</td>
                    <td className="px-4 py-3">jane@example.com</td>
                    <td className="px-4 py-3 text-accent-blue font-mono text-xs">
                      B-108
                    </td>
                    <td className="px-4 py-3 text-accent-blue font-mono text-xs">
                      Guest
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DocSection>

          <DocSection
            title="Writing with Placeholders"
            icon={Braces}
            summary="How to inject dynamic data from your CSV into your email subject and body to create highly personalized messages."
          >
            <p>
              Placeholders are written by wrapping the exact CSV column name in
              double curly braces.
            </p>

            <div className="bg-[#1e1e2a] p-4 rounded-lg border border-borders-primary font-mono text-sm text-text-primary my-4 overflow-x-auto shadow-inner">
              <span className="text-text-secondary block mb-2">
                &lt;!-- Example Email Body --&gt;
              </span>
              <p>
                Hello <span className="text-accent-blue">{`{{Name}}`}</span>,
              </p>
              <br />
              <p>
                Thank you for your purchase. Your entry ticket is{' '}
                <span className="text-accent-blue">{`{{TicketNumber}}`}</span>{' '}
                and your role is{' '}
                <span className="text-accent-blue">{`{{Role}}`}</span>.
              </p>
              <br />
              <p>If you have questions, reply to this email.</p>
            </div>

            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-accent-orange mt-0.5">•</span>
                <span>
                  <strong>Case-Sensitive:</strong> The text inside the braces
                  must match your CSV column headers <em>exactly</em>. If your
                  CSV says "FirstName", you must use{' '}
                  <code>{`{{FirstName}}`}</code>.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-accent-orange mt-0.5">•</span>
                <span>
                  <strong>Subject Lines too:</strong> You can also use these
                  placeholders in the Email Subject input field!
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-accent-orange mt-0.5">•</span>
                <span>
                  <strong>Live Preview:</strong> Use the "Preview" tab in the
                  campaign editor to verify that your placeholders are injecting
                  data correctly for your recipients before hitting send.
                </span>
              </p>
            </div>
          </DocSection>

          <DocSection
            title="SMTP Configuration"
            icon={Server}
            summary="How to connect your email account (like Gmail) securely so the application can send emails."
          >
            <p className="mb-4">
              To send emails, you must configure your SMTP settings on the{' '}
              <strong>Settings</strong> page. This acts as the bridge between
              bit-by-mail and your email provider.
            </p>

            <div className="bg-surface-element p-4 rounded-lg mb-4">
              <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                Gmail Users
              </h4>
              <p className="text-sm mb-3">
                For security reasons, Google does not allow you to use your
                standard account password for third-party apps. You must
                generate a secure "App Password".
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>
                  Go to your Google Account settings and enable{' '}
                  <strong>2-Step Verification</strong>.
                </li>
                <li>
                  Search for <strong>App Passwords</strong> in your Google
                  Account search bar.
                </li>
                <li>
                  Create a new App Password (you can name it "bit-by-mail").
                  Google will give you a 16-character code.
                </li>
                <li>
                  In bit-by-mail, set the server to <code>smtp.gmail.com</code>{' '}
                  and port to <code>587</code>.
                </li>
                <li>
                  Paste the 16-character code into the{' '}
                  <strong>Sender Password</strong> field.
                </li>
              </ol>
            </div>
            <p className="text-xs text-text-tertiary italic">
              Note: Other providers (Outlook, Yahoo, custom domains) have
              similar App Password requirements. Check your provider's SMTP
              documentation for exact port numbers.
            </p>
          </DocSection>
        </div>
      </div>
    </div>
  )
}
