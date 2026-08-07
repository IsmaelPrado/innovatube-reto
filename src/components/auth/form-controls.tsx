"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { forwardRef, useId, useState } from "react";

type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  icon: LucideIcon;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, icon: Icon, error, id: providedId, type = "text", ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrap">
        <Icon className="input-icon" aria-hidden="true" size={18} />
        <input
          {...props}
          ref={ref}
          id={id}
          className="text-input"
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {isPassword ? (
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export function SubmitButton({
  loading,
  loadingLabel,
  children,
}: Readonly<{
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
}>) {
  return (
    <button className="primary-button" type="submit" disabled={loading}>
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      {loading ? loadingLabel : children}
    </button>
  );
}

