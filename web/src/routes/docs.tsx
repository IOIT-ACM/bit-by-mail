import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, Braces, Table, Server } from 'lucide-react'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

function DocsPage() {
  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <BookOpen size={32} className="text-accent-blue" />
            Documentation
          </h1>
          <p className="text-text-secondary text-lg">
            Welcome to bit-by-mail. This guide covers the basics of templating,
            setting up your CSV, and configuring SMTP.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Braces size={24} className="text-accent-blue" />
            Using Placeholders
          </h2>
          <div className="bg-surface-card p-6 rounded-card border border-borders-primary">
            <p className="text-text-secondary mb-4">
              Placeholders allow you to dynamically insert data from your CSV
              into your email subject and body. They are written with double
              curly braces.
            </p>
            <div className="bg-surface-element p-4 rounded-lg font-mono text-sm text-text-primary mb-4">
              Hello {`{{Name}}`},<br />
              <br />
              Your current status is {`{{Status}}`}. Please contact us at{' '}
              {`{{Email}}`}.
            </div>
            <p className="text-text-secondary text-sm">
              Note: The placeholders must match your CSV column headers exactly
              (case-sensitive).
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Table size={24} className="text-accent-blue" />
            CSV Formatting
          </h2>
          <div className="bg-surface-card p-6 rounded-card border border-borders-primary space-y-4">
            <p className="text-text-secondary">
              The application expects a standard comma-separated values (CSV)
              file. At a minimum, your file should include an{' '}
              <strong>Email</strong> and <strong>Name</strong> column.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-borders-primary">
                <thead className="bg-surface-element text-text-primary uppercase">
                  <tr>
                    <th className="px-4 py-2 border-b border-borders-primary">
                      Name
                    </th>
                    <th className="px-4 py-2 border-b border-borders-primary">
                      Email
                    </th>
                    <th className="px-4 py-2 border-b border-borders-primary">
                      AttachmentFile
                    </th>
                    <th className="px-4 py-2 border-b border-borders-primary">
                      CustomField
                    </th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr>
                    <td className="px-4 py-2 border-b border-borders-primary">
                      John Doe
                    </td>
                    <td className="px-4 py-2 border-b border-borders-primary">
                      john@example.com
                    </td>
                    <td className="px-4 py-2 border-b border-borders-primary">
                      john_cert.pdf;john_receipt.pdf
                    </td>
                    <td className="px-4 py-2 border-b border-borders-primary">
                      Value1
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul className="list-disc pl-5 text-sm text-text-secondary space-y-2">
              <li>
                Separate multiple attachments with a semicolon (<code>;</code>).
              </li>
              <li>
                New columns added to the CSV become instantly available as
                placeholders.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Server size={24} className="text-accent-blue" />
            SMTP Configuration
          </h2>
          <div className="bg-surface-card p-6 rounded-card border border-borders-primary">
            <p className="text-text-secondary mb-4">
              To send emails, configure your SMTP settings on the Settings page.
              If you are using Gmail, you cannot use your standard account
              password.
            </p>
            <ol className="list-decimal pl-5 text-sm text-text-secondary space-y-3">
              <li>Enable 2-Step Verification on your Google Account.</li>
              <li>
                Go to App Passwords and generate a new password for "Mail".
              </li>
              <li>
                Use <code>smtp.gmail.com</code> with port <code>587</code>.
              </li>
              <li>
                Paste the generated 16-character App Password into the Global
                Settings.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  )
}
