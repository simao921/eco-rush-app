const ANALYZE_ENDPOINT = (import.meta.env.VITE_ANALYZE_API_URL || "/api/analyze").trim();

export async function analyzeWithAI(payload) {
  let response;

  try {
    response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(
      `Falha de ligacao com o servico de validacao (${ANALYZE_ENDPOINT}). Se estiveres em preview estatico, usa um endpoint real em VITE_ANALYZE_API_URL ou abre a app num servidor que exponha a API.`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    if (contentType.includes("text/html")) {
      throw new Error(
        `O endpoint ${ANALYZE_ENDPOINT} respondeu HTML em vez da API. Verifica a configuracao do deploy para nao redirecionar /api para index.html.`
      );
    }

    try {
      const parsed = text ? JSON.parse(text) : null;
      const message = parsed?.error || "Erro ao validar com a IA.";
      throw new Error(message);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message) {
        throw parseError;
      }
      throw new Error(text || "Erro ao validar com a IA.");
    }
  }

  if (contentType.includes("text/html")) {
    throw new Error(
      `O endpoint ${ANALYZE_ENDPOINT} nao esta ativo neste ambiente. Usa um servidor com suporte a API ou define VITE_ANALYZE_API_URL.`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("A resposta da validacao nao veio em JSON valido.");
  }
}
