type GraphQLErrorLike = { message?: string };

const FRIENDLY_MESSAGES: Array<[RegExp, string]> = [
  [/unauthorized|not authorized/i, "Tu sesión no tiene permiso para realizar esta operación."],
  [/conditional check failed|already exists/i, "Este video ya está en tus favoritos."],
  [/network|fetch failed/i, "No fue posible conectar con el servicio."],
  [/quota.+youtube/i, "La cuota de búsqueda de YouTube se agotó temporalmente."],
  [/youtube no está disponible/i, "YouTube no está disponible en este momento."],
];

export function getDataErrorMessage(error: unknown, graphqlErrors?: readonly GraphQLErrorLike[]) {
  const source = graphqlErrors?.[0]?.message ?? (error instanceof Error ? error.message : "");
  const match = FRIENDLY_MESSAGES.find(([pattern]) => pattern.test(source));
  return match?.[1] ?? "No pudimos completar la operación. Intenta nuevamente.";
}

