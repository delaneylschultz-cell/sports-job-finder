import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const system = `You are an expert Palantir interview coach. Search the web for real reported Palantir Deployment Strategist behavioral interview questions, then generate highly specific personalized questions for this exact candidate. Return ONLY a valid JSON array — no markdown, no explanation, no backticks.

Each object must have exactly:
- "question": the interview question
- "category": one of "Background & motivation", "Execution & impact", "Failure & reflection", "Data & problem solving", "Leadership & influence", "Palantir-specific", "Curveball"
- "tip": one sharp coaching note on how THIS candidate should answer given her specific background`;

  const prompt = `First search the web for:
1. "Palantir deployment strategist behavioral interview questions site:reddit.com"
2. "Palantir DS interview experience site:glassdoor.com"
3. "Palantir echo interview questions site:teamblind.com"
4. "interviewing at Palantir advice site:medium.com OR site:blog.palantir.com"

Use those real reported questions plus this candidate's background to generate exactly 15 questions split into 3 tiers:

CANDIDATE BACKGROUND:
- McKinsey Business Analyst, energy sector. Bangalore capability center was an anchor project — cross-cultural, high-stakes analytical work for senior clients.
- Gates Foundation Strategy Officer on secondment — leading Africa AI Scaling Hubs across Rwanda, Nigeria, Senegal, Kenya. Building real AI deployment infrastructure in low-resource, complex institutional environments.
- Internal workstream: Instant Health Intelligence (IHI) — one of three "big bets" in the 2026 AI Core Team portfolio. Coordinating across Shreya, Anne, Erin, Sarah, Scott.
- Built an AI Grant Management Playbook as a Next.js web app with OpenAI chatbot for program officers — demoed to stakeholders using Rwanda clinical decision-making scenario.
- Built hubs-tracker dashboard (Next.js, TypeScript, Tailwind, Supabase) for cross-hub use case tracking.
- Developed AI-readiness framework for delivery partners: PATH, CHAI, eHA, UNICEF.
- Facilitated sessions at India AI Impact Summit in Delhi. Key insight: AI deployment challenges are institutional, not technical.
- Cross-Hub Workshop concept note for April 2026 Kenya convening — first time all four hubs convene together.
- CS + Cognitive Science (neuroscience) from Rice University. D1 soccer — Conference USA Player of the Year, Scholar All-American.
- Secondment ends July 1

TIER 1 — Specific to her background (6 questions):
Reference her actual projects and experiences by name. Should feel like the interviewer read her resume carefully. Cover her McKinsey work, Gates Foundation build, data work, and her career arc.
Example tone: "You built the AI Scaling Hubs across four countries with totally different institutional contexts — walk me through a moment where your approach completely didn't work and what you did."

TIER 2 — Classic STAR situational questions (6 questions):
"Tell me about a time..." format, but pointed toward DS-relevant situations. Must cover: a failure or mistake, a stakeholder who pushed back hard, working with imperfect or incomplete data, persuading someone who disagreed, doing something outside your comfort zone, and a time you changed your mind mid-project.
Example tone: "Tell me about a time you had to make a recommendation with data you didn't fully trust — how did you handle the uncertainty?"

TIER 3 — Curveball / Palantir-specific (3 questions):
Should catch her off guard if she hasn't prepared. Include: one about Palantir's controversial government contracts (ICE, military, surveillance), one about travel and lifestyle fit, one that probes a genuine weakness.
Example tone: "Palantir works with ICE, the military, and surveillance programs that have drawn significant criticism. How do you think about that personally?"

Return all 15 as a raw JSON array only.`;

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
    if (!match) return res.status(500).json({ error: "Could not generate questions. Try again." });
    res.json({ questions: JSON.parse(match[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}