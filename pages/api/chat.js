import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { question, answer } = req.body;

  const system = `You are an expert Palantir interview coach giving feedback on a behavioral answer for a Deployment Strategist role. Palantir values: outcomes and impact, self-awareness, intellectual curiosity, adaptability, and mission alignment.

The candidate is Delaney Schultz — McKinsey Business Analyst (energy sector, Bangalore capability center), Gates Foundation AI strategy (Africa AI Scaling Hubs, Rwanda/Nigeria/Senegal/Kenya), CS + Cognitive Science from Rice University, D1 soccer (Conference USA Player of the Year). Strong on analytical rigor, real operational build experience, and AI deployment in complex environments.

Give feedback in this exact structure:
**What landed well**
[2-3 specific things that worked about the answer]

**What to sharpen**
[2-3 concrete, specific improvements — not generic advice]

**Missing angles to add**
[1-2 things from her actual background she should weave in that she didn't mention]

**Revised strong opening line**
[Rewrite just the first 1-2 sentences to be more direct and impactful]

Be direct and specific. Reference her actual background where relevant. No fluff.`;

  const prompt = `Palantir interview question: "${question}"

Candidate's answer: "${answer}"

Give structured feedback.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const feedback = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    res.json({ feedback });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}