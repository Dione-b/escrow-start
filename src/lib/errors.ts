/** Converte erros (axios, carteira, Error) em uma mensagem curta para o usuário. */
export function errorMessage(error: unknown) {
  // Erros do axios trazem o corpo da API em response.data (ex.: { message, details })
  const data = (error as { response?: { data?: { message?: string; details?: Record<string, string[]> } } })?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  const raw = data?.message ?? (error instanceof Error ? error.message : typeof error === "string" ? error : "");
  if (/reject|denied|declined|cancel/i.test(raw)) return "Assinatura recusada na carteira.";
  if (/401|unauthor/i.test(raw)) return "API key inválida ou ausente (NEXT_PUBLIC_API_KEY).";
  return raw || "Não foi possível concluir a operação.";
}
