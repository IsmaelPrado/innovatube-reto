"use client";

import { signIn } from "aws-amplify/auth";
import { KeyRound, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton, TextField } from "@/components/auth/form-controls";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getFieldErrors, loginSchema, type FieldErrors } from "@/lib/auth-validation";

export default function LoginPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      username: formData.get("username"),
      password: formData.get("password"),
    });

    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    if (!isAmplifyConfigured) {
      setFormError("El backend local aún no está conectado. Ejecuta npm run sandbox para generar la configuración.");
      return;
    }

    setLoading(true);
    try {
      const { nextStep, isSignedIn } = await signIn(result.data);

      if (isSignedIn || nextStep.signInStep === "DONE") {
        router.replace("/videos");
        return;
      }

      if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        sessionStorage.setItem("innovatube.pendingUsername", result.data.username);
        router.push(`/confirmar?username=${encodeURIComponent(result.data.username)}`);
        return;
      }

      if (nextStep.signInStep === "RESET_PASSWORD") {
        router.push("/recuperar-password");
        return;
      }

      setFormError("Tu cuenta requiere un paso de autenticación que todavía no está habilitado.");
    } catch (error) {
      if (error instanceof Error && error.name === "UserNotConfirmedException") {
        sessionStorage.setItem("innovatube.pendingUsername", result.data.username);
        router.push(`/confirmar?username=${encodeURIComponent(result.data.username)}`);
        return;
      }
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      description="Ingresa con tu nombre de usuario o correo electrónico."
      footer={
        <>
          ¿Aún no tienes cuenta? <Link className="text-link" href="/registro">Crea una</Link>
        </>
      }
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {!isAmplifyConfigured ? (
          <AuthAlert kind="info">La interfaz está lista. Falta generar el entorno AWS para habilitar el acceso.</AuthAlert>
        ) : null}
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        <TextField
          name="username"
          label="Usuario o correo"
          icon={UserRound}
          placeholder="usuario o nombre@correo.com"
          autoComplete="username"
          error={errors.username}
          required
        />
        <TextField
          name="password"
          label="Contraseña"
          icon={KeyRound}
          placeholder="Ingresa tu contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          required
        />
        <div className="auth-actions-row">
          <Link className="text-link" href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
          <SubmitButton loading={loading} loadingLabel="Ingresando...">Iniciar sesión</SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}

