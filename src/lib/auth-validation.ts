import { z } from "zod";

const password = z
  .string()
  .min(8, "Usa al menos 8 caracteres.")
  .regex(/[a-z]/, "Incluye una letra minúscula.")
  .regex(/[A-Z]/, "Incluye una letra mayúscula.")
  .regex(/[0-9]/, "Incluye un número.")
  .regex(/[^A-Za-z0-9]/, "Incluye un símbolo.");

export const registrationSchema = z
  .object({
    givenName: z.string().trim().min(2, "Ingresa tu nombre."),
    familyName: z.string().trim().min(2, "Ingresa tu apellido."),
    username: z
      .string()
      .trim()
      .min(3, "Usa al menos 3 caracteres.")
      .max(30, "Usa máximo 30 caracteres.")
      .regex(/^[a-zA-Z0-9._-]+$/, "Usa letras, números, puntos, guiones o guion bajo.")
      .refine((value) => !value.includes("@"), "El nombre de usuario no puede ser un correo."),
    email: z.email("Ingresa un correo válido.").trim().toLowerCase(),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario o correo."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export const confirmationSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu nombre de usuario."),
  code: z.string().trim().regex(/^\d{6}$/, "Ingresa el código de 6 dígitos."),
});

export const recoveryRequestSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario o correo."),
});

export const recoveryConfirmationSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, "Ingresa el código de 6 dígitos."),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type FieldErrors = Record<string, string>;

export function getFieldErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
    return errors;
  }, {});
}

