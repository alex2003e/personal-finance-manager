import { getProfile } from "@/lib/actions/profile";
import { ProfileForms } from "./profile-forms";

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="space-y-6">
      <div>
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

      <ProfileForms
        name={user.name ?? ""}
        email={user.email}
        emailAlertsEnabled={user.emailAlertsEnabled}
        image={user.image}
      />
    </div>
  );
}
