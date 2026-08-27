"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateName, updateEmail, changePassword, setEmailAlertsEnabled } from "@/lib/actions/profile";
import { AvatarUpload } from "@/components/avatar-upload";

function PasswordField({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <PasswordField
            id="currentPassword"
            label="Contraseña actual"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordField
            id="newPassword"
            label="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileForms({
  name: initialName,
  email: initialEmail,
  emailAlertsEnabled: initialEmailAlerts,
  image,
}: {
  name: string;
  email: string;
  emailAlertsEnabled: boolean;
  image: string | null;
}) {
  const router = useRouter();

  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [name, setName] = useState(initialName);
  const [nameLoading, setNameLoading] = useState(false);

  const [emailEditing, setEmailEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (name === initialName) return;
    setNameLoading(true);
    try {
      await updateName({ name });
      toast.success("Nombre actualizado");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setNameLoading(false);
    }
  }

  async function onSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await updateEmail({ email, currentPassword: emailPassword });
      toast.success("Email actualizado. Vuelve a iniciar sesión para que el cambio tome efecto.");
      setEmailPassword("");
      setEmailEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setEmailLoading(false);
    }
  }

  async function onToggleAlerts(checked: boolean) {
    setEmailAlerts(checked);
    setAlertsLoading(true);
    try {
      await setEmailAlertsEnabled(checked);
    } finally {
      setAlertsLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUpload name={initialName || initialEmail} image={image} />

          <form onSubmit={onSaveName} className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <div className="flex gap-2">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              {name !== initialName && (
                <Button type="submit" size="sm" disabled={nameLoading}>
                  {nameLoading ? "..." : "Guardar"}
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            {emailEditing ? (
              <form onSubmit={onSaveEmail} className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <PasswordField
                  id="emailPassword"
                  label="Confirma tu contraseña actual"
                  value={emailPassword}
                  onChange={setEmailPassword}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={emailLoading}>
                    {emailLoading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmailEditing(false);
                      setEmail(initialEmail);
                      setEmailPassword("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <Input id="email" value={email} disabled className="text-muted-foreground" />
                <Button type="button" variant="outline" size="sm" onClick={() => setEmailEditing(true)}>
                  Cambiar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1 border-t pt-4">
            <Label>Contraseña</Label>
            <div>
              <ChangePasswordDialog />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificaciones por correo</CardTitle>
          <CardDescription>
            Recibe un resumen diario por correo con tus alertas pendientes (cuotas sin abonar,
            metas estancadas, presupuesto excedido).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={emailAlerts}
              disabled={alertsLoading}
              onChange={(e) => onToggleAlerts(e.target.checked)}
              className="h-4 w-4"
            />
            Enviarme un resumen diario de alertas por correo
          </label>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Cerrar sesión</CardTitle>
          <CardDescription>Cierra tu sesión en este dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
