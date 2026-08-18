import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1">
      <Nav userName={session.user.name} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
