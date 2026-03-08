const backend = "https://card-auth-updated.onrender.com";
let selectedFile = null;
window.addEventListener("error", e => {
  console.error("JS Error:", e.message, e.filename, e.lineno);
});
window.addEventListener("unhandledrejection", e => {
  console.error("Unhandled promise:", e.reason);
  toast && toast("Unexpected error: " + (e.reason?.message || e.reason), "error");
});
(function initMatrix() {
  const canvas = document.getElementById("matrixCanvas");
  const ctx    = canvas.getContext("2d");
  let cols, drops;
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols  = Math.floor(canvas.width / 16);
    drops = Array(cols).fill(1);
  }
  resize();
  window.addEventListener("resize", resize);
  const chars = "FRAUDDETECTRISK0123456789!#$@%^ALERTSCAN";
  setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ff41";
    ctx.font = "13px Share Tech Mono";
    drops.forEach((y, i) => {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 16, y * 16);
      if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }, 55);
})();
function updateClock() {
  const n = new Date();
  document.getElementById("clock").textContent = n.toTimeString().slice(0,8);
}
setInterval(updateClock, 1000);
updateClock();
function showSection(id) {
  ["upload","schema","analysis","network","metrics"].forEach(s => {
    document.getElementById("sec-" + s).style.display = (s === id) ? "block" : "none";
  });
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.sec === id);
  });
}
function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  const icon = { success: "[ OK ]", error: "[ ERR ]", info: "[ // ]" };
  el.innerHTML = `<span>${icon[type]||"[//]"}</span><span>${msg}</span>`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
