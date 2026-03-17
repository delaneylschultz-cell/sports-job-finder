import { useState, useEffect, useRef } from "react";

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ data: r.result.split(",")[1], mediaType: file.type || "application/pdf" });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function UploadZone({ label, hint, files, onAdd, onRemove, maxFiles = 1 }) {
  const inputRef = useState(null);
  async function handleChange(e) {
    const picked = Array.from(e.target.files || []);
    for (const f of picked) {
      if (files.length >= maxFiles) break;
      const b64 = await fileToBase64(f);
      onAdd({ name: f.name, ...b64 });
    }
    e.target.value = "";
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#666" }}>{label} <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span></div>
      {files.length < maxFiles && (
        <label style={{ border: "1px dashed #c8c6bc", borderRadius: 8, padding: "10px 12px", textAlign: "center", background: "#fff", cursor: "pointer", display: "block" }}>
          <div style={{ fontSize: 12, color: "#888" }}>{hint}</div>
          <input type="file" accept=".pdf,.doc,.docx" multiple={maxFiles > 1} onChange={handleChange} style={{ display: "none" }} />
        </label>
      )}
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#eaf3de", borderRadius: 6, fontSize: 12, color: "#3b6d11" }}>
          <div style={{ width: 6, height: 6, background: "#639922", borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3b6d11", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

const STARTER_PROMPTS = [
  "What types of roles should I target with my background?",
  "What's the best way to break into the NFL front office?",
  "Operations vs marketing — which is an easier entry point?",
  "What should I add to my resume to stand out?",
  "Find me NBA coordinator roles in NYC",
];


const ORG_TYPES = ["Pro team", "College athletics", "League office", "Agency", "Venue / arena", "Media / broadcast"];
const FUNCTIONS = ["Operations", "Marketing", "Sales", "Analytics", "Communications / PR", "Sponsorship", "Athlete services", "Facilities"];
const LEAGUES   = ["NFL", "NBA", "MLB", "MLS", "NHL", "WNBA", "NCAA", "Any"];
const LOCATIONS = ["Remote ok", "NYC", "LA", "Chicago", "Boston", "Dallas", "Any US"];
const STATUSES  = ["Saved", "Applied", "Interviewing", "Offer", "Pass"];

const STATUS_STYLE = {
  Saved:       { bg: "#f0eeea", color: "#666" },
  Applied:     { bg: "#e6f1fb", color: "#185fa5" },
  Interviewing:{ bg: "#eeedfe", color: "#3c3489" },
  Offer:       { bg: "#eaf3de", color: "#3b6d11" },
  Pass:        { bg: "#fcebeb", color: "#a32d2d" },
};

function fitStyle(score) {
  if (score >= 75) return { bg: "#eaf3de", color: "#3b6d11", label: "Strong fit" };
  if (score >= 50) return { bg: "#faeeda", color: "#854f0b", label: "Decent fit" };
  return { bg: "#fcebeb", color: "#a32d2d", label: "Stretch" };
}

const btn = (primary) => ({
  padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
  fontFamily: "inherit", border: primary ? "none" : "0.5px solid #d0cec4",
  background: primary ? "#1a1a1a" : "#fff", color: primary ? "#fff" : "#444",
});

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer",
      fontFamily: "inherit",
      border: active ? "0.5px solid #afa9ec" : "0.5px solid #d0cec4",
      background: active ? "#eeedfe" : "#fff",
      color: active ? "#3c3489" : "#555",
    }}>{label}</button>
  );
}

function FilterGroup({ label, options, active, onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#666" }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {options.map(o => <Pill key={o} label={o} active={active.includes(o)} onClick={() => onToggle(o)} />)}
      </div>
    </div>
  );
}

function Tag({ label }) {
  return label ? <span style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, background: "#f0eeea", color: "#666" }}>{label}</span> : null;
}

function TabBtn({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "0 4px", height: "100%", fontSize: 13,
      fontWeight: active ? 500 : 400, color: active ? "#1a1a1a" : "#888",
      background: "none", border: "none",
      borderBottom: active ? "2px solid #1a1a1a" : "2px solid transparent",
      cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      {label}
      {count > 0 && <span style={{ fontSize: 11, background: "#f0eeea", color: "#666", padding: "1px 7px", borderRadius: 20 }}>{count}</span>}
    </button>
  );
}

