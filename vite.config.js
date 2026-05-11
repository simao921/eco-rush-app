import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const registerAnalyzeMiddleware = (middlewares) => {
    middlewares.use(async (req, res, next) => {
      if (req.url === '/api/analyze' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', async () => {
          try {
            const body = JSON.parse(bodyStr);
            const { images, prompt } = body;
            const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
            if (!geminiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "GEMINI_API_KEY nao configurada" }));
              return;
            }
            let imageParts = [];
            if (images && Array.isArray(images)) {
              imageParts = images.map(data => ({ inline_data: { mime_type: "image/jpeg", data } }));
            }
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, ...imageParts] }],
                generationConfig: { response_mime_type: "application/json" }
              })
            });
            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              res.end(data.candidates[0].content.parts[0].text);
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: data?.error?.message || "Erro na resposta da IA" }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }
      next();
    });
  };

  return {
    plugins: [
      react(),
      {
        name: 'ai-proxy',
        configureServer(server) {
          registerAnalyzeMiddleware(server.middlewares);
        },
        configurePreviewServer(server) {
          registerAnalyzeMiddleware(server.middlewares);
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['jspdf']
    }
  };
})
