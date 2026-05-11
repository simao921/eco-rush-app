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

  // Capturar o body manualmente se necessário
  let body = req.body;
  
  // Se o body for um stream ou string, vamos garantir que temos um objeto
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  } else if (!body) {
    // Tenta ler o body do stream se estiver vazio (comum em Vercel/Vite)
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    try { body = JSON.parse(data); } catch(e) { body = {}; }
  }

  const { file_urls, images, prompt } = body || {};
  const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt não fornecido.' });
  }

  try {
    let imageParts = [];

    if (images && Array.isArray(images) && images.length > 0) {
      imageParts = images.map(base64 => ({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64
        }
      }));
    } else if (file_urls && Array.isArray(file_urls) && file_urls.length > 0) {
      imageParts = await Promise.all(file_urls.map(async (url) => {
        const resp = await fetch(url);
        const buffer = await resp.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64
          }
        };
      }));
    }

    if (imageParts.length === 0) {
       return res.status(400).json({ error: 'Nenhuma imagem fornecida para análise.' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt + "\nResponde APENAS em JSON no formato: {\"valid\": boolean, \"reason\": \"string\"}" },
            ...imageParts
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini Error:", data.error);
      return res.status(500).json({ error: data.error.message || 'Erro no Gemini' });
    }

    const candidates = data.candidates || [];
    if (candidates.length > 0 && candidates[0]?.content?.parts?.[0]?.text) {
      const text = candidates[0].content.parts[0].text;
      try {
        const result = JSON.parse(text);
        return res.status(200).json(result);
      } catch (e) {
        console.error("JSON Parse Error:", text);
        return res.status(500).json({ error: 'A IA deu uma resposta num formato invalido.' });
      }
    } else {
      console.error("Gemini Empty Response:", JSON.stringify(data));
      return res.status(500).json({ error: 'A IA nao conseguiu analisar a imagem. Tenta de novo.' });
    }
  } catch (error) {
    console.error("Internal Error:", error);
    return res.status(500).json({ error: `Erro interno: ${error.message}` });
  }
}
