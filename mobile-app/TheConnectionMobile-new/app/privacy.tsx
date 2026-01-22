import { ScrollView, View, StyleSheet } from 'react-native';
import { Text } from '../src/theme';
import { Stack } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Last Updated: January 10, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to The Connection ("we," "our," or "us"). We are committed to protecting your
            privacy and ensuring the security of your personal information. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use
            our Christian social platform, including our website and mobile applications.
          </Text>
          <Text style={styles.paragraph}>
            By using The Connection, you agree to the collection and use of information in
            accordance with this policy. If you do not agree with our policies and practices,
            please do not use our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>

          <Text style={styles.subsectionTitle}>2.1 Information You Provide</Text>
          <Text style={styles.paragraph}>
            We collect information that you voluntarily provide when using our services:
          </Text>
          <Text style={styles.bulletPoint}>• Account Information: Username, email address, password (encrypted), display name, denomination, interests, and profile picture</Text>
          <Text style={styles.bulletPoint}>• Profile Information: Biography, location (city/state), Christian interests, and denomination preferences</Text>
          <Text style={styles.bulletPoint}>• Content: Posts, comments, prayer requests, apologetics questions and answers, messages, and other content you create or share</Text>
          <Text style={styles.bulletPoint}>• Community Data: Communities you join, events you create or RSVP to, and your interactions within communities</Text>
          <Text style={styles.bulletPoint}>• Communications: Messages you send to other users, support requests, and feedback</Text>

          <Text style={styles.subsectionTitle}>2.2 Automatically Collected Information</Text>
          <Text style={styles.paragraph}>
            When you use The Connection, we automatically collect certain information:
          </Text>
          <Text style={styles.bulletPoint}>• Usage Data: Pages viewed, features used, actions taken, time spent on the platform</Text>
          <Text style={styles.bulletPoint}>• Device Information: Device type, operating system, browser type, IP address</Text>
          <Text style={styles.bulletPoint}>• Location Data: Approximate location based on IP address (not GPS tracking)</Text>
          <Text style={styles.bulletPoint}>• Cookies and Similar Technologies: We use cookies for session management and to improve user experience</Text>
          <Text style={styles.bulletPoint}>• Error and Performance Data: Crash reports and performance metrics (via Sentry) to improve our service</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information for the following purposes:
          </Text>
          <Text style={styles.bulletPoint}>• Provide Services: Create and manage your account, enable community features, facilitate communication</Text>
          <Text style={styles.bulletPoint}>• Personalization: Recommend relevant communities, events, and content based on your interests and denomination</Text>
          <Text style={styles.bulletPoint}>• Communication: Send you verification emails, password reset links, notifications about activity on your posts, and important service updates</Text>
          <Text style={styles.bulletPoint}>• Safety and Security: Detect and prevent fraud, abuse, security incidents, and harmful activities</Text>
          <Text style={styles.bulletPoint}>• Improvement: Analyze usage patterns to improve our platform and develop new features</Text>
          <Text style={styles.bulletPoint}>• Legal Compliance: Comply with legal obligations and enforce our Terms of Service</Text>
          <Text style={styles.bulletPoint}>• Support: Respond to your support requests and feedback</Text>

          <Text style={styles.highlight}>
            We will never: Sell your personal information to third parties, use your data
            for targeted advertising outside our platform, or share your prayer requests publicly without
            your consent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. How We Share Your Information</Text>

          <Text style={styles.subsectionTitle}>4.1 Public Information</Text>
          <Text style={styles.paragraph}>
            By default, certain information is visible to other users:
          </Text>
          <Text style={styles.bulletPoint}>• Profile information (username, display name, biography, profile picture, denomination, interests)</Text>
          <Text style={styles.bulletPoint}>• Public posts, comments, and interactions</Text>
          <Text style={styles.bulletPoint}>• Communities you've joined (unless the community is private)</Text>
          <Text style={styles.bulletPoint}>• Events you've created or are attending (unless marked private)</Text>
          <Text style={styles.paragraph}>
            You can adjust your privacy settings to control what information is visible to others.
          </Text>

          <Text style={styles.subsectionTitle}>4.2 Service Providers</Text>
          <Text style={styles.paragraph}>
            We share information with trusted service providers who help us operate The Connection:
          </Text>
          <Text style={styles.bulletPoint}>• Hosting: Render.com (application hosting)</Text>
          <Text style={styles.bulletPoint}>• Database: Neon (PostgreSQL database)</Text>
          <Text style={styles.bulletPoint}>• Email: Resend (transactional emails)</Text>
          <Text style={styles.bulletPoint}>• Error Tracking: Sentry (error monitoring and performance)</Text>
          <Text style={styles.bulletPoint}>• Maps: Google Maps API (location services for events)</Text>
          <Text style={styles.bulletPoint}>• Storage: Google Cloud Storage (file uploads)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your information for as long as necessary to provide our services:
          </Text>
          <Text style={styles.bulletPoint}>• Active Accounts: Information retained while your account is active</Text>
          <Text style={styles.bulletPoint}>• Deleted Accounts: Most data is deleted within 30 days of account deletion</Text>
          <Text style={styles.bulletPoint}>• Backup Retention: Backup copies may persist for up to 90 days</Text>
          <Text style={styles.bulletPoint}>• Legal Obligations: Certain data may be retained longer to comply with legal requirements</Text>
          <Text style={styles.bulletPoint}>• Audit Logs: Security and audit logs retained for 1 year</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Privacy Rights</Text>

          <Text style={styles.subsectionTitle}>6.1 Access and Control</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access: Request a copy of your personal data</Text>
          <Text style={styles.bulletPoint}>• Correction: Update or correct inaccurate information</Text>
          <Text style={styles.bulletPoint}>• Deletion: Request deletion of your account and associated data</Text>
          <Text style={styles.bulletPoint}>• Export: Download your data in a portable format</Text>
          <Text style={styles.bulletPoint}>• Object: Object to certain processing of your data</Text>

          <Text style={styles.subsectionTitle}>6.2 Privacy Settings</Text>
          <Text style={styles.paragraph}>
            You can control your privacy through account settings:
          </Text>
          <Text style={styles.bulletPoint}>• Profile visibility (public, followers only, private)</Text>
          <Text style={styles.bulletPoint}>• Post visibility settings</Text>
          <Text style={styles.bulletPoint}>• Community and event visibility</Text>
          <Text style={styles.bulletPoint}>• Email notification preferences</Text>
          <Text style={styles.bulletPoint}>• Who can send you direct messages</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures to protect your information:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption: All data transmitted is encrypted using HTTPS/TLS</Text>
          <Text style={styles.bulletPoint}>• Password Security: Passwords are hashed using Argon2id (memory-hard algorithm)</Text>
          <Text style={styles.bulletPoint}>• Database Security: Database connections use SSL/TLS encryption</Text>
          <Text style={styles.bulletPoint}>• Access Control: Strict access controls and authentication for all systems</Text>
          <Text style={styles.bulletPoint}>• Monitoring: Continuous monitoring for security threats and vulnerabilities</Text>
          <Text style={styles.bulletPoint}>• Regular Audits: Security audit logs maintained for all sensitive operations</Text>
          <Text style={styles.bulletPoint}>• Rate Limiting: Protection against brute-force and abuse attempts</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            The Connection is intended for users aged 13 and older. We do not knowingly collect
            personal information from children under 13. If you believe we have collected information
            from a child under 13, please contact us immediately at privacy@theconnection.app
            and we will delete such information promptly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            The Connection is operated in the United States. If you are accessing our services from
            outside the U.S., please be aware that your information will be transferred to, stored,
            and processed in the United States where our servers and central database are located.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, legal requirements, or other factors. Your continued use of The Connection
            after changes become effective constitutes your acceptance of the revised Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our
            privacy practices, please contact us:
          </Text>
          <Text style={styles.bulletPoint}>• Email: privacy@theconnection.app</Text>
          <Text style={styles.bulletPoint}>• Support: support@theconnection.app</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Your Consent</Text>
          <Text style={styles.paragraph}>
            By using The Connection, you acknowledge that you have read, understood, and agree to
            this Privacy Policy. If you do not agree with this policy, please discontinue use of
            our services immediately.
          </Text>
        </View>

        <View style={[styles.section, styles.footer]}>
          <Text style={styles.footerText}>
            This Privacy Policy is effective as of January 10, 2026 and applies to all users of The Connection
            platform, including our website and mobile applications.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 8,
  },
  highlight: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
    marginTop: 12,
    fontWeight: '600',
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
