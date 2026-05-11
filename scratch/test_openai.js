
const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error("VITE_OPENAI_API_KEY not found in environment");
  process.exit(1);
}

async function test() {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5
      })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
