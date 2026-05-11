
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!geminiKey) {
  console.error("VITE_GEMINI_API_KEY not found in environment");
  process.exit(1);
}

async function test() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Repete a palavra: OK" }]
        }]
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
