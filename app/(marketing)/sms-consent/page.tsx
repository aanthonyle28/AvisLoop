import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SMS Consent - AvisLoop",
  description:
    "How AvisLoop collects end-user consent for SMS review request messages. TCPA-compliant consent documentation.",
  robots: { index: true, follow: true },
};

export default function SmsConsentPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            SMS Consent Collection
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            How end users (customers) consent to receive text messages from
            AvisLoop on behalf of their service provider.
          </p>
        </header>

        {/* ───── Program Info ───── */}
        <section className="mb-10 bg-muted/50 border border-border rounded-lg p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="font-semibold">Program Name</dt>
              <dd className="text-muted-foreground">
                AvisLoop Review Requests
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Message Sender</dt>
              <dd className="text-muted-foreground">
                [Business Name] via AvisLoop
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Purpose</dt>
              <dd className="text-muted-foreground">
                Post-service follow-up requesting a review of the
                customer&apos;s experience
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Frequency</dt>
              <dd className="text-muted-foreground">
                Up to 4 messages per service job, over approximately 72 hours
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Opt-Out</dt>
              <dd className="text-muted-foreground">
                Reply STOP to any message
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Help</dt>
              <dd className="text-muted-foreground">
                Reply HELP to any message
              </dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground mt-4 pt-3 border-t border-border">
            Message and data rates may apply. We do not share, sell, or
            distribute customer mobile phone numbers or SMS opt-in data to third
            parties.
          </p>
        </section>

        {/* ───── How End Users Consent ───── */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">
            How End Users Consent to Receive Messages
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            AvisLoop sends review request text messages to customers of home
            service businesses (plumbers, HVAC technicians, electricians, etc.)
            after a service has been completed. The customer (end user) provides
            consent directly to the service provider at the time of service
            through the following process:
          </p>

          {/* Step-by-step flow */}
          <div className="space-y-6 mb-8">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Customer completes a service
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A home service business performs work for a customer (e.g.,
                  plumbing repair, HVAC maintenance, electrical work).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Service provider asks the customer for permission
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The technician or office staff asks the customer: &ldquo;Can
                  we send you a text message to get your feedback on
                  today&apos;s service?&rdquo; The customer provides verbal or
                  written consent.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Consent is recorded in AvisLoop
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The service provider records the customer&apos;s consent in
                  the AvisLoop platform by checking an explicit SMS consent
                  checkbox. This checkbox is <strong>unchecked by default</strong>{" "}
                  and must be manually selected. The checkbox reads:{" "}
                  <em>
                    &ldquo;Customer consented to receive texts (SMS) — Required
                    for SMS follow-ups.&rdquo;
                  </em>
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Automated follow-up messages are sent
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Only after consent is recorded, the system sends up to 4 text
                  messages over approximately 72 hours, asking the customer to
                  share feedback about their service experience. Every message
                  includes opt-out instructions (reply STOP).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Consent Collection Screenshots ───── */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">
            Consent Collection Interface
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Below are screenshots showing how the service provider records
            customer consent in the AvisLoop platform. The SMS consent checkbox
            is unchecked by default and must be explicitly selected after
            obtaining consent from the customer.
          </p>

          {/* Screenshot 1: Job creation with consent checkbox */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">
              SMS Consent Checkbox (Job Creation Form)
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              When a service provider logs a completed job, the form includes an
              SMS consent checkbox that must be checked to confirm the customer
              has agreed to receive follow-up text messages. No SMS messages can
              be sent without this checkbox being selected.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Image
                src="/compliance/job-creation-consent.png"
                alt="AvisLoop job creation form showing unchecked-by-default SMS consent checkbox labeled: Customer consented to receive texts (SMS) — Required for SMS follow-ups"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
              <div className="p-3 bg-muted/30 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Job creation form with SMS consent checkbox (unchecked by
                  default). The service provider checks this box only after
                  obtaining consent from the customer.
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot 2: Consent details / audit trail */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">
              Consent Audit Trail
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              When consent is recorded, the platform captures a complete audit
              trail including the consent method (verbal in-person, phone call,
              service agreement, or website form), timestamp, IP address, and
              the identity of the operator who recorded consent.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Image
                src="/compliance/consent-details-form.png"
                alt="AvisLoop consent details form showing consent method dropdown, notes field, and TCPA compliance notice stating: This information creates a legal audit trail"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
              <div className="p-3 bg-muted/30 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Expanded consent details capturing how consent was obtained,
                  with automatic timestamp and operator tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot 3: Client intake form */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Business Owner TCPA Acknowledgment (Intake Form)
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              Before any business can use SMS features, the business owner must
              complete a public intake form that includes a mandatory TCPA
              acknowledgment checkbox confirming they will obtain customer
              consent before sending SMS messages.
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <Image
                src="/compliance/client-intake-consent.png"
                alt="AvisLoop client intake form with mandatory TCPA consent checkbox stating: I understand that I must obtain written consent from customers before sending them SMS messages"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
              <div className="p-3 bg-muted/30 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Public intake form requiring business owner to acknowledge
                  TCPA consent requirements before SMS features are enabled.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───── System Enforcement ───── */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">
            Consent Enforcement
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            AvisLoop enforces consent at the system level. No SMS message can be
            sent unless the customer&apos;s consent status is explicitly set to
            &ldquo;opted in.&rdquo;
          </p>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <span>
                <strong>Opted in:</strong> Customer gave explicit consent — SMS
                messages are sent as part of the campaign sequence.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
              <span>
                <strong>Unknown:</strong> Consent has not been recorded — customer
                is automatically excluded from all SMS messages. Only email
                follow-ups are sent.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <span>
                <strong>Opted out:</strong> Customer replied STOP or was manually
                opted out — all SMS communications cease immediately.
              </span>
            </li>
          </ul>
        </section>

        {/* ───── Sample Messages ───── */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Sample Messages</h2>
          <div className="space-y-3">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                Initial follow-up (sent 24 hours after service):
              </p>
              <p className="text-sm">
                Smith&apos;s Plumbing (via AvisLoop): Hi Patricia, thank you for
                choosing us for your recent plumbing service! We&apos;d love
                your feedback. Please take a moment to share your experience:
                https://avisloop.com/r/abc123 Reply STOP to opt out. Msg&amp;data
                rates may apply.
              </p>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                Follow-up reminder (sent 48 hours after initial message):
              </p>
              <p className="text-sm">
                Smith&apos;s Plumbing (via AvisLoop): Hi Patricia, just a
                friendly reminder — your feedback really helps! If you have a
                moment, we&apos;d appreciate a quick review:
                https://avisloop.com/r/abc123 Reply STOP to unsubscribe.
                Msg&amp;data rates may apply.
              </p>
            </div>
          </div>
        </section>

        {/* ───── Legal Links ───── */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Legal Documentation</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-muted-foreground">
                {" "}— Section 3 covers SMS/text messaging data practices
              </span>
            </li>
            <li>
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-muted-foreground">
                {" "}— Section 5 covers SMS messaging terms
              </span>
            </li>
            <li>
              <Link
                href="/sms-compliance"
                className="underline underline-offset-4 hover:text-primary transition-colors"
              >
                Full SMS Compliance Documentation
              </Link>
              <span className="text-muted-foreground">
                {" "}— Detailed technical compliance documentation
              </span>
            </li>
          </ul>
        </section>

        {/* ───── Contact ───── */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <p className="text-muted-foreground text-sm">
            For questions about our SMS consent practices or to request
            removal from messaging, contact{" "}
            <a
              href="mailto:legal@avisloop.com"
              className="underline underline-offset-4 hover:text-primary transition-colors"
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
