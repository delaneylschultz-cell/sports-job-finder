import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { context, filters, resume, coverLetters, overrideQuery } = req.body;

  const today = new Date().toISOString().split("T")[0];

  const filterDesc = [
    filters.levels?.length    ? `Level: ${filters.levels.join(", ")}` : "",
    filters.orgTypes?.length  ? `Org type: ${filters.orgTypes.join(", ")}` : "",
    filters.functions?.length ? `Function: ${filters.functions.join(", ")}` : "",
    filters.leagues?.length   ? `Leagues: ${filters.leagues.join(", ")}` : "",
    filters.locations?.length ? `Location: ${filters.locations.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const searchQuery = overrideQuery ||
    [
      filters.leagues?.length   ? filters.leagues.join(" OR ") : "sports",
      filters.functions?.length ? filters.functions.join(" OR ") : "",
      filters.levels?.length    ? filters.levels[0] : "entry level",
      filters.locations?.length ? filters.locations.join(" OR ") : "",
    ].filter(Boolean).join(" ");

  const system = `You are a job search assistant. Today's date is ${today}. Your only job is to search the web for real, currently open job postings and return them as JSON.

ABSOLUTE RULES — breaking any of these is a complete failure:
1. ONLY return jobs you found via web search in this session. Every single listing must come from an actual URL you retrieved.
2. NEVER fabricate, invent, hallucinate, or guess any job listing or any field within a listing.
3. NEVER return a job that was posted more than 60 days ago. Only active, open postings as of ${today}.
4. For the "url" field: use the EXACT url from your search result where the job appears. If you do not have a confirmed working url, use "".
5. For the "source" field: name the website you found it on (e.g. "Teamwork Online", "LinkedIn", "NBA Careers", "MLS Jobs").
6. For the "postedDate" field: include the date posted if visible, otherwise "".
7. Return ONLY a raw JSON array. No markdown, no backticks, no explanation, no HTML, no citation tags.
8. If you can only find 2 real jobs, return 2. Never pad results with fake listings.

JSON format — each object must have exactly these keys:
{"title":"","company":"","location":"","description":"2 plain sentences from the actual posting text","url":"","source":"","postedDate":"","score":0,"level":"","orgType":"","functionType":"","league":""}`;

  const promptText = `Today is ${today}. Search for REAL, CURRENTLY OPEN sports job postings using these searches:

1. Search: "${searchQuery} jobs ${today.slice(0,7)}" on teamworkonline.com
2. Search: "${searchQuery} jobs" on linkedin.com/jobs  
3. Search: "${searchQuery} careers" on official league/team websites
4. Search: "sports management ${searchQuery} job posting ${today.slice(0,4)}"

FILTERS — only return jobs that match ALL of these. This is mandatory:
${filterDesc || "No filters — return best matches across all sports."}

CANDIDATE CONTEXT (for scoring fit only, 0-100):
${context || "Sports management master's student, entry-level."}

After running all searches, return ONLY the jobs you confirmed exist in a search result. Include the exact source URL and website name for each. Strip all HTML and citation markup from descriptions.

If filters are set, do not return jobs outside those filters under any circumstances.`;

  const userContent = [];
  if (resume) userContent.push({ type: "document", source: { type: "base64", media_type: resume.mediaType, data: resume.data }, title: "Candidate resume" });
  if (coverLetters?.length) coverLetters.forEach((cl, i) => userContent.push({ type: "document", source: { type: "base64", media_type: cl.mediaType, data: cl.data }, title: `Cover letter example ${i + 1}` }));
  userContent.push({ type: "text", text: promptText });

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
      console.error("No JSON array found:", text);
      return res.status(500).json({ error: "No real job postings found. Try broader filters or a different search." });
    }

    try {
      const raw = JSON.parse(match[0]);
      const jobs = raw.map(job => ({
        ...job,
        description: (job.description || "").replace(/<\/?[^>]+(>|$)/g, "").trim(),
        url: job.url && job.url.startsWith("http")
          ? job.url
          : `https://www.google.com/search?q=${encodeURIComponent((job.title || "") + " " + (job.company || "") + " job opening")}`,
      }));
      return res.json({ jobs });
    } catch {
      const partial = match[0].substring(0, match[0].lastIndexOf("}") + 1) + "]";
      try {
        return res.json({ jobs: JSON.parse(partial) });
      } catch {
        return res.status(500).json({ error: "Could not parse job results. Try again." });
      }
    }
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: e.message });
  }
}