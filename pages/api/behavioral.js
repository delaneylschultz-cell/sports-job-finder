import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const system = `You are an expert Palantir interview coach. Search the web for real reported Palantir Deployment Strategist interview questions from Reddit, Glassdoor, Blind, and the Palantir blog. Combine these with your knowledge of the DS role to generate a comprehensive set of behavioral prep questions. Return ONLY a valid JSON array — no markdown, no explanation.

Each question object must have:
- "question": the interview question string
- "category": one of "Background & motivation", "Execution & impact", "Failure & reflection", "Problem solving", "Leadership & influence", "Palantir-specific"
- "tip": one short sentence of coaching advice for answering this specific question`;

  const prompt = `Search the web for reported Palantir Deployment Strategist interview questions from Reddit (r/cscareerquestions, r/palantir), Glassdoor, Blind, and Leetcode discuss. Also search "Palantir DS interview experience" and "Palantir deployment strategist behavioral questions".

Context on the role: Deployment Strategists work directly with government and commercial clients to deploy Palantir's data platforms. They are analytical problem solvers who travel, embed with clients, and work across technical and business teams. The interview values: outcomes over process, self-awareness, intellectual curiosity, and mission alignment.

The candidate is Delaney Schultz — McKinsey Business Analyst background, Gates Foundation AI strategy role, CS + Cognitive Science degrees from Rice University, Division I soccer player. She has strong analytical and operational experience across complex institutional environments.

Generate 14 behavioral questions total — a mix of real reported questions from your web search and high-probability questions based on the role. Return as a JSON array only.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) return res.status(500).json({ error: "Could not generate questions." });
    res.json({ questions: JSON.parse(match[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}