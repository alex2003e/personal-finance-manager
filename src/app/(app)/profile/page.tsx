import { getProfile } from "@/lib/actions/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForms } from "./profile-forms";

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información de cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Miembro desde</CardTitle>
          <CardDescription>
            {user.createdAt.toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </CardDescription>
        </CardHeader>
      </Card>

      <ProfileForms
        name={user.name ?? ""}
        email={user.email}
        emailAlertsEnabled={user.emailAlertsEnabled}
      />
    </div>
  );
}
