import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-3xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/dashboard">
        <Button>Ir al Dashboard</Button>
      </Link>
    </div>
  );
}
