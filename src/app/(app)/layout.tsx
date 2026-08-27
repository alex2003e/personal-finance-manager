import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { computeAlerts } from "@/lib/alerts";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, image: true },
  });
  if (!user?.emailVerified) redirect("/verify-email");

  const alerts = await computeAlerts(session.user.id);

  return (
    <AppShell userName={session.user.name} userImage={user.image} alerts={alerts}>
      {children}
    </AppShell>
  );
}
