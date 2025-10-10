#!/usr/bin/env tsx
import { sendPushNotification } from '../server/services/pushService';

async function main() {
  const token = process.argv[2] || process.env.EXPO_PUSH_TOKEN;
  if (!token) {
    console.error('Usage: tsx scripts/send-test-push.ts <EXPO_PUSH_TOKEN> OR set EXPO_PUSH_TOKEN env var');
    process.exit(1);
  }

  try {
    console.log('Sending test push to', token);
    const tickets = await sendPushNotification(token, 'The Connection — test', 'This is a test push sent from the dev environment');
    console.log('Expo tickets:', JSON.stringify(tickets, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error sending push:', err);
    process.exit(2);
  }
}

main();
