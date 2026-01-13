import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.date}>Last Updated: January 10, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            Welcome to The Connection! These Terms of Service ("Terms") govern your access to and
            use of The Connection's website, mobile applications, and services (collectively, the
            "Service"). By accessing or using the Service, you agree to be bound by these Terms and
            our Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            If you do not agree to these Terms, you may not access or use the Service. We may
            modify these Terms at any time, and such modifications will be effective immediately
            upon posting. Your continued use of the Service after changes constitutes your
            acceptance of the modified Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.paragraph}>
            You must meet the following requirements to use The Connection:
          </Text>
          <Text style={styles.bulletPoint}>• You must be at least 13 years old</Text>
          <Text style={styles.bulletPoint}>• You must provide accurate and complete registration information</Text>
          <Text style={styles.bulletPoint}>• You must not be prohibited from using the Service under applicable law</Text>
          <Text style={styles.bulletPoint}>• You must not have been previously banned from The Connection</Text>
          <Text style={styles.paragraph}>
            If you are between 13-18 years old, you represent that you have permission from a parent
            or guardian to use The Connection, and they have agreed to these Terms on your behalf.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>

          <Text style={styles.subsectionTitle}>3.1 Account Creation</Text>
          <Text style={styles.paragraph}>
            To use certain features of The Connection, you must create an account. When creating an account:
          </Text>
          <Text style={styles.bulletPoint}>• You must provide accurate, current, and complete information</Text>
          <Text style={styles.bulletPoint}>• You must maintain and update your information to keep it accurate</Text>
          <Text style={styles.bulletPoint}>• You are responsible for maintaining the confidentiality of your password</Text>
          <Text style={styles.bulletPoint}>• You are responsible for all activities that occur under your account</Text>
          <Text style={styles.bulletPoint}>• You must immediately notify us of any unauthorized use of your account</Text>

          <Text style={styles.subsectionTitle}>3.2 Account Security</Text>
          <Text style={styles.paragraph}>
            You agree to use a strong password and enable any available security features. You must
            not share your account credentials with anyone else. We are not liable for any loss or
            damage arising from your failure to protect your account information.
          </Text>

          <Text style={styles.subsectionTitle}>3.3 Account Termination</Text>
          <Text style={styles.paragraph}>
            You may terminate your account at any time through your account settings. We reserve the
            right to suspend or terminate your account at any time, with or without notice, for
            violations of these Terms or for any other reason at our sole discretion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Community Guidelines and Acceptable Use</Text>

          <Text style={styles.subsectionTitle}>4.1 Our Mission</Text>
          <Text style={styles.paragraph}>
            The Connection is a Christian social platform designed to foster meaningful connections,
            spiritual growth, and community support. We expect all users to treat each other with
            respect, kindness, and Christian love.
          </Text>

          <Text style={styles.subsectionTitle}>4.2 Prohibited Conduct</Text>
          <Text style={styles.paragraph}>
            You agree NOT to use The Connection to:
          </Text>
          <Text style={styles.bulletPoint}>• Harass or Bully: Harass, threaten, intimidate, or bully other users</Text>
          <Text style={styles.bulletPoint}>• Hate Speech: Post content that promotes hatred, violence, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</Text>
          <Text style={styles.bulletPoint}>• False Information: Spread misinformation, false teachings contrary to mainstream Christianity, or deceptive content</Text>
          <Text style={styles.bulletPoint}>• Spam: Send unsolicited messages, advertisements, or promotional content</Text>
          <Text style={styles.bulletPoint}>• Illegal Activity: Engage in or promote illegal activities</Text>
          <Text style={styles.bulletPoint}>• Sexual Content: Post pornographic, sexually explicit, or inappropriate content</Text>
          <Text style={styles.bulletPoint}>• Violence: Glorify, promote, or threaten violence</Text>
          <Text style={styles.bulletPoint}>• Impersonation: Impersonate others or misrepresent your identity or affiliation</Text>
          <Text style={styles.bulletPoint}>• Privacy Violation: Share private information about others without consent</Text>
          <Text style={styles.bulletPoint}>• Intellectual Property: Violate copyright, trademark, or other intellectual property rights</Text>
          <Text style={styles.bulletPoint}>• Platform Abuse: Attempt to hack, disrupt, or exploit the Service or its systems</Text>
          <Text style={styles.bulletPoint}>• Automated Use: Use bots, scrapers, or automated tools without permission</Text>

          <Text style={styles.subsectionTitle}>4.3 Theological Diversity</Text>
          <Text style={styles.paragraph}>
            While The Connection welcomes Christians from various denominations and traditions, we
            expect respectful dialogue. Users should engage in theological discussions with grace,
            humility, and a spirit of learning. Personal attacks based on denominational differences
            are not acceptable.
          </Text>

          <Text style={styles.subsectionTitle}>4.4 Moderation</Text>
          <Text style={styles.paragraph}>
            We reserve the right to remove content, suspend accounts, or take any other action we
            deem necessary to maintain a safe and welcoming community.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Content</Text>

          <Text style={styles.subsectionTitle}>5.1 Your Content</Text>
          <Text style={styles.paragraph}>
            You retain ownership of all content you post, upload, or share on The Connection
            ("User Content"). This includes posts, comments, prayer requests, messages, photos,
            videos, and other materials.
          </Text>

          <Text style={styles.subsectionTitle}>5.2 License to The Connection</Text>
          <Text style={styles.paragraph}>
            By posting User Content, you grant The Connection a worldwide, non-exclusive, royalty-free,
            transferable license to use, reproduce, distribute, display, and perform your User Content
            in connection with operating and providing the Service. This license allows us to:
          </Text>
          <Text style={styles.bulletPoint}>• Display your content to other users as per your privacy settings</Text>
          <Text style={styles.bulletPoint}>• Store and backup your content</Text>
          <Text style={styles.bulletPoint}>• Moderate and remove content that violates our policies</Text>
          <Text style={styles.bulletPoint}>• Format and display your content across different devices and platforms</Text>

          <Text style={styles.subsectionTitle}>5.3 Responsibility for Content</Text>
          <Text style={styles.paragraph}>
            You are solely responsible for your User Content. You represent and warrant that:
          </Text>
          <Text style={styles.bulletPoint}>• You own or have the necessary rights to post your content</Text>
          <Text style={styles.bulletPoint}>• Your content does not violate any third-party rights</Text>
          <Text style={styles.bulletPoint}>• Your content complies with these Terms and applicable laws</Text>

          <Text style={styles.subsectionTitle}>5.4 Content Removal</Text>
          <Text style={styles.paragraph}>
            We reserve the right, but not the obligation, to remove any User Content that violates
            these Terms or that we deem inappropriate. We may also be required to remove content in
            response to legal requests or court orders.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>

          <Text style={styles.subsectionTitle}>6.1 The Connection's Property</Text>
          <Text style={styles.paragraph}>
            The Service, including its design, features, functionality, text, graphics, logos,
            and software, is owned by The Connection and is protected by copyright, trademark,
            and other intellectual property laws. You may not:
          </Text>
          <Text style={styles.bulletPoint}>• Copy, modify, distribute, or create derivative works from the Service</Text>
          <Text style={styles.bulletPoint}>• Reverse engineer or attempt to extract source code</Text>
          <Text style={styles.bulletPoint}>• Use The Connection's name, logo, or trademarks without permission</Text>
          <Text style={styles.bulletPoint}>• Remove or alter any proprietary notices</Text>

          <Text style={styles.subsectionTitle}>6.2 Copyright Infringement</Text>
          <Text style={styles.paragraph}>
            We respect intellectual property rights. If you believe content on The Connection
            infringes your copyright, please contact us at copyright@theconnection.app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Privacy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Please review our Privacy Policy to understand how we
            collect, use, and protect your information. By using The Connection, you agree to our
            Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disclaimers</Text>

          <Text style={styles.subsectionTitle}>8.1 "As Is" Service</Text>
          <Text style={styles.highlight}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
          </Text>

          <Text style={styles.subsectionTitle}>8.2 No Guarantee</Text>
          <Text style={styles.paragraph}>
            We do not guarantee that the Service will be uninterrupted, secure, or error-free. We
            make no warranty regarding the quality, accuracy, timeliness, truthfulness, completeness,
            or reliability of any content on The Connection.
          </Text>

          <Text style={styles.subsectionTitle}>8.3 Spiritual Advice</Text>
          <Text style={styles.paragraph}>
            The Connection is a platform for community and discussion. Content shared by users,
            including theological discussions and advice, does not constitute professional spiritual
            counseling, therapy, or medical advice. For serious spiritual, mental health, or medical
            concerns, please consult qualified professionals.
          </Text>

          <Text style={styles.subsectionTitle}>8.4 User Interactions</Text>
          <Text style={styles.paragraph}>
            We are not responsible for the conduct of users on or off the Service. You are solely
            responsible for your interactions with other users. We recommend exercising caution and
            good judgment when interacting with others online.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE CONNECTION, ITS AFFILIATES, OFFICERS,
            DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THE SERVICE.
          </Text>
          <Text style={styles.paragraph}>
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL
            NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR
            $100.00, WHICHEVER IS GREATER.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Dispute Resolution</Text>

          <Text style={styles.subsectionTitle}>10.1 Informal Resolution</Text>
          <Text style={styles.paragraph}>
            Before filing any formal dispute, you agree to contact us at legal@theconnection.app
            to attempt to resolve the matter informally. We will make a good faith effort to resolve
            any disputes through informal negotiation.
          </Text>

          <Text style={styles.subsectionTitle}>10.2 Class Action Waiver</Text>
          <Text style={styles.paragraph}>
            YOU AND THE CONNECTION AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR
            OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS
            OR REPRESENTATIVE PROCEEDING.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. We will notify you of material
            changes by updating the "Last Updated" date at the top of these Terms, sending an email
            notification, or displaying a prominent notice on The Connection.
          </Text>
          <Text style={styles.paragraph}>
            Your continued use of the Service after changes become effective constitutes your
            acceptance of the revised Terms. If you do not agree to the new Terms, you must stop
            using the Service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions, concerns, or feedback regarding these Terms, please contact us:
          </Text>
          <Text style={styles.bulletPoint}>• Email: legal@theconnection.app</Text>
          <Text style={styles.bulletPoint}>• Support: support@theconnection.app</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Acknowledgment</Text>
          <Text style={styles.highlight}>
            BY USING THE CONNECTION, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE,
            UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS,
            YOU MUST NOT ACCESS OR USE THE SERVICE.
          </Text>
        </View>

        <View style={[styles.section, styles.footer]}>
          <Text style={styles.footerText}>
            These Terms of Service are effective as of January 10, 2026 and apply to all users of
            The Connection platform, including our website and mobile applications.
          </Text>
          <Text style={[styles.footerText, { marginTop: 12 }]}>
            Thank you for being part of The Connection community. We're committed to providing a
            safe, welcoming, and enriching platform for Christians to connect and grow together.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 8,
  },
  highlight: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 12,
    fontWeight: '600',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
