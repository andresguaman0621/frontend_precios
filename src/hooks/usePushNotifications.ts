import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(): void {
  const router = useRouter();

  useEffect(() => {
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { tipo?: string; sesion_id?: number | string }
        | undefined;
      if (data?.tipo === "idle_session" && data.sesion_id != null) {
        router.push(`/(app)/capture/${data.sesion_id}`);
      }
    });
    return () => tapSub.remove();
  }, [router]);
}
