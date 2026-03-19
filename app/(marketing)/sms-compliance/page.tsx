import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "SMS Compliance - AvisLoop",
  description:
    "How AvisLoop collects and manages SMS consent for review request messaging. TCPA compliance documentation.",
  robots: { index: true, follow: true },
};

export default function SmsCompliancePage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CaretLeft size={14} />
            Back to home
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            SMS Consent &amp; Compliance
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Documentation of how AvisLoop collects, records, and enforces SMS
            consent for automated review request messaging. This page
            demonstrates our TCPA-compliant consent collection workflow.
          </p>
        </header>

        {/* Program Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Program Overview</h2>
          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-3">
            <p>
              <strong>Program Name:</strong> AvisLoop Review Requests
            </p>
            <p>
              <strong>Purpose:</strong> Automated review follow-up messages sent
              to customers of home service businesses after a service job is
              completed.
            </p>
            <p>
              <strong>Message Frequency:</strong> Up to 4 messages per job
              enrollment over approximately 72 hours.
            </p>
            <p>
              <strong>Opt-Out:</strong> Customers may reply STOP to any message
              to immediately cease all SMS communications.
            </p>
            <p>
              <strong>Help:</strong> Customers may reply HELP to any message for
              assistance.
            </p>
            <p>
              <strong>Message and data rates may apply.</strong>
            </p>
          </div>
        </section>

        {/* Two-Layer Consent Model */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            Two-Layer Consent Collection Model
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            AvisLoop enforces SMS consent at two levels: (1) the business owner
            must acknowledge TCPA requirements via a public client intake form
            before their account is activated, and (2) individual customer
            consent must be explicitly recorded (checkbox unchecked by default)
            before any SMS is sent. No SMS messages can be sent to any customer
            unless their consent status is explicitly marked as
            &quot;opted in&quot; in the system.
          </p>

          {/* Client Intake */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-3">
              Layer 1: Client Intake — SMS Consent During Business Onboarding
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              During the initial business setup, the business owner completes a
              public client intake form (hosted at{" "}
              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                https://avisloop.com/intake/[token]
              </code>
              ) which includes a mandatory SMS consent acknowledgment checkbox
              (unchecked by default). The business must check this box to
              confirm they understand TCPA requirements before their account
              can be activated. The checkbox states: &quot;I understand that I
              must obtain written consent from customers before sending them
              SMS messages, and I will maintain records of consent as required
              by TCPA regulations.&quot;
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Image
                src="/compliance/client-intake-consent.png"
                alt="AvisLoop client intake form with SMS consent checkbox at the bottom of the form"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
              <div className="p-4 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Screenshot:</strong> Client intake form with SMS
                  consent checkbox. The business confirms agreement to SMS
                  messaging as part of the onboarding process.
                </p>
              </div>
            </div>
          </div>

          {/* Layer 2: Per-Customer Consent */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-3">
              Layer 2: Per-Customer Consent Recording (Job Creation)
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When a business creates a job and adds customer information, they
              must record whether the customer has consented to receive SMS
              review follow-up messages. The SMS consent checkbox is{" "}
              <strong>unchecked by default</strong> and labeled:{" "}
              <em>
                &quot;Customer consented to receive texts (SMS) — Required for
                SMS follow-ups.&quot;
              </em>{" "}
              The business owner must explicitly check this box after obtaining
              consent from the customer.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Customers without recorded SMS consent are automatically excluded
              from all SMS campaign touches. Only customers with an explicit
              &quot;opted in&quot; consent status receive text messages. The
              system enforces this at the code level — there is no way to
              bypass the consent check.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Image
                src="/compliance/job-creation-consent.png"
                alt="AvisLoop add job form showing the SMS consent checkbox — Customer consented to receive texts (SMS)"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
              <div className="p-4 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Screenshot:</strong> Job creation form with SMS consent
                  checkbox. The business records individual customer consent
                  before any SMS is sent.
                </p>
              </div>
            </div>
          </div>

          {/* Consent Details / Audit Trail */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-3">
              TCPA Audit Trail: Consent Details Recording
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When consent is recorded, the business can expand a detailed
              consent form to document how consent was obtained. The system
              automatically records the date, time, IP address, and the user who
              captured the consent. Fields include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>
                <strong>Consent method:</strong> Verbal (in-person), Phone call,
                Service agreement, Website form, or Other
              </li>
              <li>
                <strong>Notes:</strong> Optional free-text field for additional
                context about how consent was obtained
              </li>
              <li>
                <strong>Automatic fields:</strong> Timestamp, IP address, and
                capturing user ID are recorded automatically
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The TCPA compliance notice displayed to the business user states:{" "}
              <em>
                &quot;This information creates a legal audit trail. Consent must
                be explicitly given by the customer. Date, time, and capture
                method are recorded automatically.&quot;
              </em>
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Image
                src="/compliance/consent-details-form.png"
                alt="AvisLoop SMS consent details form showing consent method dropdown, notes field, and TCPA compliance notice"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
              <div className="p-4 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Screenshot:</strong> Expanded consent details form with
                  method dropdown, notes, and TCPA compliance information box.
                  This data creates a complete audit trail for each customer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Consent Enforcement */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            How Consent Is Enforced
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              AvisLoop enforces consent at the system level. The SMS sending
              pipeline checks consent status before every message:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>opted_in:</strong> Customer has given explicit consent —
                SMS messages are sent as part of campaign sequences.
              </li>
              <li>
                <strong>unknown:</strong> Consent has not been recorded — the
                customer is automatically excluded from all SMS campaign touches.
                Only email touches are sent.
              </li>
              <li>
                <strong>opted_out:</strong> Customer has opted out (via STOP
                keyword or manual update) — no SMS messages are sent. The system
                immediately ceases all SMS communications.
              </li>
            </ul>
            <p>
              Opt-out is handled automatically: when a customer replies STOP to
              any message, the system updates their consent status to
              &quot;opted_out&quot; and stops all future SMS communications
              immediately.
            </p>
          </div>
        </section>

        {/* Sample Messages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Sample Messages</h2>
          <div className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Sample Message 1 (Initial follow-up):
              </p>
              <p>
                [Business Name]: Thanks for choosing us for your recent [service
                type] service! We&apos;d love your feedback:{" "}
                https://avisloop.com/review/[token] Reply STOP to opt out. Msg
                &amp; data rates may apply.
              </p>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Sample Message 2 (Follow-up reminder):
              </p>
              <p>
                [Business Name]: Just checking in about your recent service. Your
                feedback helps us improve! Share your thoughts:{" "}
                https://avisloop.com/review/[token] Reply STOP to unsubscribe.
              </p>
            </div>
          </div>
        </section>

        {/* Legal Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Legal Documentation</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href="/privacy"
                className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>{" "}
              <span className="text-muted-foreground">
                — Includes SMS data non-sharing commitment (Section 3)
              </span>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>{" "}
              <span className="text-muted-foreground">
                — Includes SMS messaging terms (Section 5)
              </span>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about our SMS compliance practices, contact us at{" "}
            <a
              href="mailto:legal@avisloop.com"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              legal@avisloop.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
