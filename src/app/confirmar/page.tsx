"use client";

import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Hash, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton, TextField } from "@/components/auth/form-controls";
import { isAmplifyConfigured } from "@/components/providers/amplify-provider";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { confirmationSchema, getFieldErrors, type FieldErrors } from "@/lib/auth-validation";

function ConfirmationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setUsername(searchParams.get("username") ?? sessionStorage.getItem("innovatube.pendingUsername") ?? "");
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const result = confirmationSchema.safeParse({ username, code: formData.get("code") });

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
      await confirmSignUp({ username: result.data.username, confirmationCode: result.data.code });
      sessionStorage.removeItem("innovatube.pendingUsername");
      router.replace("/login?confirmed=true");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setFormError("");
    setNotice("");
    const parsed = confirmationSchema.shape.username.safeParse(username);
    if (!parsed.success) {
      setErrors({ username: parsed.error.issues[0]?.message ?? "Ingresa tu usuario." });
      return;
    }
    if (!isAmplifyConfigured) {
      setFormError("El backend local aún no está conectado.");
      return;
    }

    setResending(true);
    try {
      await resendSignUpCode({ username: parsed.data });
      setNotice("Enviamos un código nuevo a tu correo.");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Confirma tu cuenta" description="Ingresa el código de 6 dígitos que enviamos a tu correo." footer={<Link className="text-link" href="/login">Volver a iniciar sesión</Link>}>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {formError ? <AuthAlert>{formError}</AuthAlert> : null}
        {notice ? <AuthAlert kind="info">{notice}</AuthAlert> : null}
        <TextField value={username} onChange={(event) => setUsername(event.target.value)} label="Nombre de usuario" icon={UserRound} autoComplete="username" error={errors.username} required />
        <TextField name="code" label="Código de confirmación" icon={Hash} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" maxLength={6} error={errors.code} required />
        <div className="auth-actions-row">
          <button className="text-button" type="button" onClick={handleResend} disabled={resending}>{resending ? "Enviando..." : "Reenviar código"}</button>
          <SubmitButton loading={loading} loadingLabel="Confirmando...">Confirmar cuenta</SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationForm />
    </Suspense>
  );
}

