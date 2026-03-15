import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

/* ═══════════════════════════════════════════════
   OPSLY LANDING PAGE — Exact replica of the
   static HTML design, converted to React.
═══════════════════════════════════════════════ */

// ─── Toast system ───
interface Toast {
  id: number;
  icon: string;
  title: string;
  sub: string;
  color: string;
  state: 'show' | 'hide';
}

let toastId = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((icon: string, title: string, sub: string, type: string) => {
    const colors: Record<string, string> = { green: '#0ea96e', blue: '#3b6ef5', red: '#dc2626', orange: '#f47316' };
    const color = colors[type] || '#3b6ef5';
    const id = ++toastId;
    setToasts(prev => [...prev, { id, icon, title, sub, color, state: 'show' }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, state: 'hide' } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 430);
    }, 3600);
  }, []);

  return { toasts, addToast };
}

// ─── Scroll reveal hook ───
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.1 }
    );
    el.querySelectorAll('.reveal').forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ─── Dashboard ticker data ───
const tickData = [
  { p: 'Urgent', cls: 'b-urg', d: 'Unit 9D \u2014 No hot water since morning' },
  { p: 'High', cls: 'b-hi', d: 'Unit 1F \u2014 Dishwasher leaking from base' },
  { p: 'Medium', cls: 'b-med', d: 'Unit 3B \u2014 HVAC making loud noise' },
];

// ─── Flow detail data ───
const flowDetails = [
  {
    icon: '\uD83C\uDFA4', // microphone
    title: 'Tenant Speaks \u2014 Voice Capture',
    text: 'Tenants dial in or tap the OPSLY app and describe their issue naturally. Gemini Live streams the audio in real time, producing a live transcript. No apps to install, no forms to fill \u2014 just speech.',
    chips: ['Gemini Live API', 'WebRTC Audio', 'Real-time Transcription', '<1s latency'],
  },
  {
    icon: '\uD83E\uDD16', // robot
    title: 'AI Triages \u2014 Classification & Scoring',
    text: 'The transcript is passed to Gemini + Google ADK. The model classifies issue type, scores severity (optionally using a photo via Vision API), assigns priority, and auto-generates a structured work order \u2014 no human needed.',
    chips: ['Gemini Vision', 'Issue Classification', 'Severity Score', 'Auto Work Order'],
  },
  {
    icon: '\uD83D\uDD27', // wrench
    title: 'Tech Fixes \u2014 Dispatch & Resolution',
    text: 'The best-fit technician is matched and notified instantly. On arrival, they receive a hands-free voice briefing from OPSLY. The manager dashboard streams live status updates until the job is marked complete.',
    chips: ['Tech Matching', 'Voice Briefing', 'Live Dashboard', 'SLA Tracking'],
  },
];

