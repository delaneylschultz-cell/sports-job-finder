import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { context, filters, resume, coverLetters } = req.body;

  const filterDesc = [
    filters.levels?.length    ? `Level: ${filters.levels.join(", ")}` : "",
    filters.orgTypes?.length  ? `Org type: ${filters.orgTypes.join(", ")}` : "",
    filters.functions?.length ? `Function: ${filters.functions.join(", ")}` : "",
    filters.leagues?.length   ? `Leagues: ${filters.leagues.join(", ")}` : "",
    filters.locations?.length ? `Location: ${filters.locations.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const system = `You are a sports industry career advisor. Search for real current job postings and return ONLY a valid JSON array. No markdown, no explanation, no preamble. Each job object must have exactly these keys: title, company, location, description (2 sentences max), url (real URL if found, else ""), score (0-100 fit vs candidate), level, orgType, functionType, league.`;

  const userContent = [];

  if (resume) userContent.push({ type: "document", source: { type: "base64", media_type: resume.mediaType, data: resume.data }, title: "Candidate resume" });
  if (coverLetters?.length) coverLetters.forEach((cl, i) => userContent.push({ type: "document", source: { type: "base64", media_type: cl.mediaType, data: cl.data }, title: `Cover letter example ${i + 1}` }));

  userContent.push({ type: "text", text: `Find current sports management job postings for this candidate.

CANDIDATE CONTEXT:
${context || "Sports management master's student seeking entry-level or coordinator roles."}

FILTERS:
${filterDesc || "No filters set — show best matches across all categories."}

${resume ? "Use the uploaded resume to personalize fit scores." : ""}
${coverLetters?.length ? "Use the uploaded cover letter examples to understand the candidate's writing style and background." : ""}

Search Teamwork Online, LinkedIn, NBA/NFL/MLB/MLS/NHL careers pages, NCAA Market, and major sports org career sites. Return 8-12 jobs as a JSON array only.` });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      system,
      messages: [{ role: "user", content: userContent }],
    });

    const text = msg.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);

    if (!match) {
      console.error("Raw response:", text);
      return res.status(500).json({ error: "Could not parse job results. Try again." });
    }

    try {
      const jobs = JSON.parse(match[0]);
      res.json({ jobs });
    } catch (parseErr) {
      const partial = match[0].substring(0, match[0].lastIndexOf("}") + 1) + "]";
      try {
        res.json({ jobs: JSON.parse(partial) });
      } catch {
        console.error("Parse failed:", match[0]);
        res.status(500).json({ error: "Could not parse job results. Try again." });
      }
    }
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: e.message });
  }
}