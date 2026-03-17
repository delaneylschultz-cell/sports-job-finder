import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages, context, resume } = req.body;

  const system = `You are a sports industry career strategist helping a sports management master's student find and land their ideal job. You have deep knowledge of the sports industry — teams, leagues, agencies, career paths, hiring timelines, what different roles actually involve day-to-day, and how to break in.

Be direct, specific, and practical. No generic advice. Draw on the candidate's actual background when giving advice. Keep responses concise — use short paragraphs or bullet points separated by line breaks, not long walls of text. Max 3-4 short paragraphs or a brief bulleted list.

CANDIDATE CONTEXT:
${context || "Sports management master's student seeking entry-level or coordinator roles in the sports industry."}

If the user asks you to search for jobs or find specific roles, respond normally AND include a search block at the very end of your message in this exact format:
<search>{"query": "specific search query here", "filters": {"levels": [], "orgTypes": [], "functions": [], "leagues": [], "locations": []}}</search>

Only include the <search> block when the user is explicitly asking to find or search for jobs. Otherwise just respond normally as a career advisor.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const apiMessages = messages.map((m, i) => {
      if (i === 0 && m.role === "user" && resume) {
        return {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: resume.mediaType, data: resume.data }, title: "Candidate resume" },
            { type: "text", text: m.content }
          ]
        };
      }
      return { role: m.role, content: m.content };
    });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system,
      messages: apiMessages,
    });

    const text = msg.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const searchMatch = text.match(/<search>([\s\S]*?)<\/search>/);
    const cleanText = text.replace(/<search>[\s\S]*?<\/search>/, "").trim();

    let searchParams = null;
    if (searchMatch) {
      try { searchParams = JSON.parse(searchMatch[1]); } catch {}
    }

    res.json({ reply: cleanText, searchParams });
  } catch (e) {
    console.error("Chat API error:", e);
    res.status(500).json({ error: e.message });
  }
}