const dropZone  = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => { if (fileInput.files[0]) handleFileSelect(fileInput.files[0]); });
function handleFileSelect(file) {
  selectedFile = file;
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileSize").textContent = fmtBytes(file.size);
  document.getElementById("fileInfo").style.display = "flex";
  document.title = "SENTINEL // " + file.name;
  console.log("[SENTINEL] File stored:", file.name, "size:", file.size, "type:", file.type);
  toast("Dataset loaded: " + file.name, "success");
}
function fmtBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b/1024).toFixed(1) + " KB";
  return (b/1048576).toFixed(1) + " MB";
}
function getFile() {
  if (!selectedFile) {
    toast("Upload a dataset first — go to INGESTION tab", "error");
    return null;
  }
  console.log("[SENTINEL] Using file:", selectedFile.name, "size:", selectedFile.size);
  return selectedFile;
}
function mkFormData(file) {
  const fd = new FormData();
  fd.append("file", file, file.name);  // pass filename explicitly
  console.log("[SENTINEL] Sending file:", file.name, "bytes:", file.size);
  return fd;
}
async function detectSchema() {
  const file = getFile(); if (!file) return;
  const out = document.getElementById("schemaOutput");
  out.innerHTML = '<span class="await">&gt; SCANNING SCHEMA...</span>';
  try {
    const res  = await fetch(`${backend}/detect_schema`, { method:"POST", body: mkFormData(file) });
    const data = await res.json();
    out.innerHTML = renderSchemaTable(data);
    toast("Schema detected", "success");
  } catch (e) {
    out.innerHTML = `<span class="await">&gt; ERROR: ${e.message}</span>`;
    toast("Schema detection failed", "error");
  }
}
function renderSchemaTable(data) {
  const cols = data.columns || {};
  let html = `<p class="schema-section-title">&gt; COLUMN SCHEMA</p>`;
  html += `<table class="info-table">
    <thead><tr><th>COLUMN NAME</th><th>DATA TYPE</th><th>STATUS</th></tr></thead><tbody>`;
  const required = ["card_number","transaction_time","ip_address"];
  for (const [col, dtype] of Object.entries(cols)) {
    const isReq = required.includes(col);
    html += `<tr>
      <td class="label-cell">${col}</td>
      <td class="val-cell">${dtype}</td>
      <td class="${isReq ? 'ok-cell' : 'val-cell'}">${isReq ? "[ REQUIRED ✓ ]" : "[ OPTIONAL ]"}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  if (data.row_count !== undefined) {
    html += `<p style="margin-top:10px;font-size:10px;color:var(--text-muted);letter-spacing:0.12em">&gt; ROW COUNT: <span style="color:var(--green)">${data.row_count}</span></p>`;
  }
  return html;
}
async function datasetInfo() {
  const file = getFile(); if (!file) return;
  const out = document.getElementById("schemaOutput");
  out.innerHTML = '<span class="await">&gt; LOADING DATASET INFO...</span>';
  try {
    const res  = await fetch(`${backend}/dataset_info`, { method:"POST", body: mkFormData(file) });
    const data = await res.json();
    out.innerHTML = renderDatasetInfoTable(data);
    toast("Dataset info loaded", "success");
  } catch (e) {
    out.innerHTML = `<span class="await">&gt; ERROR: ${e.message}</span>`;
    toast("Failed to load dataset info", "error");
  }
}
function renderDatasetInfoTable(data) {
  let html = `<p class="schema-section-title">&gt; DATASET OVERVIEW</p>`;
  html += `<table class="info-table" style="margin-bottom:14px">
    <thead><tr><th>PROPERTY</th><th>VALUE</th></tr></thead><tbody>
    <tr><td class="label-cell">ROW COUNT</td><td class="val-cell">${data.row_count ?? "—"}</td></tr>
    <tr><td class="label-cell">COLUMN COUNT</td><td class="val-cell">${data.column_count ?? "—"}</td></tr>
    <tr><td class="label-cell">COLUMNS</td><td class="val-cell">${(data.columns||[]).join(" · ")}</td></tr>
    </tbody></table>`;
  if (data.dtypes) {
    html += `<p class="schema-section-title">&gt; DATA TYPES</p>`;
    html += `<table class="info-table" style="margin-bottom:14px"><thead><tr><th>COLUMN</th><th>TYPE</th></tr></thead><tbody>`;
    for (const [k,v] of Object.entries(data.dtypes)) {
      html += `<tr><td class="label-cell">${k}</td><td class="val-cell">${v}</td></tr>`;
    }
    html += `</tbody></table>`;
  }
  if (data.missing_values) {
    html += `<p class="schema-section-title">&gt; MISSING VALUES</p>`;
    html += `<table class="info-table"><thead><tr><th>COLUMN</th><th>MISSING</th><th>STATUS</th></tr></thead><tbody>`;
    for (const [k,v] of Object.entries(data.missing_values)) {
      html += `<tr><td class="label-cell">${k}</td><td class="val-cell">${v}</td>
        <td class="${v === 0 ? 'ok-cell' : 'warn-cell'}">${v === 0 ? "[ CLEAN ]" : "[ HAS NULLS ]"}</td></tr>`;
    }
    html += `</tbody></table>`;
  }
  return html;
}
const loaderMsgs = [
  "&gt; INITIALIZING NEURAL SCAN...",
  "&gt; PARSING TRANSACTION VECTORS...",
  "&gt; BUILDING FRAUD GRAPH...",
  "&gt; RUNNING ISOLATION FOREST...",
  "&gt; ANALYZING IP REPUTATION...",
  "&gt; COMPUTING RISK SCORES...",
  "&gt; CROSS-REFERENCING PATTERNS...",
  "&gt; FINALIZING THREAT ASSESSMENT..."
];
let loaderTimer = null, loaderIdx = 0, progress = 0;
function showLoading() {
  document.getElementById("loadingState").style.display = "block";
  document.getElementById("statsBar").style.display = "none";
  loaderIdx = 0; progress = 0;
  loaderTimer = setInterval(() => {
    progress = Math.min(progress + Math.random() * 11, 92);
    document.getElementById("progressFill").style.width = progress + "%";
    if (Math.random() > 0.55 && loaderIdx < loaderMsgs.length - 1) {
      loaderIdx++;
      document.getElementById("loaderMsg").innerHTML = loaderMsgs[loaderIdx];
    }
  }, 420);
}
function hideLoading() {
  clearInterval(loaderTimer);
  document.getElementById("progressFill").style.width = "100%";
  setTimeout(() => { document.getElementById("loadingState").style.display = "none"; }, 350);
}
async function runAnalysis() {
  const file = getFile(); if (!file) return;
  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  btn.textContent = "[ ⟳ SCANNING... ]";
  showSection("analysis");
  showLoading();
  try {
    const res  = await fetch(`${backend}/analyze`, { method:"POST", body: mkFormData(file) });
    console.log("[SENTINEL] Response status:", res.status);
    const data = await res.json();
    console.log("[SENTINEL] Response data:", JSON.stringify(data).slice(0, 300));
    if (data.error) {
      toast("Backend error: " + data.error, "error");
      clearInterval(loaderTimer);
      document.getElementById("loadingState").style.display = "none";
      return;
    }
    clearInterval(loaderTimer);
    document.getElementById("progressFill").style.width = "100%";
    document.getElementById("loadingState").style.display = "none";
    const tblWrap = document.querySelector(".tbl-wrap");
    if (tblWrap) tblWrap.style.display = "block";
    displayResults(data.suspicious_cards || []);
    document.getElementById("statsBar").style.display = "flex";
    if (data.sampled) {
      toast(`Large file: analysed ${data.analyzed_rows.toLocaleString()} of ${data.original_rows.toLocaleString()} rows (all cards preserved)`, "info");
      setTimeout(() => toast(`Detection complete — ${(data.suspicious_cards||[]).length} threats found`, "success"), 800);
    } else {
      toast(`Detection complete — ${(data.suspicious_cards||[]).length} threats found`, "success");
    }
  } catch (e) {
    toast("Analysis failed: " + e.message, "error");
    clearInterval(loaderTimer);
    document.getElementById("loadingState").style.display = "none";
  } finally {
    btn.disabled = false;
    btn.textContent = "[ ▶ RUN FRAUD DETECTION ]";
  }
}
function displayResults(cards) {
  const high = cards.filter(c => c.risk_level === "high").length;
  const med  = cards.filter(c => c.risk_level === "medium").length;
  const low  = cards.filter(c => c.risk_level === "low").length;
  countUp("statTotal", cards.length);
  countUp("statHigh",  high);
  countUp("statMed",   med);
  countUp("statLow",   low);
  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";
  if (!cards.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">&gt;&gt; NO SUSPICIOUS CARDS DETECTED &lt;&lt;</td></tr>`;
    return;
  }
  cards.forEach((card, i) => {
    const level    = card.risk_level || "low";
    const patterns = card.fraud_patterns || [];
    const pct      = Math.min(((card.risk_score || 0) / 80) * 100, 100);
    const tr = document.createElement("tr");
    tr.className = `row-${level}`;
    tr.style.animation = `fadeIn 0.4s ease ${i * 0.05}s both`;
    tr.innerHTML = `
      <td style="font-family:var(--font)">${maskCard(card.card_number)}</td>
      <td>${card.transactions}</td>
      <td>${card.unique_ips}</td>
      <td>
        <div class="score-wrap">
          <span class="score-num">${card.risk_score}</span>
          <div class="score-bar"><div class="score-fill ${level}" style="width:${pct}%"></div></div>
        </div>
      </td>
      <td><span class="badge badge-${level}">${level.toUpperCase()}</span></td>
      <td>${patterns.map(p => `<span class="ptag ${p}">${p.replace(/_/g," ")}</span>`).join("")}</td>
    `;
    tbody.appendChild(tr);
  });
}
function maskCard(num) {
  const s = String(num);
  return s.length > 4 ? "••••" + s.slice(-4) : s;
}
function countUp(id, target) {
  const el = document.getElementById(id);
  const dur = 600, start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.floor(p * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  })(start);
}
let graphData = null;
async function generateNetwork() {
  const file = getFile(); if (!file) return;
  const btn = event.target.closest("button");
  btn.disabled = true; btn.textContent = "[ ⟳ BUILDING GRAPH... ]";
  try {
    const res  = await fetch(`${backend}/fraud_network`, { method:"POST", body: mkFormData(file) });
    console.log("[SENTINEL] Network response status:", res.status);
    const data = await res.json();
    console.log("[SENTINEL] Network nodes:", (data.nodes||[]).length, "edges:", (data.edges||[]).length);
    graphData = data;
    renderGraph(data);
    toast("Network graph rendered", "success");
  } catch (e) {
    toast("Network generation failed: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "[ GENERATE NETWORK GRAPH ]";
  }
}
function renderGraph(data) {
  const ph = document.getElementById("graphPH");
  if (ph) ph.remove();
  const cardRisks = {};
  (data.nodes || []).forEach(n => {
    if (n.type === "card") cardRisks[n.id] = n.risk || 0;
  });
  const visNodes = new vis.DataSet(
    (data.nodes || []).map(n => {
      const isCard = n.type === "card";
      const risk   = n.risk || 0;
      let color, size, shape;
      if (isCard) {
        if (risk >= 40)      { color = "#ff2d55"; size = 22; }
        else if (risk >= 15) { color = "#ffb800"; size = 18; }
        else                 { color = "#00ff41"; size = 14; }
        shape = "dot";
      } else {
        color = "#00b4ff";
        size  = 11;
        shape = "diamond";
      }
      const label = isCard
        ? `${maskCard(n.id)}\n[CARD]`
        : `${n.id}\n[IP]`;
      return {
        id: n.id,
        label,
        color: {
          background: color,
          border: color,
          highlight: { background: "#ffffff", border: color }
        },
        font: {
          color: color,
          size: 10,
          face: "Share Tech Mono",
          multi: false,
          align: "center"
        },
        size,
        shape,
        borderWidth: 1,
        shadow: { enabled: true, color: color, size: 12, x: 0, y: 0 },
        nodeType: n.type,
        nodeRisk: risk,
        nodeCluster: n.cluster,
        originalId: n.id
      };
    })
  );
  const visEdges = new vis.DataSet(
    (data.edges || []).map(e => ({
      from: e.source,
      to: e.target,
      color: { color: "#00ff4133", highlight: "#00ff41", opacity: 0.6 },
      width: 1,
      smooth: { type: "dynamic" }
    }))
  );
  const options = {
    nodes: { shape: "dot" },
    physics: {
      stabilization: { iterations: 120 },
      barnesHut: { gravitationalConstant: -3000, springLength: 100, damping: 0.15 }
    },
    interaction: { hover: true, tooltipDelay: 80 },
    background: { color: "transparent" }
  };
  const container = document.getElementById("networkGraph");
  const network   = new vis.Network(container, { nodes: visNodes, edges: visEdges }, options);
  network.on("click", params => {
    const nodePanel = document.getElementById("nodeInfoPanel");
    if (!params.nodes.length) { nodePanel.style.display = "none"; return; }
    const nodeId   = params.nodes[0];
    const nodeData = visNodes.get(nodeId);
    if (!nodeData) return;
    const isCard   = nodeData.nodeType === "card";
    const risk     = nodeData.nodeRisk || 0;
    const riskLevel = risk >= 40 ? "HIGH" : risk >= 15 ? "MEDIUM" : "LOW";
    const riskClass = risk >= 40 ? "red"  : risk >= 15 ? "amber"  : "green";
    const connectedEdges = visEdges.get().filter(e => e.from === nodeId || e.to === nodeId);
    const connectedNodes = new Set();
    connectedEdges.forEach(e => {
      if (e.from !== nodeId) connectedNodes.add(e.from);
      if (e.to   !== nodeId) connectedNodes.add(e.to);
    });
    document.getElementById("nodeInfoBody").innerHTML = `
      <div class="np-row"><span class="np-key">NODE ID</span><span class="np-val">${nodeData.originalId}</span></div>
      <div class="np-row"><span class="np-key">NODE TYPE</span><span class="np-val">${isCard ? "CARD NUMBER" : "IP ADDRESS"}</span></div>
      <div class="np-row"><span class="np-key">RISK SCORE</span><span class="np-val ${riskClass}">${risk.toFixed(1)}</span></div>
      <div class="np-row"><span class="np-key">THREAT LEVEL</span><span class="np-val ${riskClass}">${riskLevel}</span></div>
      <div class="np-row"><span class="np-key">CLUSTER ID</span><span class="np-val">${nodeData.nodeCluster ?? "—"}</span></div>
      <div class="np-row"><span class="np-key">CONNECTIONS</span><span class="np-val">${connectedNodes.size} ${isCard ? "IP address(es)" : "card(s)"}</span></div>
    `;
    nodePanel.style.display = "block";
  });
}
async function viewMetrics() {
  try {
    const res  = await fetch(`${backend}/metrics`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    renderMetrics(data, false);
    toast("Metrics refreshed", "info");
  } catch (e) {
    toast("Failed to fetch metrics: " + e.message, "error");
  }
}
async function viewDashboard() {
  try {
    const res  = await fetch(`${backend}/dashboard`);
    const data = await res.json();
    renderMetrics(data, true);
    toast("Dashboard loaded", "info");
  } catch (e) {
    toast("Failed to load dashboard: " + e.message, "error");
  }
}
function renderMetrics(data, isDash) {
  const out = document.getElementById("metricsOutput");
  const entries = Object.entries(data);
  let cardsHtml = `<div class="metrics-grid">`;
  entries.forEach(([k, v]) => {
    const isNum = typeof v === "number";
    cardsHtml += `
      <div class="metric-card">
        <div class="mc-val">${isNum ? v : "—"}</div>
        <div class="mc-lbl">${k.replace(/_/g," ").toUpperCase()}</div>
      </div>`;
  });
  cardsHtml += `</div>`;
  const strFields = entries.filter(([,v]) => typeof v === "string");
  let tableHtml = "";
  if (strFields.length) {
    tableHtml = `<p class="schema-section-title" style="margin-top:14px">&gt; STATUS FLAGS</p>
    <table class="info-table">
      <thead><tr><th>PARAMETER</th><th>VALUE</th></tr></thead><tbody>`;
    strFields.forEach(([k, v]) => {
      const isActive = v.toLowerCase() === "active" || v.toLowerCase() === "online";
      tableHtml += `<tr>
        <td class="label-cell">${k.replace(/_/g," ").toUpperCase()}</td>
        <td class="${isActive ? 'ok-cell' : 'val-cell'}">${v.toUpperCase()}${isActive ? " ✓" : ""}</td>
      </tr>`;
    });
    tableHtml += `</tbody></table>`;
  }

  out.innerHTML = cardsHtml + tableHtml;
}
async function keepAlive() {
  try {
    const res = await fetch(`${backend}/`);
    const ok  = res.ok;
    console.log("[SENTINEL] Keep-alive ping:", ok ? "OK" : "failed");
    const dot = document.querySelector(".pulse-dot");
    if (dot) dot.style.background = ok ? "var(--green)" : "var(--red)";
  } catch (e) {
    console.warn("[SENTINEL] Backend unreachable:", e.message);
    const dot = document.querySelector(".pulse-dot");
    if (dot) dot.style.background = "var(--red)";
    const st = document.querySelector(".status-text");
    if (st) st.textContent = "BACKEND OFFLINE — CHECK RENDER";
  }
}
keepAlive();                          
setInterval(keepAlive, 10 * 60 * 1000);
(async function initMetrics() {
  try {
    const res  = await fetch(`${backend}/metrics`);
    const data = await res.json();
    renderMetrics(data, false);
  } catch (e) {}
})();
