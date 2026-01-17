import { Redirect } from 'expo-router';

// This tab redirects to the questions inbox screen
// Only shown when user has inbox_access permission
export default function InboxTab() {
  return <Redirect href="/questions/inbox" />;
}
