import { useState, useEffect, useRef } from "react";

const btn = (primary, small) => ({
  padding: small ? "4px 12px" : "8px 18px",
  borderRadius: 6, fontSize: small ? 12 : 13, cursor: "pointer",
  fontFamily: "inherit", border: primary ? "none" : "0.5px solid #d0cec4",
  background: primary ? "#1a1a1a" : "#fff", color: primary ? "#fff" : "#444",
  fontWeight: primary ? 500 : 400,
});

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "0 4px", height: "100%", fontSize: 14,
      fontWeight: active ? 500 : 400, color: active ? "#1a1a1a" : "#888",
      background: "none", border: "none",
      borderBottom: active ? "2px solid #1a1a1a" : "2px solid transparent",
      cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );
}

function FeedbackBlock({ feedback }) {
  if (!feedback) return null;
  return (
    <div style={{ marginTop: 12, background: "#f9f8f5", borderRadius: 8, padding: "14px 16px", border: "0.5px solid #e0ddd6", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#1a1a1a" }}>
      {feedback}
    </div>
  );
}

function BehavioralTab() {
  const [questions, setQuestions] = useState([]);
  const [loadingQs, setLoadingQs] = useState(false);
  const [activeQ, setActiveQ] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [loadingFeedback, setLoadingFeedback] = useState(null);

  async function generateQuestions() {
    setLoadingQs(true);
    setQuestions([]);
    setActiveQ(null);
    try {
      const r = await fetch("/api/behavioral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const d = await r.json();
      if (d.questions) setQuestions(d.questions);
    } catch {}
    setLoadingQs(false);
  }

  async function getFeedback(q, idx) {
    const answer = answers[idx];
    if (!answer?.trim()) return;
    setLoadingFeedback(idx);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer }),
      });
      const d = await r.json();
      if (d.feedback) setFeedbacks(f => ({ ...f, [idx]: d.feedback }));
    } catch {}
    setLoadingFeedback(null);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px" }}>Behavioral prep</h2>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>
          Generates real questions sourced from Palantir interview reports, Reddit, Glassdoor, and the DS role profile. Answer each one and get structured feedback.
        </p>
        <button onClick={generateQuestions} disabled={loadingQs} style={btn(true)}>
          {loadingQs ? "Searching for questions..." : questions.length ? "Regenerate questions" : "Generate questions"}
        </button>
      </div>

      {questions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.map((q, i) => (
            <div key={i} style={{ border: "0.5px solid #d0cec4", borderRadius: 10, background: "#fff", overflow: "hidden" }}>
              <button onClick={() => setActiveQ(activeQ === i ? null : i)} style={{
                width: "100%", textAlign: "left", padding: "14px 16px", background: "none",
                border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                fontWeight: 500, color: "#1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
              }}>
                <span>{q.category && <span style={{ fontSize: 11, color: "#888", fontWeight: 400, marginRight: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>[{q.category}]</span>}{q.question}</span>
                <span style={{ fontSize: 16, color: "#aaa", flexShrink: 0 }}>{activeQ === i ? "−" : "+"}</span>
              </button>

              {activeQ === i && (
                <div style={{ borderTop: "0.5px solid #e8e6e0", padding: "14px 16px" }}>
                  {q.tip && <p style={{ fontSize: 12, color: "#888", margin: "0 0 10px", fontStyle: "italic" }}>{q.tip}</p>}
                  <textarea
                    value={answers[i] || ""}
                    onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                    placeholder="Type your answer here — use STAR format (Situation, Task, Action, Result)..."
                    rows={6}
                    style={{ width: "100%", fontSize: 13, padding: 10, borderRadius: 8, border: "0.5px solid #d0cec4", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
                  />
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button onClick={() => getFeedback(q.question, i)} disabled={loadingFeedback === i || !answers[i]?.trim()} style={btn(true, true)}>
                      {loadingFeedback === i ? "Getting feedback..." : "Get feedback"}
                    </button>
                    {feedbacks[i] && (
                      <button onClick={() => setFeedbacks(f => ({ ...f, [i]: null }))} style={btn(false, true)}>Clear feedback</button>
                    )}
                  </div>
                  <FeedbackBlock feedback={feedbacks[i]} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DecompTab() {
  const [phase, setPhase] = useState("idle"); // idle | interview | done
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startInterview() {
    setPhase("interview");
    setMessages([]);
    setSolution("");
    setLoading(true);
    try {
      const r = await fetch("/api/decomp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", messages: [] }),
      });
      const d = await r.json();
      if (d.reply) {
        setMessages([{ role: "interviewer", content: d.reply }]);
        if (d.questionTitle) setQuestionTitle(d.questionTitle);
      }
    } catch {}
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/decomp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", messages: updated }),
      });
      const d = await r.json();
      if (d.reply) setMessages(m => [...m, { role: "interviewer", content: d.reply }]);
    } catch {}
    setLoading(false);
  }

  async function endInterview() {
    setLoading(true);
    try {
      const r = await fetch("/api/decomp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "solution", messages }),
      });
      const d = await r.json();
      if (d.solution) setSolution(d.solution);
    } catch {}
    setPhase("done");
    setLoading(false);
  }

  if (phase === "idle") return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px" }}>Decomp interview</h2>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 6px" }}>
        Simulates the data decomposition / analytical problem-solving exercise. The AI picks a real-style question (sourced from reported Palantir interviews), then plays interviewer — probing your thinking, asking follow-ups, and challenging assumptions.
      </p>
      <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>
        When you're done, hit "End interview" to see the full worked solution and where you could have gone deeper.
      </p>
      <button onClick={startInterview} style={btn(true)}>Start decomp interview</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 2px" }}>Decomp interview</h2>
          {questionTitle && <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{questionTitle}</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {phase === "interview" && (
            <button onClick={endInterview} disabled={loading} style={btn(false, true)}>End interview + show solution</button>
          )}
          <button onClick={() => { setPhase("idle"); setMessages([]); setSolution(""); }} style={btn(false, true)}>New question</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "11px 15px", borderRadius: 10, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap",
              background: m.role === "user" ? "#1a1a1a" : "#f0eeea",
              color: m.role === "user" ? "#fff" : "#1a1a1a",
            }}>
              {m.role === "interviewer" && <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Interviewer</div>}
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "11px 15px", borderRadius: 10, fontSize: 13, background: "#f0eeea", color: "#888" }}>Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {solution && (
        <div style={{ margin: "20px 0", background: "#eaf3de", borderRadius: 10, padding: "16px 18px", border: "0.5px solid #c0dd97" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#3b6d11", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Full solution + debrief</div>
          <div style={{ fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#1a1a1a" }}>{solution}</div>
        </div>
      )}

      {phase === "interview" && (
        <div style={{ display: "flex", gap: 8, paddingTop: 16, borderTop: "0.5px solid #e0ddd6" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Respond to the interviewer... (Shift+Enter for new line)"
            rows={3}
            disabled={loading}
            style={{ flex: 1, fontSize: 13, padding: "10px 12px", borderRadius: 8, border: "0.5px solid #d0cec4", fontFamily: "inherit", resize: "none", lineHeight: 1.6 }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ ...btn(true), alignSelf: "flex-end", padding: "10px 18px" }}>Send</button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState("behavioral");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4f0", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1a1a1a" }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid #d0cec4", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Palantir interview prep</span>
          <span style={{ fontSize: 11, color: "#888" }}>Deployment Strategist · Phone screen · March 27</span>
        </div>
        <div style={{ display: "flex", gap: 24, height: "100%", alignItems: "center" }}>
          <TabBtn label="Behavioral" active={tab === "behavioral"} onClick={() => setTab("behavioral")} />
          <TabBtn label="Decomp" active={tab === "decomp"} onClick={() => setTab("decomp")} />
        </div>
      </div>

      <div style={{ padding: "32px 32px" }}>
        {tab === "behavioral" && <BehavioralTab />}
        {tab === "decomp" && <DecompTab />}
      </div>
    </div>
  );
}