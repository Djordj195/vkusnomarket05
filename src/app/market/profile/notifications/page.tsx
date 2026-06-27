import { ProfileNotificationsView } from "./ProfileNotificationsView";

export default function ProfileNotificationsPage() {
  return (
    <ProfileNotificationsView
      vapidPublicKey={
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        process.env.VAPID_PUBLIC_KEY ||
        ""
      }
    />
  );
}