function JobCard({ job, savedKey, onSave, isSaved, onDraft, coverLetter, drafting }) {
  const [showCL, setShowCL] = useState(false);
  const fs = fitStyle(job.score);

  return (
    <div style={{ border: "0.5px solid #d0cec4", borderRadius: 10, padding: "14px 16px", background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{job.company}{job.location ? ` · ${job.location}` : ""}</div>
        </div>
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: fs.bg, color: fs.color, flexShrink: 0 }}>
          {job.score}% — {fs.label}
        </span>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <Tag label={job.orgType} /><Tag label={job.functionType} /><Tag label={job.league} /><Tag label={job.level} />
      </div>

      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{job.description}</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn(true)} disabled={drafting === savedKey}
          onClick={() => { onDraft(job, savedKey); setShowCL(true); }}>
          {drafting === savedKey ? "Drafting..." : coverLetter ? "Redraft cover letter" : "Draft cover letter"}
        </button>
        {job.url
          ? <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ ...btn(false), textDecoration: "none", display: "inline-flex", alignItems: "center" }}>View posting ↗</a>
          : <button style={{ ...btn(false), opacity: 0.45, cursor: "default" }} disabled>No link found</button>
        }
        <button style={btn(false)} onClick={() => onSave(job, savedKey)}>{isSaved ? "Unsave" : "Save"}</button>
      </div>

      {coverLetter && showCL && (
        <div style={{ background: "#f9f8f5", borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.7, color: "#333", border: "0.5px solid #e0ddd6", whiteSpace: "pre-wrap" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Draft cover letter</span>
            <button style={btn(false)} onClick={() => navigator.clipboard.writeText(coverLetter)}>Copy</button>
          </div>
          {coverLetter}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [tab, setTab]               = useState("search");
  const [context, setContext]       = useState("");
  const [resumeFiles, setResumeFiles]       = useState([]);
  const [coverFiles, setCoverFiles]         = useState([]);
  const [filters, setFilters]       = useState({ levels: [], orgTypes: [], functions: [], leagues: [], locations: [] });
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [sortBy, setSortBy]         = useState("score");
  const [saved, setSaved]           = useState({});
  const [statuses, setStatuses]     = useState({});
  const [coverLetters, setCoverLetters] = useState({});
  const [drafting, setDrafting]     = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("sj_saved");
      const st = localStorage.getItem("sj_statuses");
      const ch = localStorage.getItem("sj_chat");
      if (s) setSaved(JSON.parse(s));
      if (st) setStatuses(JSON.parse(st));
      if (ch) setChatMessages(JSON.parse(ch));
    } catch {}
  }, []);

  function toggleFilter(key, val) {
    setFilters(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));
  }

  async function search(overrideQuery) {
    setLoading(true); setError(""); setJobs([]);
    try {
      const resume = resumeFiles[0] ? { data: resumeFiles[0].data, mediaType: resumeFiles[0].mediaType } : null;
      const coverLetters = coverFiles.map(f => ({ data: f.data, mediaType: f.mediaType }));
      const r = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context, filters, resume, coverLetters, overrideQuery }) });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setJobs(d.jobs || []);
    } catch (e) { setError("Search failed: " + e.message); }
    setLoading(false);
  }

  async function draftCover(job, key) {
    setDrafting(key);
    try {
      const resume = resumeFiles[0] ? { data: resumeFiles[0].data, mediaType: resumeFiles[0].mediaType } : null;
      const coverLetters = coverFiles.map(f => ({ data: f.data, mediaType: f.mediaType }));
      const r = await fetch("/api/cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job, context, resume, coverLetters }) });
      const d = await r.json();
      if (d.letter) setCoverLetters(c => ({ ...c, [key]: d.letter }));
    } catch {}
    setDrafting(null);
  }

  function toggleSave(job, key) {
    setSaved(s => {
      const next = { ...s };
      if (next[key]) delete next[key]; else next[key] = job;
      localStorage.setItem("sj_saved", JSON.stringify(next));
      return next;
    });
  }

  function setStatus(key, status) {
    setStatuses(s => {
      const next = { ...s, [key]: status };
      localStorage.setItem("sj_statuses", JSON.stringify(next));
      return next;
    });
  }

  async function sendChat(text) {
    const userMsg = { role: "user", content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    localStorage.setItem("sj_chat", JSON.stringify(newMessages));
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const resume = resumeFiles[0] ? { data: resumeFiles[0].data, mediaType: resumeFiles[0].mediaType } : null;
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context, resume }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);

      const assistantMsg = { role: "assistant", content: d.reply };
      const updated = [...newMessages, assistantMsg];
      setChatMessages(updated);
      localStorage.setItem("sj_chat", JSON.stringify(updated));

      if (d.searchParams) {
        if (d.searchParams.filters) setFilters(f => ({ ...f, ...d.searchParams.filters }));
        setTab("search");
        await search(d.searchParams.query);
      }
    } catch (e) {
      const errMsg = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
      const updated = [...newMessages, errMsg];
      setChatMessages(updated);
      localStorage.setItem("sj_chat", JSON.stringify(updated));
    }
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const sorted = [...jobs].sort((a, b) => sortBy === "score" ? b.score - a.score : (a.orgType || "").localeCompare(b.orgType || ""));
  const savedList = Object.entries(saved);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", background: "#f5f4f0", color: "#1a1a1a", fontSize: 14 }}>

      {/* Sidebar */}
      <div style={{ width: 275, background: "#f9f8f5", borderRight: "0.5px solid #d0cec4", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Sports job finder</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>AI-powered search + cover letters</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your context</div>
          <textarea value={context} onChange={e => setContext(e.target.value)}
            placeholder="Tell the AI about yourself — degree, school, experience, dream orgs, preferred cities, salary range, anything to avoid..."
            rows={4} style={{ width: "100%", fontSize: 12, padding: 10, borderRadius: 8, border: "0.5px solid #d0cec4", background: "#fff", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, color: "#333", boxSizing: "border-box" }} />
          <UploadZone label="Resume" hint="Click to upload PDF or Word doc"
            files={resumeFiles} onAdd={f => setResumeFiles([f])} onRemove={() => setResumeFiles([])} maxFiles={1} />
          <UploadZone label="Cover letter examples" hint="Click to upload up to 3 samples"
            files={coverFiles} onAdd={f => setCoverFiles(c => [...c, f])} onRemove={i => setCoverFiles(c => c.filter((_, j) => j !== i))} maxFiles={3} />
        </div>

        <div style={{ height: "0.5px", background: "#e0ddd6" }} />

        <FilterGroup label="Level"        options={LEVELS}    active={filters.levels}    onToggle={v => toggleFilter("levels", v)} />
        <FilterGroup label="Org type"     options={ORG_TYPES} active={filters.orgTypes}  onToggle={v => toggleFilter("orgTypes", v)} />
        <FilterGroup label="Function"     options={FUNCTIONS} active={filters.functions} onToggle={v => toggleFilter("functions", v)} />
        <FilterGroup label="League / sport" options={LEAGUES} active={filters.leagues}   onToggle={v => toggleFilter("leagues", v)} />
        <FilterGroup label="Location"     options={LOCATIONS} active={filters.locations} onToggle={v => toggleFilter("locations", v)} />

        <button onClick={search} disabled={loading} style={{ padding: 10, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: loading ? "default" : "pointer", fontFamily: "inherit", marginTop: 4 }}>
          {loading ? "Searching..." : "Find jobs"}
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ borderBottom: "0.5px solid #d0cec4", background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 52, flexShrink: 0 }}>
          <TabBtn label="Results"  count={jobs.length}      active={tab === "search"} onClick={() => setTab("search")} />
          <TabBtn label="Saved"    count={savedList.length} active={tab === "saved"}  onClick={() => setTab("saved")} />
          <TabBtn label="Strategy" count={chatMessages.filter(m => m.role === "user").length} active={tab === "chat"} onClick={() => setTab("chat")} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* Search tab */}
          {tab === "search" && (
            <>
              {loading && <div style={{ textAlign: "center", padding: "4rem 0", color: "#888" }}>Searching job boards and league career pages...</div>}
              {error && <div style={{ background: "#fcebeb", border: "0.5px solid #f09595", borderRadius: 8, padding: 12, fontSize: 13, color: "#a32d2d", marginBottom: 16 }}>{error}</div>}
              {!loading && jobs.length > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: "#888" }}>{jobs.length} jobs found</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#888" }}>Sort:</span>
                      {[["score", "Best fit"], ["org", "Org type"]].map(([v, l]) => (
                        <button key={v} onClick={() => setSortBy(v)} style={{ ...btn(sortBy === v), padding: "4px 10px" }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {sorted.map((job, i) => {
                      const key = job.title + "|" + job.company;
                      return <JobCard key={i} job={job} savedKey={key} onSave={toggleSave} isSaved={!!saved[key]} onDraft={draftCover} coverLetter={coverLetters[key]} drafting={drafting} />;
                    })}
                  </div>
                </>
              )}
              {!loading && jobs.length === 0 && !error && (
                <div style={{ textAlign: "center", padding: "5rem 0", color: "#888" }}>
                  <div style={{ fontSize: 15, color: "#555", marginBottom: 8 }}>Add your context and hit Find jobs</div>
                  <div style={{ fontSize: 13 }}>The more detail you add, the better the results</div>
                </div>
              )}
            </>
          )}

          {/* Saved tab */}
          {tab === "saved" && (
            <div>
              {savedList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "5rem 0", color: "#888", fontSize: 13 }}>No saved jobs yet — save jobs from search results to track them here.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {savedList.map(([key, job]) => {
                    const status = statuses[key] || "Saved";
                    const sc = STATUS_STYLE[status];
                    return (
                      <div key={key} style={{ border: "0.5px solid #d0cec4", borderRadius: 10, padding: "14px 16px", background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{job.title}</div>
                            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{job.company}{job.location ? ` · ${job.location}` : ""}</div>
                          </div>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: sc.bg, color: sc.color, flexShrink: 0 }}>{status}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {STATUSES.map(s => (
                            <button key={s} onClick={() => setStatus(key, s)} style={{
                              padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                              border: status === s ? "0.5px solid #afa9ec" : "0.5px solid #d0cec4",
                              background: status === s ? "#eeedfe" : "#fff",
                              color: status === s ? "#3c3489" : "#666",
                            }}>{s}</button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ ...btn(false), textDecoration: "none", display: "inline-flex", alignItems: "center", fontSize: 12 }}>View posting ↗</a>}
                          <button style={btn(false)} onClick={() => toggleSave(job, key)}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Strategy / chat tab */}
          {tab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {chatMessages.length === 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Ask anything about your job search strategy, or try one of these:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {STARTER_PROMPTS.map((p, i) => (
                      <button key={i} onClick={() => sendChat(p)} style={{ ...btn(false), textAlign: "left", padding: "8px 12px", fontSize: 13 }}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "80%", padding: "10px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.7,
                      background: m.role === "user" ? "#1a1a1a" : "#f0eeea",
                      color: m.role === "user" ? "#fff" : "#1a1a1a",
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#f0eeea", color: "#888" }}>Thinking...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 16, borderTop: "0.5px solid #e0ddd6" }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && chatInput.trim() && sendChat(chatInput.trim())}
                  placeholder="Ask about strategy, roles, or say 'find me NBA ops roles in NYC'..."
                  style={{ flex: 1, fontSize: 13, padding: "8px 12px" }}
                  disabled={chatLoading}
                />
                <button onClick={() => chatInput.trim() && sendChat(chatInput.trim())} disabled={chatLoading || !chatInput.trim()} style={{ ...btn(true), padding: "8px 16px", fontSize: 13 }}>Send</button>
                {chatMessages.length > 0 && (
                  <button onClick={() => { setChatMessages([]); localStorage.removeItem("sj_chat"); }} style={{ ...btn(false), fontSize: 13 }}>Clear</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}