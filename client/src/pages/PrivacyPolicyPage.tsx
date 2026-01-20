import { useEffect } from "react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last Updated: January 10, 2026</p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to The Connection ("we," "our," or "us"). We are committed to protecting your
            privacy and ensuring the security of your personal information. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use
            our Christian social platform, including our website and mobile applications.
          </p>
          <p>
            By using The Connection, you agree to the collection and use of information in
            accordance with this policy. If you do not agree with our policies and practices,
            please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
          <p>We collect information that you voluntarily provide when using our services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Username, email address, password (encrypted), display name, denomination, interests, and profile picture</li>
            <li><strong>Profile Information:</strong> Biography, location (city/state), Christian interests, and denomination preferences</li>
            <li><strong>Content:</strong> Posts, comments, prayer requests, apologetics questions and answers, messages, and other content you create or share</li>
            <li><strong>Community Data:</strong> Communities you join, events you create or RSVP to, and your interactions within communities</li>
            <li><strong>Communications:</strong> Messages you send to other users, support requests, and feedback</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Automatically Collected Information</h3>
          <p>When you use The Connection, we automatically collect certain information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> Pages viewed, features used, actions taken, time spent on the platform</li>
            <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
            <li><strong>Location Data:</strong> Approximate location based on IP address (not GPS tracking)</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use cookies for session management and to improve user experience</li>
            <li><strong>Error and Performance Data:</strong> Crash reports and performance metrics (via Sentry) to improve our service</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Information from Third Parties</h3>
          <p>We may receive information from third-party services when you:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sign in using third-party authentication (if implemented)</li>
            <li>Share content from The Connection on other platforms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use your information for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Provide Services:</strong> Create and manage your account, enable community features, facilitate communication</li>
            <li><strong>Personalization:</strong> Recommend relevant communities, events, and content based on your interests and denomination</li>
            <li><strong>Communication:</strong> Send you verification emails, password reset links, notifications about activity on your posts, and important service updates</li>
            <li><strong>Safety and Security:</strong> Detect and prevent fraud, abuse, security incidents, and harmful activities</li>
            <li><strong>Improvement:</strong> Analyze usage patterns to improve our platform and develop new features</li>
            <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
            <li><strong>Support:</strong> Respond to your support requests and feedback</li>
          </ul>
          <p className="mt-4">
            <strong>We will never:</strong> Sell your personal information to third parties, use your data
            for targeted advertising outside our platform, or share your prayer requests publicly without
            your consent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>

          <h3 className="text-xl font-semibold mb-3">4.1 Public Information</h3>
          <p>By default, certain information is visible to other users:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Profile information (username, display name, biography, profile picture, denomination, interests)</li>
            <li>Public posts, comments, and interactions</li>
            <li>Communities you've joined (unless the community is private)</li>
            <li>Events you've created or are attending (unless marked private)</li>
          </ul>
          <p className="mt-2">
            You can adjust your privacy settings to control what information is visible to others.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Private Information</h3>
          <p>The following information remains private unless you choose to share it:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email address</li>
            <li>Private messages and direct conversations</li>
            <li>Private prayer requests (shared only with specific communities or users you choose)</li>
            <li>Private posts and content</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Service Providers</h3>
          <p>We share information with trusted service providers who help us operate The Connection:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hosting:</strong> Render.com (application hosting)</li>
            <li><strong>Database:</strong> Neon (PostgreSQL database)</li>
            <li><strong>Email:</strong> Resend (transactional emails)</li>
            <li><strong>Error Tracking:</strong> Sentry (error monitoring and performance)</li>
            <li><strong>Maps:</strong> Google Maps API (location services for events)</li>
            <li><strong>Storage:</strong> Google Cloud Storage (file uploads)</li>
          </ul>
          <p className="mt-2">
            These providers are bound by contractual obligations to keep your information secure and
            confidential, and may only use your data to provide services to us.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.4 Legal Requirements</h3>
          <p>We may disclose your information if required by law or in response to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Valid legal requests (subpoenas, court orders, law enforcement requests)</li>
            <li>Protection of our rights, property, or safety</li>
            <li>Prevention of harm or illegal activity</li>
            <li>Enforcement of our Terms of Service</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.5 Business Transfers</h3>
          <p>
            If The Connection is involved in a merger, acquisition, or sale of assets, your information
            may be transferred. We will notify you before your information becomes subject to a different
            privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
          <p>We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Active Accounts:</strong> Information retained while your account is active</li>
            <li><strong>Deleted Accounts:</strong> Most data is deleted within 30 days of account deletion</li>
            <li><strong>Backup Retention:</strong> Backup copies may persist for up to 90 days</li>
            <li><strong>Legal Obligations:</strong> Certain data may be retained longer to comply with legal requirements</li>
            <li><strong>Audit Logs:</strong> Security and audit logs retained for 1 year</li>
          </ul>
          <p className="mt-4">
            Public content you've created (posts, comments) may remain visible after account deletion
            but will be anonymized and disassociated from your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>

          <h3 className="text-xl font-semibold mb-3">6.1 Access and Control</h3>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong>Export:</strong> Download your data in a portable format</li>
            <li><strong>Object:</strong> Object to certain processing of your data</li>
            <li><strong>Restrict:</strong> Request restriction of processing in certain circumstances</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Privacy Settings</h3>
          <p>You can control your privacy through account settings:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Profile visibility (public, followers only, private)</li>
            <li>Post visibility settings</li>
            <li>Community and event visibility</li>
            <li>Email notification preferences</li>
            <li>Who can send you direct messages</li>
            <li>Search engine indexing preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.3 Exercising Your Rights</h3>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:privacy@theconnection.app" className="text-primary hover:underline">
              privacy@theconnection.app
            </a>{" "}
            or use the account settings in the app. We will respond to your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
          <p>We implement industry-standard security measures to protect your information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Encryption:</strong> All data transmitted is encrypted using HTTPS/TLS</li>
            <li><strong>Password Security:</strong> Passwords are hashed using Argon2id (memory-hard algorithm)</li>
            <li><strong>Database Security:</strong> Database connections use SSL/TLS encryption</li>
            <li><strong>Access Control:</strong> Strict access controls and authentication for all systems</li>
            <li><strong>Monitoring:</strong> Continuous monitoring for security threats and vulnerabilities</li>
            <li><strong>Regular Audits:</strong> Security audit logs maintained for all sensitive operations</li>
            <li><strong>Rate Limiting:</strong> Protection against brute-force and abuse attempts</li>
          </ul>
          <p className="mt-4">
            While we implement strong security measures, no method of transmission over the internet
            or electronic storage is 100% secure. We cannot guarantee absolute security but we take
            all reasonable precautions to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p>
            The Connection is intended for users aged 13 and older. We do not knowingly collect
            personal information from children under 13. If you believe we have collected information
            from a child under 13, please contact us immediately at{" "}
            <a href="mailto:privacy@theconnection.app" className="text-primary hover:underline">
              privacy@theconnection.app
            </a>{" "}
            and we will delete such information promptly.
          </p>
          <p className="mt-4">
            For users between 13-18, we encourage parental guidance and supervision when using our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
          <p>
            The Connection is operated in the United States. If you are accessing our services from
            outside the U.S., please be aware that your information will be transferred to, stored,
            and processed in the United States where our servers and central database are located.
          </p>
          <p className="mt-2">
            By using The Connection, you consent to the transfer of your information to the United
            States and processing in accordance with this Privacy Policy and applicable U.S. law.
          </p>
          <p className="mt-2">
            For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we comply
            with applicable data protection laws and implement appropriate safeguards for international
            data transfers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Session Management:</strong> Keep you logged in and maintain your session</li>
            <li><strong>Preferences:</strong> Remember your settings and preferences</li>
            <li><strong>Security:</strong> Protect against fraud and enhance security</li>
            <li><strong>Analytics:</strong> Understand how users interact with our platform (via Sentry)</li>
          </ul>
          <p className="mt-4">
            You can control cookies through your browser settings. Disabling cookies may limit
            certain features of The Connection.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links</h2>
          <p>
            The Connection may contain links to external websites, resources, or services not operated
            by us. We are not responsible for the privacy practices of these third parties. We encourage
            you to review the privacy policies of any third-party sites you visit.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. California Privacy Rights</h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer
            Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to know what personal information is collected, used, shared, or sold</li>
            <li>Right to delete personal information held by us</li>
            <li>Right to opt-out of the sale of personal information (Note: We do not sell personal information)</li>
            <li>Right to non-discrimination for exercising your CCPA rights</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@theconnection.app" className="text-primary hover:underline">
              privacy@theconnection.app
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, legal requirements, or other factors. We will notify you of any material
            changes by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Posting the updated policy on this page with a new "Last Updated" date</li>
            <li>Sending an email notification to your registered email address</li>
            <li>Displaying a prominent notice on The Connection</li>
          </ul>
          <p className="mt-4">
            Your continued use of The Connection after changes become effective constitutes your
            acceptance of the revised Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our
            privacy practices, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:privacy@theconnection.app" className="text-primary hover:underline">
                privacy@theconnection.app
              </a>
            </p>
            <p>
              <strong>Support:</strong>{" "}
              <a href="mailto:support@theconnection.app" className="text-primary hover:underline">
                support@theconnection.app
              </a>
            </p>
            <p>
              <strong>Mailing Address:</strong><br />
              The Connection<br />
              Privacy Department<br />
              [Your Mailing Address]<br />
              [City, State ZIP]
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Your Consent</h2>
          <p>
            By using The Connection, you acknowledge that you have read, understood, and agree to
            this Privacy Policy. If you do not agree with this policy, please discontinue use of
            our services immediately.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            This Privacy Policy is effective as of January 10, 2026 and applies to all users of The Connection
            platform, including our website and mobile applications.
          </p>
        </div>
      </div>
    </div>
  );
}
