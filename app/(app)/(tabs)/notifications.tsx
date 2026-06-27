import { Screen, Subtitle, Title } from '@/components/ui';
import { NotificationsList } from '@/components/NotificationsList';

export default function NotificationsScreen() {
  return (
    <Screen style={{ flex: 1, paddingBottom: 0 }}>
      <Title>Notifications</Title>
      <Subtitle>Updates from your organization</Subtitle>
      <NotificationsList />
    </Screen>
  );
}
