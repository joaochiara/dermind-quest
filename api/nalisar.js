const ALLOWED_ORIGINS = [
  "https://dermind.app/ava",
  "https://dermind.app",
  "http://localhost:8080",
  "http://localhost:3000",
]

export default async function handler(req, res) {
  const origin = req.headers["origin"] ?? ""
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader("Access-Control-Allow-Origin", allowOrigin)
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido. Use POST." })

  try {
    const prompt = req.body?.prompt

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ erro: "O campo 'prompt' é obrigatório." })
    }

    const apiKey = process.env.ANTHROPIC_KEY
    if (!apiKey) {
      return res.status(500).json({ erro: "Chave da API não configurada no servidor." })
    }

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!resposta.ok) {
      const erroTexto = await resposta.text()
      return res.status(502).json({ erro: "Erro ao chamar a IA: " + erroTexto })
    }

    const dados = await resposta.json()
    let resultado = dados?.content?.[0]?.text ?? "Sem resposta da IA."
    resultado = resultado
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()

    return res.status(200).json({ resultado })

  } catch (e) {
    return res.status(500).json({ erro: "Erro inesperado: " + e.message })
  }
}
