import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - AvisLoop",
  description:
    "Terms of Service for AvisLoop. Read the terms and conditions governing your use of the platform.",
  openGraph: {
    title: "Terms of Service - AvisLoop",
    description:
      "Terms of Service for AvisLoop. Read the terms and conditions governing your use of the platform.",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Effective Date: February 27, 2026 &middot; Last Updated: February
            27, 2026
          </p>
        </header>

        {/* Agreement */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            1. Agreement to Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using AvisLoop (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service (&quot;Terms&quot;). If you do
            not agree to these Terms, do not use the Service. AvisLoop is
            operated by a sole proprietorship based in Texas.
          </p>
        </section>

        {/* Service Description */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            2. Service Description
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            AvisLoop is an automated review request platform designed for home
            service businesses. The Service enables businesses to complete jobs,
            automatically enroll customers in multi-touch review request
            campaigns, and collect customer feedback. Communications are sent via
            email and SMS on behalf of the business.
          </p>
        </section>

        {/* Account Responsibilities */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            3. Account Responsibilities
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            When you create an account, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your password and account</li>
            <li>
              Accept responsibility for all activities that occur under your
              account
            </li>
            <li>Notify us immediately of any unauthorized use</li>
            <li>Maintain one account per business</li>
          </ul>
        </section>

        {/* Acceptable Use */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">4. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms. Specifically, you must:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              Have a legitimate customer relationship with every person you add
              to the platform
            </li>
            <li>
              Not use the Service to send unsolicited messages (spam) to
              individuals who have not been your customers
            </li>
            <li>
              Not use the Service to solicit, incentivize, or facilitate fake or
              fraudulent reviews
            </li>
            <li>Comply with all applicable federal, state, and local laws</li>
            <li>
              Comply with the Telephone Consumer Protection Act (TCPA) and
              CAN-SPAM Act
            </li>
            <li>
              Not attempt to interfere with or disrupt the Service or its
              infrastructure
            </li>
          </ul>
        </section>

        {/* SMS Messaging Terms — Critical for Twilio A2P */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            5. SMS Messaging Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The Service includes an SMS messaging program for sending automated
            review requests to your customers.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <strong>Program Name:</strong> AvisLoop Review Requests
            </li>
            <li>
              <strong>Purpose:</strong> Automated review request messages sent to
              your customers after a service job is completed.
            </li>
            <li>
              <strong>Message Frequency:</strong> Up to 4 messages per job
              enrollment over a period of approximately 72 hours.
            </li>
          </ul>

          <div className="bg-muted/50 border border-border rounded-lg p-4 my-6 space-y-3">
            <p className="font-semibold">
              Message and data rates may apply.
            </p>
            <p className="font-semibold">
              Reply STOP to opt out of messages at any time.
            </p>
            <p className="font-semibold">
              Reply HELP for assistance.
            </p>
          </div>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <strong>Consent Responsibility:</strong> As a business user of
              AvisLoop, you are solely responsible for obtaining proper consent
              from your customers before enrolling them in SMS campaigns through
              the Service. You represent and warrant that you have obtained all
              necessary consents required under applicable law, including the
              TCPA, before adding any customer&apos;s phone number to the
              platform.
            </li>
            <li>
              <strong>Opt-Out Handling:</strong> When a customer replies STOP,
              our system will immediately cease sending SMS messages to that
              customer. Opted-out customers will not receive further SMS
              communications through the Service.
            </li>
            <li>
              <strong>Contact:</strong> For questions about SMS messaging,
              contact us at{" "}
              <a
                href="mailto:legal@avisloop.com"
                className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                legal@avisloop.com
              </a>{" "}
              or reply HELP to any message.
            </li>
          </ul>
        </section>

        {/* Payment Terms */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">6. Payment Terms</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              Paid subscriptions are billed monthly in advance through Stripe.
            </li>
            <li>
              All fees are non-refundable, including partial month charges upon
              cancellation.
            </li>
            <li>
              We reserve the right to change pricing with 30 days&apos; notice.
            </li>
            <li>
              Usage limits (e.g., number of sends per month) are enforced per
              your subscription tier. Exceeding limits may result in service
              restrictions until the next billing cycle or an upgrade.
            </li>
            <li>
              Failure to pay may result in suspension or termination of your
              account.
            </li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            7. Intellectual Property
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service, including its design, code, features, and content
            (excluding user-provided data), is owned by AvisLoop and protected
            by applicable intellectual property laws. You may not copy,
            reproduce, distribute, or create derivative works from any part of
            the Service without our prior written consent.
          </p>
        </section>

        {/* User Data & Content */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            8. User Data and Content
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            You retain ownership of all data you provide to the Service,
            including customer information, business details, and message
            content. By using the Service, you grant AvisLoop a limited,
            non-exclusive license to process, store, and transmit your data
            solely for the purpose of providing the Service.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for the accuracy and legality of any data you
            provide. You represent that you have the right to submit all customer
            data and that doing so does not violate any third party&apos;s
            rights.
          </p>
        </section>

        {/* Prohibited Activities */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            9. Prohibited Activities
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            You agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              Send unsolicited messages to individuals who are not your customers
            </li>
            <li>
              Violate the Telephone Consumer Protection Act (TCPA), CAN-SPAM
              Act, or any other applicable messaging or communications law
            </li>
            <li>Upload false, misleading, or fraudulent customer data</li>
            <li>
              Attempt to manipulate review platforms (e.g., Google) in violation
              of their terms of service
            </li>
            <li>
              Use automated scripts, bots, or scrapers to access the Service
            </li>
            <li>
              Resell access to the Service or use it on behalf of third parties
              without authorization
            </li>
            <li>
              Circumvent or attempt to circumvent any security measures,
              rate limits, or usage restrictions
            </li>
          </ul>
        </section>

        {/* Termination */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">10. Termination</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Either party may terminate this agreement at any time:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>By you:</strong> You may cancel your account at any time
              through the Service or by contacting us.
            </li>
            <li>
              <strong>By us:</strong> We may suspend or terminate your account if
              you violate these Terms, engage in prohibited activities, or fail
              to pay applicable fees.
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Upon termination, your right to use the Service ceases immediately.
            You may request an export of your data within 30 days of
            termination, after which your data will be permanently deleted.
          </p>
        </section>

        {/* Disclaimers */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">11. Disclaimers</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            AvisLoop does not guarantee that the Service will result in any
            specific number of reviews, ratings, or business outcomes. We do not
            guarantee uninterrupted or error-free operation of the Service.
            Message delivery depends on third-party carriers and services which
            are beyond our control.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            12. Limitation of Liability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, AVISLOOP SHALL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR
            GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR
            TOTAL LIABILITY FOR ANY CLAIM ARISING UNDER THESE TERMS SHALL NOT
            EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING
            THE CLAIM.
          </p>
        </section>

        {/* Governing Law */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">13. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the
            laws of the State of Texas, without regard to its conflict of law
            provisions. Any disputes arising from these Terms or the Service
            shall be resolved in the state or federal courts located in Texas.
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            14. Changes to These Terms
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. If we make material
            changes, we will provide at least 30 days&apos; notice by email or
            by posting a notice on the Service. Your continued use of the
            Service after the effective date of any changes constitutes your
            acceptance of the updated Terms.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">15. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about these Terms, please contact us at:
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            AvisLoop
            <br />
            Email:{" "}
            <a
              href="mailto:legal@avisloop.com"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              legal@avisloop.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
