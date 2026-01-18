import { useEffect } from "react";

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last Updated: January 10, 2026</p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            Welcome to The Connection! These Terms of Service ("Terms") govern your access to and
            use of The Connection's website, mobile applications, and services (collectively, the
            "Service"). By accessing or using the Service, you agree to be bound by these Terms and
            our Privacy Policy.
          </p>
          <p className="mt-4">
            If you do not agree to these Terms, you may not access or use the Service. We may
            modify these Terms at any time, and such modifications will be effective immediately
            upon posting. Your continued use of the Service after changes constitutes your
            acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
          <p>You must meet the following requirements to use The Connection:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be at least 13 years old</li>
            <li>You must provide accurate and complete registration information</li>
            <li>You must not be prohibited from using the Service under applicable law</li>
            <li>You must not have been previously banned from The Connection</li>
          </ul>
          <p className="mt-4">
            If you are between 13-18 years old, you represent that you have permission from a parent
            or guardian to use The Connection, and they have agreed to these Terms on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>

          <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
          <p>To use certain features of The Connection, you must create an account. When creating an account:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must provide accurate, current, and complete information</li>
            <li>You must maintain and update your information to keep it accurate</li>
            <li>You are responsible for maintaining the confidentiality of your password</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must immediately notify us of any unauthorized use of your account</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">3.2 Account Security</h3>
          <p>
            You agree to use a strong password and enable any available security features. You must
            not share your account credentials with anyone else. We are not liable for any loss or
            damage arising from your failure to protect your account information.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Account Termination</h3>
          <p>
            You may terminate your account at any time through your account settings. We reserve the
            right to suspend or terminate your account at any time, with or without notice, for
            violations of these Terms or for any other reason at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Community Guidelines and Acceptable Use</h2>

          <h3 className="text-xl font-semibold mb-3">4.1 Our Mission</h3>
          <p>
            The Connection is a Christian social platform designed to foster meaningful connections,
            spiritual growth, and community support. We expect all users to treat each other with
            respect, kindness, and Christian love.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Prohibited Conduct</h3>
          <p>You agree NOT to use The Connection to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Harass or Bully:</strong> Harass, threaten, intimidate, or bully other users</li>
            <li><strong>Hate Speech:</strong> Post content that promotes hatred, violence, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</li>
            <li><strong>False Information:</strong> Spread misinformation, false teachings contrary to mainstream Christianity, or deceptive content</li>
            <li><strong>Spam:</strong> Send unsolicited messages, advertisements, or promotional content</li>
            <li><strong>Illegal Activity:</strong> Engage in or promote illegal activities</li>
            <li><strong>Sexual Content:</strong> Post pornographic, sexually explicit, or inappropriate content</li>
            <li><strong>Violence:</strong> Glorify, promote, or threaten violence</li>
            <li><strong>Impersonation:</strong> Impersonate others or misrepresent your identity or affiliation</li>
            <li><strong>Privacy Violation:</strong> Share private information about others without consent</li>
            <li><strong>Intellectual Property:</strong> Violate copyright, trademark, or other intellectual property rights</li>
            <li><strong>Platform Abuse:</strong> Attempt to hack, disrupt, or exploit the Service or its systems</li>
            <li><strong>Automated Use:</strong> Use bots, scrapers, or automated tools without permission</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Theological Diversity</h3>
          <p>
            While The Connection welcomes Christians from various denominations and traditions, we
            expect respectful dialogue. Users should engage in theological discussions with grace,
            humility, and a spirit of learning. Personal attacks based on denominational differences
            are not acceptable.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.4 Moderation</h3>
          <p>
            We reserve the right to remove content, suspend accounts, or take any other action we
            deem necessary to maintain a safe and welcoming community. This includes content that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violates these Terms or our Community Guidelines</li>
            <li>Is reported by multiple users</li>
            <li>We determine is inappropriate or harmful</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>

          <h3 className="text-xl font-semibold mb-3">5.1 Your Content</h3>
          <p>
            You retain ownership of all content you post, upload, or share on The Connection
            ("User Content"). This includes posts, comments, prayer requests, messages, photos,
            videos, and other materials.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.2 License to The Connection</h3>
          <p>
            By posting User Content, you grant The Connection a worldwide, non-exclusive, royalty-free,
            transferable license to use, reproduce, distribute, display, and perform your User Content
            in connection with operating and providing the Service. This license allows us to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Display your content to other users as per your privacy settings</li>
            <li>Store and backup your content</li>
            <li>Moderate and remove content that violates our policies</li>
            <li>Format and display your content across different devices and platforms</li>
          </ul>
          <p className="mt-4">
            This license ends when you delete your content or account, except for content that has
            been shared with others or is retained in our backup systems for a limited time.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Responsibility for Content</h3>
          <p>
            You are solely responsible for your User Content. You represent and warrant that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You own or have the necessary rights to post your content</li>
            <li>Your content does not violate any third-party rights</li>
            <li>Your content complies with these Terms and applicable laws</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.4 Content Removal</h3>
          <p>
            We reserve the right, but not the obligation, to remove any User Content that violates
            these Terms or that we deem inappropriate. We may also be required to remove content in
            response to legal requests or court orders.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>

          <h3 className="text-xl font-semibold mb-3">6.1 The Connection's Property</h3>
          <p>
            The Service, including its design, features, functionality, text, graphics, logos,
            and software, is owned by The Connection and is protected by copyright, trademark,
            and other intellectual property laws. You may not:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Copy, modify, distribute, or create derivative works from the Service</li>
            <li>Reverse engineer or attempt to extract source code</li>
            <li>Use The Connection's name, logo, or trademarks without permission</li>
            <li>Remove or alter any proprietary notices</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Copyright Infringement</h3>
          <p>
            We respect intellectual property rights. If you believe content on The Connection
            infringes your copyright, please contact us at{" "}
            <a href="mailto:copyright@theconnection.app" className="text-primary hover:underline">
              copyright@theconnection.app
            </a>{" "}
            with:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Identification of the copyrighted work</li>
            <li>Identification of the infringing material</li>
            <li>Your contact information</li>
            <li>A statement of good faith belief that the use is not authorized</li>
            <li>A statement that the information is accurate and you are authorized to act</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
          <p>
            Your privacy is important to us. Please review our{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>{" "}
            to understand how we collect, use, and protect your information. By using The Connection,
            you agree to our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
          <p>
            The Connection may contain links to third-party websites, services, or resources. We do
            not endorse and are not responsible for the content, products, or services offered by
            third parties. Your interactions with third parties are solely between you and the third
            party. We encourage you to review the terms and privacy policies of any third-party
            services you access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>

          <h3 className="text-xl font-semibold mb-3">9.1 "As Is" Service</h3>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">9.2 No Guarantee</h3>
          <p>
            We do not guarantee that the Service will be uninterrupted, secure, or error-free. We
            make no warranty regarding the quality, accuracy, timeliness, truthfulness, completeness,
            or reliability of any content on The Connection.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">9.3 Spiritual Advice</h3>
          <p>
            The Connection is a platform for community and discussion. Content shared by users,
            including theological discussions and advice, does not constitute professional spiritual
            counseling, therapy, or medical advice. For serious spiritual, mental health, or medical
            concerns, please consult qualified professionals.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">9.4 User Interactions</h3>
          <p>
            We are not responsible for the conduct of users on or off the Service. You are solely
            responsible for your interactions with other users. We recommend exercising caution and
            good judgment when interacting with others online.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE CONNECTION, ITS AFFILIATES, OFFICERS,
            DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
            <li>ANY LOSS OF PROFITS, REVENUE, DATA, OR USE</li>
            <li>ANY CONTENT OR CONDUCT OF THIRD PARTIES ON THE SERVICE</li>
            <li>ANY DAMAGE, LOSS, OR INJURY RESULTING FROM HACKING, TAMPERING, OR UNAUTHORIZED ACCESS</li>
            <li>ANY INTERRUPTION OR CESSATION OF THE SERVICE</li>
          </ul>
          <p className="mt-4">
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL
            NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR
            $100.00, WHICHEVER IS GREATER.
          </p>
          <p className="mt-4">
            Some jurisdictions do not allow the exclusion of certain warranties or limitation of
            liability, so some of the above limitations may not apply to you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless The Connection, its affiliates, and
            their respective officers, directors, employees, and agents from and against any claims,
            liabilities, damages, losses, costs, expenses (including reasonable attorneys' fees)
            arising out of or related to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use of the Service</li>
            <li>Your User Content</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Your violation of applicable laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>

          <h3 className="text-xl font-semibold mb-3">12.1 Governing Law</h3>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of [Your State], United States, without regard to conflict of law principles.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">12.2 Informal Resolution</h3>
          <p>
            Before filing any formal dispute, you agree to contact us at{" "}
            <a href="mailto:legal@theconnection.app" className="text-primary hover:underline">
              legal@theconnection.app
            </a>{" "}
            to attempt to resolve the matter informally. We will make a good faith effort to resolve
            any disputes through informal negotiation.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">12.3 Arbitration</h3>
          <p>
            If we cannot resolve a dispute informally, any controversy or claim arising out of or
            relating to these Terms shall be settled by binding arbitration in accordance with the
            Commercial Arbitration Rules of the American Arbitration Association. The arbitration
            shall take place in [Your City, State], and judgment on the award may be entered in any
            court having jurisdiction.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">12.4 Class Action Waiver</h3>
          <p>
            YOU AND THE CONNECTION AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR
            OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS
            OR REPRESENTATIVE PROCEEDING.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without
            prior notice or liability, for any reason, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violation of these Terms</li>
            <li>Requests by law enforcement or government agencies</li>
            <li>Discontinuation or material modification of the Service</li>
            <li>Unexpected technical or security issues</li>
            <li>Extended periods of inactivity</li>
            <li>Your engagement in fraudulent or illegal activities</li>
          </ul>
          <p className="mt-4">
            Upon termination, your right to use the Service will immediately cease. Sections of
            these Terms that by their nature should survive termination shall survive, including
            ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. General Provisions</h2>

          <h3 className="text-xl font-semibold mb-3">14.1 Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between
            you and The Connection regarding the Service and supersede all prior agreements.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">14.2 Severability</h3>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining
            provisions shall continue in full force and effect.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">14.3 No Waiver</h3>
          <p>
            Our failure to enforce any right or provision of these Terms shall not constitute a
            waiver of such right or provision.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">14.4 Assignment</h3>
          <p>
            You may not assign or transfer these Terms or your rights hereunder without our prior
            written consent. We may assign or transfer these Terms without restriction.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">14.5 Force Majeure</h3>
          <p>
            We shall not be liable for any failure to perform due to causes beyond our reasonable
            control, including natural disasters, war, terrorism, riots, labor disputes, or
            governmental actions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of material
            changes by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Updating the "Last Updated" date at the top of these Terms</li>
            <li>Sending an email notification to your registered email</li>
            <li>Displaying a prominent notice on The Connection</li>
          </ul>
          <p className="mt-4">
            Your continued use of the Service after changes become effective constitutes your
            acceptance of the revised Terms. If you do not agree to the new Terms, you must stop
            using the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
          <p>
            If you have any questions, concerns, or feedback regarding these Terms, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:legal@theconnection.app" className="text-primary hover:underline">
                legal@theconnection.app
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
              Legal Department<br />
              [Your Mailing Address]<br />
              [City, State ZIP]
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">17. Acknowledgment</h2>
          <p>
            BY USING THE CONNECTION, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE,
            UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS,
            YOU MUST NOT ACCESS OR USE THE SERVICE.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            These Terms of Service are effective as of January 10, 2026 and apply to all users of
            The Connection platform, including our website and mobile applications.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Thank you for being part of The Connection community. We're committed to providing a
            safe, welcoming, and enriching platform for Christians to connect and grow together.
          </p>
        </div>
      </div>
    </div>
  );
}
