"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateName, updateEmail, changePassword, setEmailAlertsEnabled } from "@/lib/actions/profile";

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

export function ProfileForms({
  name: initialName,
  email: initialEmail,
  emailAlertsEnabled: initialEmailAlerts,
}: {
  name: string;
  email: string;
  emailAlertsEnabled: boolean;
}) {
  const router = useRouter();

  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [name, setName] = useState(initialName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [email, setEmail] = useState(initialEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameMsg(null);
    try {
      await updateName({ name });
      setNameMsg("Nombre actualizado");
      router.refresh();
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setNameLoading(false);
    }
  }

  async function onSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      await updateEmail({ email, currentPassword: emailPassword });
      setEmailMsg({
        type: "success",
        text: "Email actualizado. Vuelve a iniciar sesión para que el cambio tome efecto.",
      });
      setEmailPassword("");
    } catch (err) {
      setEmailMsg({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudo actualizar",
      });
    } finally {
      setEmailLoading(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwMsg({ type: "success", text: "Contraseña actualizada" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudo actualizar",
      });
    } finally {
      setPwLoading(false);
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
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nombre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveName} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-1">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <Button type="submit" disabled={nameLoading}>
              {nameLoading ? "Guardando..." : "Guardar"}
            </Button>
          </form>
          {nameMsg && <p className="mt-2 text-sm text-muted-foreground">{nameMsg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
          <CardDescription>Necesitas confirmar tu contraseña actual para cambiarlo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveEmail} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <PasswordField
              id="emailPassword"
              label="Contraseña actual"
              value={emailPassword}
              onChange={setEmailPassword}
            />
            <Button type="submit" disabled={emailLoading}>
              {emailLoading ? "Guardando..." : "Guardar"}
            </Button>
          </form>
          {emailMsg && (
            <p
              className={`mt-2 text-sm ${emailMsg.type === "error" ? "text-destructive" : "text-success"}`}
            >
              {emailMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSavePassword} className="space-y-3">
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
            <Button type="submit" disabled={pwLoading}>
              {pwLoading ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </form>
          {pwMsg && (
            <p className={`mt-2 text-sm ${pwMsg.type === "error" ? "text-destructive" : "text-success"}`}>
              {pwMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base">Cerrar sesión</CardTitle>
          <CardDescription>Cierra tu sesión en este dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
