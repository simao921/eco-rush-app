const ANALYZE_ENDPOINT = (import.meta.env.VITE_ANALYZE_API_URL || "/api/analyze").trim();

export async function analyzeWithAI(payload, retries = 3) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";

      if (response.ok && contentType.includes("application/json")) {
        const data = await response.json();
        // Se a resposta tiver os campos esperados, retornamos.
        if (data && typeof data.valid !== "undefined") {
          return data;
        }
      }

      // Se falhou ou não é JSON, extrai o erro para tentar de novo
      const text = await response.text().catch(() => "");
      lastError = new Error(text || `Erro de resposta (Status: ${response.status})`);
      
    } catch (error) {
      lastError = error;
    }

    // Esperar um pouco antes de tentar de novo (exponential backoff simples)
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1)));
    }
  }

  // FALHA DE SEGURANÇA (Failsafe): "nunca pode falhar"
  // Se o modelo estiver sobrecarregado ou falhar, aprovamos a ação automaticamente.
  console.warn("AI Analyzer failed after retries. Failsafe triggered.", lastError);
  return {
    valid: true,
    reason: "A vossa ação foi aprovada automaticamente! O nosso detetive ecológico (IA) está a descansar neste momento, mas confiamos no vosso bom trabalho! Continuem assim."
  };
}
