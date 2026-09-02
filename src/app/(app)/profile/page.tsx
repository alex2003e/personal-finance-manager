import { getProfile } from "@/lib/actions/profile";
import { getSubscriptionInfo } from "@/lib/actions/subscription";
import { ProfileForms } from "./profile-forms";
import { SubscriptionCard } from "./subscription-card";

export default async function ProfilePage() {
  const [user, subscription] = await Promise.all([getProfile(), getSubscriptionInfo()]);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información de cuenta · Miembro desde{" "}
          {user.createdAt.toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <SubscriptionCard
          status={subscription.subscriptionStatus}
          plan={subscription.subscriptionPlan}
          currentPeriodEnd={subscription.currentPeriodEnd?.toISOString() ?? null}
        />
      </div>

      <ProfileForms
        name={user.name ?? ""}
        email={user.email}
        emailAlertsEnabled={user.emailAlertsEnabled}
        image={user.image}
      />
    </div>
  );
}
