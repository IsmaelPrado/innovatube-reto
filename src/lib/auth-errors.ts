const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AliasExistsException: "El correo ya está asociado con otra cuenta.",
  CodeMismatchException: "El código no es correcto. Revísalo e intenta nuevamente.",
  ExpiredCodeException: "El código expiró. Solicita uno nuevo.",
  InvalidParameterException: "Revisa la información ingresada e intenta nuevamente.",
  InvalidPasswordException: "La contraseña no cumple con los requisitos de seguridad.",
  LimitExceededException: "Se alcanzó el límite de intentos. Espera unos minutos.",
  NetworkError: "No fue posible conectar con el servicio. Revisa tu conexión.",
  NotAuthorizedException: "El usuario o la contraseña no son correctos.",
  PasswordResetRequiredException: "Debes restablecer tu contraseña para continuar.",
  TooManyFailedAttemptsException: "Demasiados intentos fallidos. Intenta más tarde.",
  TooManyRequestsException: "Hay demasiadas solicitudes. Espera un momento.",
  UserAlreadyAuthenticatedException: "Ya existe una sesión activa.",
  UsernameExistsException: "Ese nombre de usuario ya está registrado.",
  UserNotConfirmedException: "Confirma tu cuenta antes de iniciar sesión.",
  UserNotFoundException: "No encontramos una cuenta con esos datos.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (/captcha|robot/i.test(error.message)) {
      return "La verificación reCAPTCHA expiró o no fue válida. Intenta nuevamente.";
    }
    return AUTH_ERROR_MESSAGES[error.name] ?? "No pudimos completar la operación. Intenta nuevamente.";
  }

  return "Ocurrió un error inesperado. Intenta nuevamente.";
}
