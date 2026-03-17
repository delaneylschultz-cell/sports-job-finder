import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { job, context, resume, coverLetters } = req.body;

  const system = `You are a sports industry career coach. Write sharp, specific cover letters. 3 paragraphs, under 250 words. Never start with "I am writing to apply." No filler sentences. Sound like a real person who actually wants this specific job. If a resume is provided, pull specific experience and achievements from it. If example cover letters are provided, match the candidate's tone and voice.`;

  const userContent = [];

  if (resume) userContent.push({ type: "document", source: { type: "base64", media_type: resume.mediaType, data: resume.data }, title: "Candidate resume" });
  if (coverLetters?.length) coverLetters.forEach((cl, i) => userContent.push({ type: "document", source: { type: "base64", media_type: cl.mediaType, data: cl.data }, title: `Cover letter example ${i + 1}` }));

  userContent.push({ type: "text", text: `Write a cover letter for this candidate applying to this job.

CANDIDATE CONTEXT:
${context || "Sports management master's student."}

JOB:
${job.title} at ${job.company}${job.location ? ` (${job.location})` : ""}
${job.description}

${resume ? "Pull specific experience, skills, and achievements from the resume." : ""}
${coverLetters?.length ? "Match the tone and voice of the example cover letters." : ""}

Be specific to both the candidate's background and this exact role.` });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userContent }],
    });
    const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("");
    res.json({ letter: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}