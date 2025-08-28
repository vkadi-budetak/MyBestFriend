import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `
Ти — дружній співрозмовник і репетитор німецької (A2–B1).
Відповідай коротко і природно.
Структура:
1) Відповідь німецькою (1–3 речення).
2) Якщо є помилка:
   – Falsch: …
   – Richtig: …
   – Warum: (українською, 1 коротке речення)
3) 🔹 Міні-вправа (1 рядок), якщо доречно.
`;

app.post("/chat", async (req, res) => {
  const userText = (req.body?.message || "").toString().slice(0, 2000);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error:", errText);
      return res.status(500).json({ error: "LLM request failed" });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? "…";
    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
