export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  } else if (!body) {
    const buffers = [];
    for await (const chunk of req) { buffers.push(chunk); }
    const data = Buffer.concat(buffers).toString();
    try { body = JSON.parse(data); } catch(e) { body = {}; }
  }

  const { file_urls, images, prompt: userPrompt } = body || {};
  const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  }

  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt não fornecido.' });
  }

  try {
    let imageParts = [];
    if (images && Array.isArray(images) && images.length > 0) {
      imageParts = images.map(base64 => ({
        inline_data: { mime_type: "image/jpeg", data: base64 }
      }));
    } else if (file_urls && Array.isArray(file_urls) && file_urls.length > 0) {
      imageParts = await Promise.all(file_urls.map(async (url) => {
        const resp = await fetch(url);
        const buffer = await resp.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return { inline_data: { mime_type: "image/jpeg", data: base64 } };
      }));
    }

    if (imageParts.length === 0) {
       return res.status(400).json({ error: 'Nenhuma imagem fornecida para análise.' });
    }

    // Instrução de Sistema para tornar a IA um "Árbitro Digital" de elite
    const systemInstruction = `
      És o Árbitro Digital do Eco-Rush na escola EB 2,3 El Rei D. Manuel I. 
      O teu objetivo é validar ações ecológicas com 100% de rigor.
      
      REGRAS CRÍTICAS:
      1. ANTI-FRAUDE: Rejeita IMEDIATAMENTE se vires um telemóvel a filmar outro ecrã, fotos de ecrãs de computador ou vídeos repetidos.
      2. VALIDAÇÃO: Só aprova se a ação (luz apagada, lixo no balde, reciclagem) for claramente visível e em tempo real.
      3. RESPOSTA: Responde APENAS em JSON puro. Nunca adiciones texto fora do JSON.
      
      Formato de resposta:
      {"valid": boolean, "reason": "Explicação curta em Português de Portugal"}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemInstruction + "\n\nDesafio Atual: " + userPrompt },
            ...imageParts
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Mais preciso, menos criativo
          topP: 0.8,
          topK: 40,
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res.status(500).json({ error: 'A IA está temporariamente ocupada. Tenta em 10 segundos.' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      try {
        const result = JSON.parse(text.trim());
        return res.status(200).json(result);
      } catch (e) {
        return res.status(500).json({ error: 'Erro ao processar veredito da IA.' });
      }
    } else {
      return res.status(500).json({ error: 'A IA não conseguiu observar a ação. Tenta outro ângulo.' });
    }
  } catch (error) {
    console.error("Internal Error:", error);
    return res.status(500).json({ error: 'Erro na ligação com o árbitro digital.' });
  }
}
