import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - AvisLoop",
  description:
    "Privacy Policy for AvisLoop. Learn how we collect, use, and protect your information.",
  openGraph: {
    title: "Privacy Policy - AvisLoop",
    description:
      "Privacy Policy for AvisLoop. Learn how we collect, use, and protect your information.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Effective Date: February 27, 2026 &middot; Last Updated: February
            27, 2026
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-muted-foreground leading-relaxed">
            AvisLoop (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a
            sole proprietorship based in Texas. This Privacy Policy describes how
            we collect, use, disclose, and protect information when you use our
            website at avisloop.com and our automated review request platform
            (collectively, the &quot;Service&quot;). By using the Service, you
            agree to the practices described in this policy.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            1. Information We Collect
          </h2>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            Account Information
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            When you create an account, we collect:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Full name</li>
            <li>Email address</li>
            <li>Password (stored securely via hashed encryption)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            Business Information
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            To set up your business profile, we collect:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Business name</li>
            <li>Business phone number</li>
            <li>Google Business Profile review link</li>
            <li>Service types offered</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-3">Customer Data</h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            When you complete jobs through the Service, you provide customer
            information including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Customer name</li>
            <li>Customer email address</li>
            <li>Customer phone number (optional)</li>
            <li>Service type performed</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            You are responsible for ensuring you have the appropriate consent
            from your customers before entering their information into the
            Service.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-3">Usage Data</h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We automatically collect certain information when you use the
            Service, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited and features used</li>
            <li>Date and time of access</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            Cookies and Similar Technologies
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies for session management and to remember your
            preferences (such as theme selection). We do not use third-party
            advertising or tracking cookies.
          </p>
        </section>

        {/* How We Use Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Provide, maintain, and improve the Service</li>
            <li>
              Send automated review request campaigns on your behalf to your
              customers
            </li>
            <li>Process payments and manage your subscription</li>
            <li>Provide customer support</li>
            <li>
              Send you service-related communications (account updates, security
              alerts)
            </li>
            <li>Analyze usage patterns to improve the product</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* SMS/Text Messaging — Critical for Twilio A2P */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            3. SMS/Text Messaging
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            AvisLoop sends SMS text messages to your customers as part of our
            automated review request campaigns. These messages are sent only
            after you complete a job and the customer is enrolled in a campaign.
          </p>
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
            <p className="font-semibold leading-relaxed">
              We do not share, sell, or distribute customer mobile phone numbers
              or SMS opt-in data to third parties or lead generators for
              marketing or promotional purposes.
            </p>
          </div>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Purpose:</strong> SMS messages are sent solely for the
              purpose of requesting customer reviews after a completed service
              job.
            </li>
            <li>
              <strong>Message Frequency:</strong> Customers typically receive 2
              to 4 messages over a period of approximately 72 hours per job
              enrollment.
            </li>
            <li>
              <strong>Opt-Out:</strong> Customers may opt out of SMS messages at
              any time by replying <strong>STOP</strong> to any message.
            </li>
            <li>
              <strong>Help:</strong> Customers may reply <strong>HELP</strong>{" "}
              to any message for assistance.
            </li>
            <li>
              <strong>Message and data rates may apply.</strong>
            </li>
            <li>
              <strong>Consent:</strong> Business users are responsible for
              obtaining proper consent from their customers before enrolling them
              in SMS campaigns through the Service.
            </li>
          </ul>
        </section>

        {/* Third-Party Services */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            4. Third-Party Services
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We use the following third-party services to operate the platform.
            Each processes data only as necessary to provide their respective
            service:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Supabase</strong> &mdash; Database hosting and
              authentication
            </li>
            <li>
              <strong>Stripe</strong> &mdash; Payment processing and
              subscription management
            </li>
            <li>
              <strong>Twilio</strong> &mdash; SMS message delivery
            </li>
            <li>
              <strong>Resend</strong> &mdash; Email message delivery
            </li>
            <li>
              <strong>Vercel</strong> &mdash; Website and application hosting
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            These providers have their own privacy policies governing how they
            handle data. We encourage you to review them.
          </p>
        </section>

        {/* Data Sharing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">5. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We do not sell your personal information or your customers&apos;
            personal information to any third party. We only share data in the
            following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Service providers:</strong> With the third-party services
              listed above, solely to operate the platform.
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by law,
              regulation, legal process, or governmental request.
            </li>
            <li>
              <strong>Safety:</strong> To protect the rights, safety, or
              property of AvisLoop, our users, or the public.
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger,
              acquisition, or sale of assets, with notice to affected users.
            </li>
          </ul>
        </section>

        {/* Data Retention */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your account and business data for as long as your account
            is active. Customer data entered through the Service is retained
            while your account remains active. You may request deletion of your
            account and all associated data at any time by contacting us at{" "}
            <a
              href="mailto:legal@avisloop.com"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              legal@avisloop.com
            </a>
            . Upon account deletion, we will remove your data within 30 days,
            except where retention is required by law.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">7. Your Rights</h2>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            California Residents (CCPA)
          </h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            If you are a California resident, you have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>Know</strong> what personal information we collect and how
              it is used
            </li>
            <li>
              <strong>Delete</strong> your personal information
            </li>
            <li>
              <strong>Opt out</strong> of the sale of your personal information
              (we do not sell personal information)
            </li>
            <li>
              <strong>Non-discrimination</strong> for exercising your privacy
              rights
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            Other State Privacy Laws
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Residents of states with comprehensive privacy laws (including
            Virginia, Colorado, Connecticut, Utah, and others) may have
            additional rights such as the right to access, correct, and delete
            personal information, and the right to opt out of certain data
            processing activities.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            European Users (GDPR)
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            If you are located in the European Economic Area, you may have
            additional rights under the General Data Protection Regulation,
            including the right to access, rectify, erase, restrict processing,
            and port your data. Our legal basis for processing is either your
            consent or legitimate business interest.
          </p>

          <h3 className="text-xl font-semibold mt-8 mb-3">
            Exercising Your Rights
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:legal@avisloop.com"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              legal@avisloop.com
            </a>
            . We will respond to your request within 30 days (or sooner if
            required by applicable law).
          </p>
        </section>

        {/* Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">8. Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your
            information, including encryption in transit (TLS), encryption at
            rest, row-level security policies on our database, access controls,
            and rate limiting. While no method of transmission or storage is
            completely secure, we take reasonable precautions to protect your
            data.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            9. Children&apos;s Privacy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is not directed at children under the age of 13. We do
            not knowingly collect personal information from children under 13. If
            we become aware that we have collected personal information from a
            child under 13, we will take steps to delete that information
            promptly.
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">
            10. Changes to This Policy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. If we make
            material changes, we will notify you by email or by posting a notice
            on the Service prior to the change becoming effective. Your continued
            use of the Service after the effective date of any changes
            constitutes your acceptance of the updated policy.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mt-12 mb-4">11. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy or our data
            practices, please contact us at:
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
