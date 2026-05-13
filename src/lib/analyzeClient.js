const ANALYZE_ENDPOINT = (import.meta.env.VITE_ANALYZE_API_URL || "/api/analyze").trim();

export async function analyzeWithAI(payload, retries = 3) {
  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      const response = await fetch(ANALYZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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

  // Se falhou todas as tentativas, lança um erro amigável para a turma
  console.error("AI Analyzer failed after retries:", lastError);
  throw new Error("A nossa IA está com muito tráfego neste momento. Por favor, aguardem uns minutos e tentem de novo!");
}
