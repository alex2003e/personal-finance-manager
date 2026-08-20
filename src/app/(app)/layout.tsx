import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { computeAlerts } from "@/lib/alerts";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const alerts = await computeAlerts(session.user.id);

  return (
    <AppShell userName={session.user.name} alerts={alerts}>
      {children}
    </AppShell>
  );
}
