"use client";

import { signUp } from "aws-amplify/auth";
import { AtSign, KeyRound, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton, TextField } from "@/components/auth/form-controls";
import { executeSignUpCaptcha, RecaptchaField } from "@/components/auth/recaptcha-field";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getFieldErrors, registrationSchema, type FieldErrors } from "@/lib/auth-validation";

export default function RegistrationPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const result = registrationSchema.safeParse({
      givenName: formData.get("givenName"),
      familyName: formData.get("familyName"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
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
      const captchaToken = await executeSignUpCaptcha();
      const { givenName, familyName, username, email, password } = result.data;
      const { nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            given_name: givenName,
            family_name: familyName,
          },
          clientMetadata: {
            recaptchaToken: captchaToken,
          },
        },
      });

      if (nextStep.signUpStep === "DONE") {
        router.replace("/login");
        return;
      }

      sessionStorage.setItem("innovatube.pendingUsername", username);
      router.push(`/confirmar?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      description="Completa tus datos para comenzar."
      footer={
        <>
          ¿Ya tienes una cuenta? <Link className="text-link" href="/login">Inicia sesión</Link>
        </>
      }
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {!isAmplifyConfigured ? (
          <AuthAlert kind="info">La interfaz está lista. Falta generar el entorno AWS para habilitar el registro.</AuthAlert>
        ) : null}
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        <div className="field-grid">
          <TextField name="givenName" label="Nombre" icon={UserRound} placeholder="Tu nombre" autoComplete="given-name" error={errors.givenName} required />
          <TextField name="familyName" label="Apellido" icon={UserRound} placeholder="Tu apellido" autoComplete="family-name" error={errors.familyName} required />
        </div>
        <TextField name="username" label="Nombre de usuario" icon={AtSign} placeholder="ejemplo.usuario" autoComplete="username" error={errors.username} required />
        <TextField name="email" label="Correo electrónico" icon={Mail} placeholder="nombre@correo.com" type="email" autoComplete="email" error={errors.email} required />
        <div className="field-grid">
          <TextField name="password" label="Contraseña" icon={KeyRound} placeholder="Mínimo 8 caracteres" type="password" autoComplete="new-password" error={errors.password} required />
          <TextField name="confirmPassword" label="Confirmar contraseña" icon={KeyRound} placeholder="Repite tu contraseña" type="password" autoComplete="new-password" error={errors.confirmPassword} required />
        </div>
        <p className="helper-text">Usa mayúsculas, minúsculas, un número y un símbolo.</p>
        <RecaptchaField />
        <SubmitButton loading={loading} loadingLabel="Creando cuenta...">Crear cuenta</SubmitButton>
      </form>
    </AuthShell>
  );
}