export default function LandingPage() {
  const { toasts, addToast } = useToasts();
  const revealRef = useReveal();

  // Nav scroll state
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Welcome toast
  useEffect(() => {
    const timer = setTimeout(() => addToast('\uD83D\uDE80', 'OPSLY is live', 'AI triage running autonomously', 'green'), 1800);
    return () => clearTimeout(timer);
  }, [addToast]);

  // Dashboard ticker
  const [dashRows, setDashRows] = useState([
    { id: 'WO-0012', p: 'Urgent', cls: 'b-urg', desc: 'Water leak in bathroom ceiling, steady drip', status: 's-esc', statusText: 'Escalated', sla: 'SLA Breached', slaColor: 'var(--red)' },
    { id: 'WO-2842', p: 'High', cls: 'b-hi', desc: 'Refrigerator making unusual grinding noise', status: 's-esc', statusText: 'Escalated', sla: 'SLA Breached', slaColor: 'var(--red)' },
    { id: 'WO-2841', p: 'Medium', cls: 'b-med', desc: 'Living room ceiling light flickers constantly', status: 's-prog', statusText: 'In Progress', sla: '15h 51m', slaColor: 'var(--ink3)' },
    { id: 'WO-2845', p: 'Urgent', cls: 'b-urg', desc: 'Front door lock mechanism is jammed', status: 's-done', statusText: 'Completed', sla: 'SLA Breached', slaColor: 'var(--red)' },
  ]);
  const [openCount, setOpenCount] = useState(14);
  const tickIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const x = tickData[tickIdx.current % tickData.length];
      tickIdx.current++;
      const st = x.p === 'Urgent' || x.p === 'High' ? 's-esc' : 's-prog';
      const stl = x.p === 'Urgent' || x.p === 'High' ? 'Escalated' : 'In Progress';
      const newRow = {
        id: `WO-${2851 + tickIdx.current}`,
        p: x.p, cls: x.cls, desc: x.d,
        status: st, statusText: stl,
        sla: 'just now', slaColor: 'var(--red)',
      };
      setDashRows(prev => [newRow, ...prev.slice(0, 3)]);
      setOpenCount(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Tabs ───
  const [activeTab, setActiveTab] = useState(0);

  // ─── Flow state ───
  const [flowStep, setFlowStep] = useState(-1);
  const [flowPlaying, setFlowPlaying] = useState(false);
  const flowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowStageRef = useRef<HTMLDivElement>(null);
  const flowAnimRef = useRef<number>(0);

  const getNodeCentres = useCallback(() => {
    const stage = flowStageRef.current;
    if (!stage) return [];
    const sr = stage.getBoundingClientRect();
    const nodes = stage.querySelectorAll('.fnode');
    return Array.from(nodes).map(n => {
      const r = n.getBoundingClientRect();
      return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
    });
  }, []);

  const drawLines = useCallback((ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], active: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const f = pts[i], t = pts[i + 1];
      const cpx = (f.x + t.x) / 2, cpy = Math.min(f.y, t.y) - 26;
      const g = ctx.createLinearGradient(f.x, f.y, t.x, t.y);
      if (i < active) {
        g.addColorStop(0, 'rgba(14,169,110,.75)'); g.addColorStop(1, 'rgba(14,169,110,.75)');
      } else if (i === active) {
        g.addColorStop(0, 'rgba(59,110,245,.90)'); g.addColorStop(1, 'rgba(124,58,237,.50)');
      } else {
        g.addColorStop(0, 'rgba(59,110,245,.14)'); g.addColorStop(1, 'rgba(59,110,245,.14)');
      }
      ctx.beginPath(); ctx.strokeStyle = g;
      ctx.lineWidth = i < active ? 2.5 : i === active ? 2.2 : 1.5;
      ctx.setLineDash(i >= active ? [6, 6] : []);
      ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(cpx, cpy, t.x, t.y);
      ctx.stroke(); ctx.setLineDash([]);
    }
  }, []);

  const drawCanvas = useCallback((active: number) => {
    const cv = canvasRef.current;
    const st = flowStageRef.current;
    if (!cv || !st) return;
    cv.width = st.offsetWidth; cv.height = st.offsetHeight;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const pts = getNodeCentres();
    drawLines(ctx, pts, active);

    // Animated dot
    if (active >= 0 && active < pts.length - 1) {
      cancelAnimationFrame(flowAnimRef.current);
      let t = 0;
      const frame = () => {
        t = (t + 1) % 60;
        const p = t / 60;
        const f = pts[active], to = pts[active + 1];
        if (!to) return;
        const cpx = (f.x + to.x) / 2, cpy = Math.min(f.y, to.y) - 26;
        const bx = (1 - p) * (1 - p) * f.x + 2 * (1 - p) * p * cpx + p * p * to.x;
        const by = (1 - p) * (1 - p) * f.y + 2 * (1 - p) * p * cpy + p * p * to.y;
        cv.width = st.offsetWidth; cv.height = st.offsetHeight;
        const ctx2 = cv.getContext('2d');
        if (!ctx2) return;
        ctx2.clearRect(0, 0, cv.width, cv.height);
        drawLines(ctx2, getNodeCentres(), active);
        ctx2.beginPath(); ctx2.arc(bx, by, 9, 0, Math.PI * 2); ctx2.fillStyle = 'rgba(59,110,245,0.15)'; ctx2.fill();
        ctx2.beginPath(); ctx2.arc(bx, by, 5, 0, Math.PI * 2); ctx2.fillStyle = 'rgba(59,110,245,0.95)'; ctx2.fill();
        flowAnimRef.current = requestAnimationFrame(frame);
      };
      frame();
    }
  }, [getNodeCentres, drawLines]);

  const emitParticles = useCallback((ni: number) => {
    const ring = document.getElementById(`fr${ni}`);
    const stage = flowStageRef.current;
    if (!ring || !stage) return;
    const rr = ring.getBoundingClientRect();
    const wr = stage.getBoundingClientRect();
    const cols = ['#3b6ef5', '#7c3aed', '#0ea96e', '#f47316', 'rgba(59,110,245,.6)'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const a = Math.random() * Math.PI * 2, dist = 38 + Math.random() * 52;
      p.style.setProperty('--tx', Math.cos(a) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(a) * dist + 'px');
      p.style.setProperty('--d', (0.7 + Math.random() * .9) + 's');
      p.style.left = (rr.left - wr.left + rr.width / 2) + 'px';
      p.style.top = (rr.top - wr.top + rr.height / 2) + 'px';
      p.style.background = cols[Math.floor(Math.random() * cols.length)];
      stage.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
  }, []);

  const setStep = useCallback((idx: number) => {
    setFlowStep(idx);
    emitParticles(idx);
    setTimeout(() => drawCanvas(idx), 50);
  }, [emitParticles, drawCanvas]);

  const resetFlow = useCallback((clearCanvas = true) => {
    if (flowTimerRef.current) clearTimeout(flowTimerRef.current);
    cancelAnimationFrame(flowAnimRef.current);
    setFlowPlaying(false);
    setFlowStep(-1);
    if (clearCanvas) {
      const cv = canvasRef.current;
      if (cv) { const ctx = cv.getContext('2d'); ctx?.clearRect(0, 0, cv.width, cv.height); }
    }
  }, []);

  const playFlow = useCallback(() => {
    if (flowPlaying) return;
    setFlowPlaying(true);
    resetFlow(false);
    let step = 0;
    const next = () => {
      if (step > 2) {
        setFlowPlaying(false);
        addToast('\u2705', 'Pipeline Complete', 'All 3 stages processed \u2014 ticket resolved', 'green');
        return;
      }
      setStep(step++);
      flowTimerRef.current = setTimeout(next, 2800);
    };
    next();
  }, [flowPlaying, resetFlow, setStep, addToast]);

  const activateNode = useCallback((idx: number) => {
    if (flowPlaying) return;
    if (flowStep === idx) { resetFlow(); return; }
    setStep(idx);
  }, [flowPlaying, flowStep, resetFlow, setStep]);

  // ─── Voice demo ───
  const [voiceRunning, setVoiceRunning] = useState(false);
  const [voiceText, setVoiceText] = useState('Listening\u2026');
  const [voiceTyping, setVoiceTyping] = useState(false);
  const [voiceBubbles, setVoiceBubbles] = useState<string[]>([]);
  const [woLit, setWoLit] = useState(false);
  const [progWidth, setProgWidth] = useState('0');
  const [woFields, setWoFields] = useState({ issue: '\u2014', unit: '\u2014', priority: '\u2014', status: '\u2014', assigned: '\u2014' });

  const runVoice = useCallback(() => {
    if (voiceRunning) return;
    setVoiceRunning(true);
    setVoiceBubbles([]);
    setWoLit(false);
    setProgWidth('0');
    setWoFields({ issue: '\u2014', unit: '\u2014', priority: '\u2014', status: '\u2014', assigned: '\u2014' });

    const msg = "Hi, it's Sarah from unit 4B. There's water leaking under my kitchen sink \u2014 it's been dripping for about an hour and getting on the floor.";
    let i = 0;
    setVoiceText('');
    setVoiceTyping(true);
    const ty = setInterval(() => {
      setVoiceText(prev => prev + msg[i]);
      i++;
      if (i >= msg.length) {
        clearInterval(ty);
        setVoiceTyping(false);
        setTimeout(() => proc(), 500);
      }
    }, 34);

    function proc() {
      setWoLit(true);
      setProgWidth('25%');
      setVoiceBubbles(prev => [...prev, 'Classifying issue from voice input\u2026']);
      setTimeout(() => {
        setProgWidth('55%');
        setVoiceBubbles(prev => [...prev, 'Water Leak detected \u2014 High priority']);
      }, 1200);
      setTimeout(() => {
        setProgWidth('85%');
        setWoFields({ issue: 'Water Leak', unit: 'Unit 4B', priority: '\uD83D\uDD34 HIGH', status: '\u2705 Created', assigned: 'Mike T. (Plumbing)' });
      }, 2200);
      setTimeout(() => {
        setProgWidth('100%');
        setVoiceBubbles(prev => [...prev, 'Work order #WO-2851 created. Mike notified \u2014 ETA 2 hours.']);
        addToast('\uD83D\uDD27', 'Work Order Created', '#WO-2851 \u00B7 Unit 4B Water Leak', 'green');
        setVoiceRunning(false);
      }, 3000);
    }
  }, [voiceRunning, addToast]);

  // ─── Vision demo ───
  const [visionRunning, setVisionRunning] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [visionIdle, setVisionIdle] = useState('Click image to run analysis\u2026');
  const [visionDone, setVisionDone] = useState(false);
  const [sevWidth, setSevWidth] = useState('0');

  const runVision = useCallback(() => {
    if (visionRunning) return;
    setVisionRunning(true);
    setVisionIdle('Analyzing with Gemini Vision\u2026');
    setScanActive(true);
    setVisionDone(false);
    setTimeout(() => {
      setScanActive(false);
      setVisionIdle('');
      setVisionDone(true);
      setSevWidth('0');
      setTimeout(() => setSevWidth('82%'), 80);
      addToast('\uD83D\uDC41\uFE0F', 'Vision Analysis Done', 'Severity HIGH \u00B7 Urgent dispatch recommended', 'red');
      setVisionRunning(false);
    }, 2400);
  }, [visionRunning, addToast]);

  // ─── Workflow demo ───
  const [wfRunning, setWfRunning] = useState(false);
  const [wfSteps, setWfSteps] = useState<('idle' | 'active' | 'done')[]>(Array(7).fill('idle'));

  const runWF = useCallback(() => {
    if (wfRunning) return;
    setWfRunning(true);
    setWfSteps(Array(7).fill('idle'));
    let i = 0;
    const next = () => {
      if (i > 0) {
        setWfSteps(prev => { const n = [...prev]; n[i - 1] = 'done'; return n; });
      }
      if (i < 7) {
        setWfSteps(prev => { const n = [...prev]; n[i] = 'active'; return n; });
        i++;
        setTimeout(next, 1300);
      } else {
        addToast('\u2705', 'Workflow Complete', 'All 7 steps processed in 9.1s', 'green');
        setWfRunning(false);
      }
    };
    next();
  }, [wfRunning, addToast]);

  // Derive flow node classes
  const getNodeClass = (idx: number) => {
    if (idx < flowStep) return 'fnode done';
    if (idx === flowStep) return 'fnode active';
    return 'fnode';
  };
  const getTrailDotClass = (idx: number) => {
    if (idx < flowStep) return 'trail-dot done';
    if (idx === flowStep) return 'trail-dot active';
    return 'trail-dot';
  };
  const getTrailLineClass = (idx: number) => {
    if (idx < flowStep) return 'trail-line done';
    if (idx === flowStep) return 'trail-line active';
    return 'trail-line';
  };

  return (
    <div className="landing-page" ref={revealRef}>
      {/* BG LAYERS */}
      <div className="bg-photo" />
      <div className="bg-wash" />
      <div className="bg-orbs">
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
        <div className="orb o4" />
      </div>

      {/* TOASTS */}
      <div className="lp-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`lp-toast ${t.state}`}>
            <div className="t-icon" style={{ background: `${t.color}18`, color: t.color }}>{t.icon}</div>
            <div>
              <div className="t-title">{t.title}</div>
              <div className="t-sub">{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* NAV */}
      <nav className={`lp-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="logo">OPSLY</div>
        <div className="nav-r">
          <Link to="/login" className="btn-solid">Sign In</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="hero-badge"><span className="ldot" /> Live &middot; AI Property Management</div>
        <h1><span className="grad">AI-Powered</span><br />Property Management</h1>
        <p className="hero-sub">Voice-first. Real-time. Autonomous.<br />Tenants speak, AI triages, technicians fix &mdash; no friction, no missed issues.</p>
        <div className="hero-ctas">
          <button className="cta-pri" onClick={() => addToast('\uD83C\uDFA4', 'Tenant Portal', 'Voice reporting ready', 'green')}>Report an Issue</button>
          <button className="cta-sec" onClick={() => addToast('\uD83D\uDCCA', 'Manager Login', 'Redirecting to dashboard\u2026', 'blue')}>Manager Login</button>
        </div>

        {/* Dashboard mockup */}
        <div className="dash-wrap">
          <div className="dash-card">
            <div className="win-bar">
              <div className="dot dr" /><div className="dot dy" /><div className="dot dg" />
              <div className="win-lbl">Manager Dashboard&nbsp;<span className="live-pill">Live</span></div>
            </div>
            <div className="dash-body">
              <div className="kpi">
                <div className="kpi-lbl">Open Tickets</div>
                <div className="kpi-val" style={{ color: 'var(--orange)' }}>{openCount}</div>
                <div className="kpi-sub"><span className="up">&uarr; 2</span> new this hour</div>
              </div>
              <div className="kpi">
                <div className="kpi-lbl">Resolved Today</div>
                <div className="kpi-val" style={{ color: 'var(--green)' }}>31</div>
                <div className="kpi-sub"><span className="up">&uarr; 18%</span> vs yesterday</div>
              </div>
              <div className="kpi">
                <div className="kpi-lbl">AI Triage Rate</div>
                <div className="kpi-val" style={{ color: 'var(--blue)' }}>98%</div>
                <div className="kpi-sub"><span className="up">Fully autonomous</span></div>
              </div>
              <div className="dash-table">
                <div className="t-head"><span>Work Orders</span><span style={{ fontWeight: 400, color: 'var(--ink4)' }}>12 results</span></div>
                <div>
                  {dashRows.map((row, i) => (
                    <div className="t-row" key={`${row.id}-${i}`}>
                      <span className="wo-id">{row.id}</span>
                      <span className={`badge ${row.cls}`}>{row.p}</span>
                      <span className="wo-desc">{row.desc}</span>
                      <span className={row.status}>{row.statusText}</span>
                      <span className="wo-sla" style={{ color: row.slaColor }}>{row.sla}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar reveal">
        <div className="stat-cell"><div className="stat-num">98%</div><div className="stat-lbl">AI triage accuracy</div></div>
        <div className="stat-cell"><div className="stat-num">&lt;2m</div><div className="stat-lbl">Avg ticket creation</div></div>
        <div className="stat-cell"><div className="stat-num">24/7</div><div className="stat-lbl">Autonomous availability</div></div>
        <div className="stat-cell"><div className="stat-num">0</div><div className="stat-lbl">Manual dispatches needed</div></div>
      </div>

      {/* FEATURES */}
      <section className="lp-features">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Core Capabilities</div>
            <h2 className="section-title">Built for the future<br />of property ops</h2>
            <p className="section-sub">Three AI systems working in sync so no maintenance issue ever slips through.</p>
          </div>
          <div className="feat-grid">
            <div className="feat-card reveal d1">
              <div className="feat-icon">{'\uD83C\uDFA4'}</div>
              <div className="feat-name">Voice First</div>
              <div className="feat-desc">Tenants describe issues naturally &mdash; no forms, no apps. Gemini Live transcribes, classifies, and creates a work order in under 2 minutes.</div>
              <span className="feat-tech">&rarr; Gemini Live API</span>
            </div>
            <div className="feat-card reveal d2">
              <div className="feat-icon">{'\uD83D\uDC41\uFE0F'}</div>
              <div className="feat-name">Vision AI</div>
              <div className="feat-desc">Upload a photo of damage. Vision model scores severity, identifies issue type, and flags the right priority before any human reads it.</div>
              <span className="feat-tech">&rarr; Gemini Vision API</span>
            </div>
            <div className="feat-card reveal d3">
              <div className="feat-icon">{'\u26A1'}</div>
              <div className="feat-name">Real-time Ops</div>
              <div className="feat-desc">Live dashboard with streaming updates. Technicians get hands-free voice briefings. Managers see the full picture &mdash; no email chains.</div>
              <span className="feat-tech">&rarr; Google ADK + Cloud Run</span>
            </div>
          </div>
        </div>
      </section>

      {/* ANIMATED FLOW */}
      <section className="lp-flow">
        <div className="wrap">
          <div className="flow-head reveal">
            <div className="eyebrow">How It Works</div>
            <h2 className="section-title">&ldquo;Tenants speak, <span className="grad">AI triages,</span> techs fix.&rdquo;</h2>
            <p className="section-sub">Click any step to explore, or hit Play to watch the full pipeline run live.</p>
          </div>
          <div className="flow-stage reveal" ref={flowStageRef}>
            <canvas className="flow-canvas" ref={canvasRef} />
            <div className="flow-nodes">
              {[
                { emoji: '\uD83C\uDFA4', title: 'Tenant Speaks', desc: 'Tenant calls or opens the app and describes the issue naturally by voice \u2014 no typing, no forms.', tag: 'Gemini Live' },
                { emoji: '\uD83E\uDD16', title: 'AI Triages', desc: 'Voice is transcribed, classified by issue type, severity scored, and a work order created \u2014 all in seconds.', tag: 'Gemini + ADK' },
                { emoji: '\uD83D\uDD27', title: 'Tech Fixes', desc: 'Best-fit technician is dispatched with a hands-free voice briefing. Manager dashboard updates live.', tag: 'Cloud Run + WebSockets' },
              ].map((node, idx) => (
                <div key={idx} className={getNodeClass(idx)} onClick={() => activateNode(idx)}>
                  <div className="f-ring" id={`fr${idx}`}>{node.emoji}</div>
                  <div className="f-title">{node.title}</div>
                  <div className="f-desc">{node.desc}</div>
                  <span className="f-tag">{node.tag}</span>
                </div>
              ))}
            </div>

            <div className="flow-trail">
              {[0, 1, 2].map(i => (
                <div key={`trail-${i}`} style={{ display: 'contents' }}>
                  <div className={getTrailDotClass(i)}>{i + 1}</div>
                  <div className={getTrailLineClass(i)} />
                </div>
              ))}
              <div className={`trail-dot ${flowStep >= 2 ? 'done' : ''}`}>{'\u2713'}</div>
            </div>

            <div className="flow-detail">
              {flowDetails.map((d, idx) => (
                <div key={idx} className={`detail-panel ${flowStep === idx ? 'on' : ''}`}>
                  <div className="d-icon">{d.icon}</div>
                  <div>
                    <div className="d-title">{d.title}</div>
                    <div className="d-text">{d.text}</div>
                    <div className="d-chips">
                      {d.chips.map(c => <span key={c} className="chip">{c}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flow-ctrl">
              <button className="ctrl-btn ctrl-play" disabled={flowPlaying} onClick={playFlow}>
                {flowPlaying ? '\u25B6 Playing\u2026' : '\u25B6 Play Full Flow'}
              </button>
              <button className="ctrl-btn ctrl-reset" onClick={() => resetFlow()}>{'\u21BA'} Reset</button>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO TABS */}
      <section className="lp-demo">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Interactive Demo</div>
            <h2 className="section-title">See every system<br />work live</h2>
            <p className="section-sub">Simulated flows &mdash; exactly how it runs in production.</p>
          </div>
          <div className="demo-shell reveal">
            <div className="tab-row">
              {['\uD83C\uDFA4 Voice Report', '\uD83D\uDC41\uFE0F Vision Triage', '\uD83D\uDCCB Full Workflow'].map((label, i) => (
                <button key={i} className={`tab ${activeTab === i ? 'on' : ''}`} onClick={() => setActiveTab(i)}>{label}</button>
              ))}
            </div>
            <div className="tab-body">
              {/* VOICE */}
              <div className={`panel ${activeTab === 0 ? 'on' : ''}`}>
                <div className="voice-grid">
                  <div className="phone">
                    <div className="phone-bar"><span>OPSLY Tenant App</span><span style={{ color: 'var(--green)', fontWeight: 700 }}>{'\u25CF'} Recording</span></div>
                    <div className="phone-inner">
                      <div style={{ textAlign: 'center', paddingTop: 6 }}>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 7 }}>Speak to report an issue</div>
                        <div className="wave">
                          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="wave-bar" />)}
                        </div>
                        <div className={voiceTyping ? 'typing' : ''} style={{ fontSize: 12, color: 'var(--ink2)', fontStyle: 'italic', minHeight: 34, padding: '0 6px', lineHeight: 1.5 }}>
                          {voiceText}
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        {voiceBubbles.map((b, i) => (
                          <div key={i} className="chat-msg ai">
                            <div className="ai-lbl">OPSLY AI</div>
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, color: 'var(--ink2)', marginBottom: 13, lineHeight: 1.6 }}>AI processes voice and auto-generates a prioritised work order.</p>
                    <div className={`work-order ${woLit ? 'lit' : ''}`}>
                      <div className="wo-head">{'\uD83D\uDD27'} Work Order <span className="badge b-med" style={{ fontSize: 9 }}>AI Generated</span></div>
                      <div className="wo-row"><span>Issue</span><span className="wo-val">{woFields.issue}</span></div>
                      <div className="wo-row"><span>Unit</span><span className="wo-val ac">{woFields.unit}</span></div>
                      <div className="wo-row"><span>Priority</span><span className="wo-val rd">{woFields.priority}</span></div>
                      <div className="wo-row"><span>Status</span><span className="wo-val gr">{woFields.status}</span></div>
                      <div className="wo-row"><span>Assigned</span><span className="wo-val">{woFields.assigned}</span></div>
                      <div style={{ marginTop: 11, fontSize: 11, color: 'var(--ink3)', marginBottom: 5 }}>Processing</div>
                      <div className="prog-wrap"><div className="prog-fill" style={{ width: progWidth }} /></div>
                    </div>
                    <button className="run-btn" disabled={voiceRunning} onClick={runVoice}>{'\u25B6'} Run Voice Demo</button>
                  </div>
                </div>
              </div>

              {/* VISION */}
              <div className={`panel ${activeTab === 1 ? 'on' : ''}`}>
                <div className="vis-grid">
                  <div>
                    <div className="upload-zone" onClick={runVision}>
                      <div className="img-box">
                        {'\uD83C\uDFDA\uFE0F'}
                        <div className={`scan-line ${scanActive ? 'active' : ''}`} />
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Click to analyse damage photo</div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>Simulates Gemini Vision API</div>
                    </div>
                  </div>
                  <div className="vis-result">
                    <div className="wo-head">{'\uD83E\uDDE0'} Vision AI Analysis</div>
                    {visionIdle && <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{visionIdle}</div>}
                    {visionDone && (
                      <div>
                        <div className="sev-meter">
                          <div className="sev-lbl"><span>Damage Severity</span><span style={{ fontWeight: 700, color: 'var(--red)' }}>82%</span></div>
                          <div className="sev-track"><div className="sev-fill" style={{ width: sevWidth }} /></div>
                        </div>
                        <div className="wo-row"><span>Detected Issue</span><span className="wo-val rd">Water Damage / Mold Risk</span></div>
                        <div className="wo-row"><span>Confidence</span><span className="wo-val gr">94.3%</span></div>
                        <div className="wo-row"><span>Action</span><span className="wo-val ac">Urgent Plumber Dispatch</span></div>
                        <div style={{ marginTop: 11, fontSize: 11, color: 'var(--ink3)', marginBottom: 5 }}>AI Tags</div>
                        <div>
                          {['water-damage', 'structural-risk', 'mold-potential', 'kitchen', 'high-priority'].map(tag => (
                            <span key={tag} className="ai-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* WORKFLOW */}
              <div className={`panel ${activeTab === 2 ? 'on' : ''}`}>
                <div style={{ maxWidth: 580 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--ink2)', marginBottom: 17, lineHeight: 1.6 }}>The complete OPSLY pipeline &mdash; from tenant voice report to resolved ticket.</p>
                  <div className="step-list">
                    {[
                      'Tenant submits voice report',
                      'AI transcribes & classifies issue',
                      'Vision model scores severity (if photo)',
                      'Work order auto-created & prioritised',
                      'Best-fit technician assigned & notified',
                      'Hands-free voice briefing sent to tech',
                      'Manager dashboard updated in real-time',
                    ].map((label, i) => (
                      <div key={i} className={`step ${wfSteps[i]}`}>
                        <div className="step-num">{wfSteps[i] === 'done' ? '\u2713' : i + 1}</div>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <button className="run-btn" disabled={wfRunning} onClick={runWF} style={{ marginTop: 16 }}>{'\u25B6'} Run Full Workflow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH */}
      <section className="lp-tech">
        <div className="wrap">
          <div className="reveal">
            <div className="eyebrow">Built With</div>
            <h2 className="section-title">Google AI stack,<br />production-ready.</h2>
          </div>
          <div className="pill-row reveal">
            {[
              { name: 'Gemini Live', color: '#4285f4' },
              { name: 'Gemini Vision', color: '#34a853' },
              { name: 'Google ADK', color: '#fbbc04' },
              { name: 'Cloud Run', color: '#ea4335' },
              { name: 'NestJS', color: '#e8453c' },
              { name: 'React', color: '#61dafb' },
              { name: 'WebSockets', color: '#0ea96e' },
              { name: 'PostgreSQL', color: '#a855f7' },
            ].map(pill => (
              <div key={pill.name} className="pill">
                <div className="pill-dot" style={{ background: pill.color }} />
                {pill.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div>&copy; 2026 OPSLY &mdash; AI-Powered Property Management</div>
        <div className="foot-r">
          <span className="sys-ok">All systems operational</span>
        </div>
      </footer>
    </div>
  );
}
