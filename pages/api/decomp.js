import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You are a Palantir Deployment Strategist conducting a data decomposition / analytical problem-solving interview. You are playing the role of a real interviewer — direct, curious, and rigorous.

Your job is to:
1. Ask one open-ended analytical question (estimation, decomposition, or data problem-solving)
2. Let the candidate work through it out loud
3. Probe their thinking with follow-up questions — challenge assumptions, ask for specifics, push for structure
4. Never give the answer away during the interview
5. React naturally — if they go in a good direction, push deeper; if they miss something, ask a question that nudges them toward it without telling them

Palantir decomp questions are typically open-ended estimation or data structuring problems — not coding. Examples:
- "How would you measure whether a city's emergency response system is working?"
- "If you had access to all hospital data in a state, what would you look at first to reduce patient readmissions?"
- "How would you figure out which neighborhoods in a city need the most police resources?"
- "Estimate how many doses of a vaccine a country needs to distribute in the first month of a pandemic."
- "How would you help a government agency figure out which contracts are at risk of going over budget?"

Keep your interviewer responses SHORT — 1-4 sentences max. You are probing, not lecturing. Ask one question at a time.

The candidate is Delaney Schultz — strong analytical background, McKinsey, Gates Foundation AI work in global health and Africa. She is not a coder but is analytically rigorous.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { action, messages } = req.body;

  if (action === "start") {
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: SYSTEM,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Search the web for "Palantir deployment strategist decomp question" and "Palantir data problem solving interview question site:reddit.com OR site:glassdoor.com OR site:blind.com". Pick ONE real or highly realistic question inspired by what you find. Start the interview by introducing yourself briefly (1 sentence) and asking the question. Do not explain what you're looking for yet — just ask it naturally.`
        }],
      });
      const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
      const titleMatch = text.match(/(?:question|scenario|problem):\s*(.+)/i);
      res.json({ reply: text, questionTitle: titleMatch ? titleMatch[1].slice(0, 80) : "Decomp question" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (action === "respond") {
    try {
      const apiMessages = messages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: SYSTEM,
        messages: apiMessages,
      });
      const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
      res.json({ reply: text });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (action === "solution") {
    try {
      const transcript = messages.map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`).join("\n\n");
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: `You are an expert Palantir interview coach debriefing a decomp interview session.`,
        messages: [{
          role: "user",
          content: `Here is the full decomp interview transcript:\n\n${transcript}\n\nNow provide:\n\n1. **The ideal full solution** — walk through how an excellent candidate would have structured and answered this question from scratch, including all key dimensions, assumptions, and data points to consider.\n\n2. **How this candidate did** — specific strengths from their actual answers, and 2-3 concrete gaps or missed angles.\n\n3. **What Palantir is really evaluating** — what the interviewer was looking for with this specific question.\n\nBe specific and direct.`,
        }],
      });
      const solution = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
      res.json({ solution });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(400).json({ error: "Invalid action" });
}