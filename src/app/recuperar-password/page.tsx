"use client";

import { confirmResetPassword, resetPassword } from "aws-amplify/auth";
import { Hash, KeyRound, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton, TextField } from "@/components/auth/form-controls";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { getFieldErrors, recoveryConfirmationSchema, recoveryRequestSchema, type FieldErrors } from "@/lib/auth-validation";

export default function PasswordRecoveryPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const result = recoveryRequestSchema.safeParse({ username });
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }
    setErrors({});
    if (!isAmplifyConfigured) {
      setFormError("El backend local aún no está conectado.");
      return;
    }

    setLoading(true);
    try {
      const output = await resetPassword({ username: result.data.username });
      if (output.nextStep.resetPasswordStep === "DONE") {
        router.replace("/login");
        return;
      }
      setNotice("Enviamos un código de recuperación a tu correo.");
      setStep("confirm");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const result = recoveryConfirmationSchema.safeParse({
      code: formData.get("code"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await confirmResetPassword({ username, confirmationCode: result.data.code, newPassword: result.data.password });
      router.replace("/login?reset=true");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={step === "request" ? "Recupera tu acceso" : "Crea una nueva contraseña"}
      description={step === "request" ? "Te enviaremos un código para restablecer tu contraseña." : "Ingresa el código recibido y elige una contraseña nueva."}
      footer={<Link className="text-link" href="/login">Volver a iniciar sesión</Link>}
    >
      <form className="auth-form" noValidate onSubmit={step === "request" ? handleRequest : handleConfirmation}>
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        {notice ? <AuthAlert kind="info">{notice}</AuthAlert> : null}
        {step === "request" ? (
          <TextField value={username} onChange={(event) => setUsername(event.target.value)} label="Usuario o correo" icon={UserRound} placeholder="usuario o nombre@correo.com" autoComplete="username" error={errors.username} required />
        ) : (
          <>
            <TextField name="code" label="Código de recuperación" icon={Hash} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={errors.code} required />
            <TextField name="password" label="Nueva contraseña" icon={KeyRound} placeholder="Mínimo 8 caracteres" type="password" autoComplete="new-password" error={errors.password} required />
            <TextField name="confirmPassword" label="Confirmar contraseña" icon={KeyRound} placeholder="Repite tu contraseña" type="password" autoComplete="new-password" error={errors.confirmPassword} required />
          </>
        )}
        <SubmitButton loading={loading} loadingLabel={step === "request" ? "Enviando..." : "Actualizando..."}>{step === "request" ? "Enviar código" : "Guardar contraseña"}</SubmitButton>
      </form>
    </AuthShell>
  );
}

