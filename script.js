const backend = "https://card-auth-updated.onrender.com";

// ========== MATRIX RAIN ==========
(function initMatrix() {
  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");
  let cols, drops;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / 16);
    drops = Array(cols).fill(1);
  }

  resize();
  window.addEventListener("resize", resize);

  const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01";

  function draw() {
    ctx.fillStyle = "rgba(2, 11, 14, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ffe1";
    ctx.font = "13px Share Tech Mono";
    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * 16, y * 16);
      if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  setInterval(draw, 50);
})();

// ========== CLOCK ==========
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toTimeString().slice(0, 8);
}
setInterval(updateClock, 1000);
updateClock();

// ========== TOAST ==========
function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  const icons = { success: "✓", error: "✕", info: "◈" };
  el.innerHTML = `<span>${icons[type] || "◈"}</span><span>${msg}</span>`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ========== FILE HANDLING ==========
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
});

function handleFileSelect(file) {
  const fi = document.getElementById("fileInfo");
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileSize").textContent = formatBytes(file.size);
  fi.style.display = "flex";
  toast(`Dataset loaded: ${file.name}`, "success");
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function getFile() {
  if (fileInput.files.length === 0) {
    toast("Upload a dataset first", "error");
    return null;
  }
  return fileInput.files[0];
}

function createFormData(file) {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

// ========== LOADING STATE ==========
const loaderMessages = [
  "INITIALIZING NEURAL SCAN...",
  "PARSING TRANSACTION VECTORS...",
  "BUILDING FRAUD GRAPH...",
  "RUNNING ISOLATION FOREST...",
  "ANALYZING IP REPUTATION...",
  "COMPUTING RISK SCORES...",
  "CROSS-REFERENCING PATTERNS...",
  "FINALIZING THREAT ASSESSMENT..."
];

let loaderInterval = null;
let progressVal = 0;
let loaderMsgIdx = 0;

function showLoading() {
  document.getElementById("loadingState").style.display = "block";
  document.getElementById("tableWrap").style.display = "none";
  document.getElementById("statsBar").style.display = "none";
  progressVal = 0;
  loaderMsgIdx = 0;

  loaderInterval = setInterval(() => {
    progressVal = Math.min(progressVal + Math.random() * 12, 92);
    document.getElementById("progressFill").style.width = progressVal + "%";
    if (Math.random() > 0.6 && loaderMsgIdx < loaderMessages.length - 1) {
      loaderMsgIdx++;
      document.getElementById("loaderText").textContent = loaderMessages[loaderMsgIdx];
    }
  }, 400);
}

function hideLoading() {
  clearInterval(loaderInterval);
  document.getElementById("progressFill").style.width = "100%";
  setTimeout(() => {
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("tableWrap").style.display = "block";
  }, 400);
}

// ========== SCHEMA / INFO ==========
async function detectSchema() {
  const file = getFile();
  if (!file) return;
  const out = document.getElementById("schemaOutput");
  out.innerHTML = '<span class="dim">// scanning schema...</span>';
  try {
    const res = await fetch(`${backend}/detect_schema`, { method: "POST", body: createFormData(file) });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
    toast("Schema detected", "success");
  } catch (e) {
    out.textContent = `// error: ${e.message}`;
    toast("Schema detection failed", "error");
  }
}

async function datasetInfo() {
  const file = getFile();
  if (!file) return;
  const out = document.getElementById("schemaOutput");
  out.innerHTML = '<span class="dim">// loading dataset info...</span>';
  try {
    const res = await fetch(`${backend}/dataset_info`, { method: "POST", body: createFormData(file) });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
    toast("Dataset info loaded", "success");
  } catch (e) {
    out.textContent = `// error: ${e.message}`;
    toast("Failed to load dataset info", "error");
  }
}

// ========== ANALYSIS ==========
async function runAnalysis() {
  const file = getFile();
  if (!file) return;

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  btn.innerHTML = '<span>⟳</span> SCANNING...';

  showLoading();

  try {
    const res = await fetch(`${backend}/analyze`, { method: "POST", body: createFormData(file) });
    const data = await res.json();

    if (data.error) {
      toast(data.error, "error");
      hideLoading();
      return;
    }

    hideLoading();
    displayResults(data.suspicious_cards);
    toast(`Detection complete — ${data.suspicious_cards.length} threats found`, "success");
  } catch (e) {
    toast("Analysis failed: " + e.message, "error");
    hideLoading();
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶</span> RUN DETECTION';
  }
}

function displayResults(cards) {
  const statsBar = document.getElementById("statsBar");
  statsBar.style.display = "flex";

  const high = cards.filter(c => c.risk_level === "high").length;
  const med = cards.filter(c => c.risk_level === "medium").length;
  const low = cards.filter(c => c.risk_level === "low").length;

  animateCount("statTotal", cards.length);
  animateCount("statHigh", high);
  animateCount("statMed", med);
  animateCount("statLow", low);

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";

  if (cards.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          <div class="empty-state">
            <span class="empty-icon">◎</span>
            <p>No suspicious cards detected in this dataset</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  cards.forEach((card, i) => {
    const level = card.risk_level || "low";
    const patterns = card.fraud_patterns || [];
    const maxScore = 80;
    const pct = Math.min((card.risk_score / maxScore) * 100, 100);

    const row = document.createElement("tr");
    row.className = `row-${level}`;
    row.style.animationDelay = `${i * 0.05}s`;
    row.style.animation = "fadeIn 0.4s ease both";

    row.innerHTML = `
      <td style="font-family:var(--font-mono);letter-spacing:0.05em">
        ${maskCard(card.card_number)}
      </td>
      <td>${card.transactions}</td>
      <td>${card.unique_ips}</td>
      <td>
        <div class="score-wrap">
          <span style="font-family:var(--font-mono);min-width:28px">${card.risk_score}</span>
          <div class="score-bar">
            <div class="score-fill ${level}" style="width:${pct}%"></div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${level}">${level.toUpperCase()}</span></td>
      <td>${patterns.map(p => `<span class="pattern-tag ${p}">${p.replace("_"," ")}</span>`).join("")}</td>
    `;
    tbody.appendChild(row);
  });
}

function maskCard(num) {
  const s = String(num);
  if (s.length <= 4) return s;
  return "••••" + s.slice(-4);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  const start = 0;
  const duration = 700;
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

// ========== NETWORK ==========
async function generateNetwork() {
  const file = getFile();
  if (!file) return;

  const btn = event.target.closest("button");
  btn.disabled = true;
  btn.innerHTML = '<span>⟳</span> BUILDING...';

  const placeholder = document.getElementById("networkPlaceholder");
  if (placeholder) placeholder.style.display = "flex";

  try {
    const res = await fetch(`${backend}/fraud_network`, { method: "POST", body: createFormData(file) });
    const data = await res.json();
    renderGraph(data);
    toast("Fraud network rendered", "success");
  } catch (e) {
    toast("Network generation failed", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>◈</span> GENERATE GRAPH';
  }
}

function renderGraph(data) {
  const placeholder = document.getElementById("networkPlaceholder");
  if (placeholder) placeholder.remove();

  const nodes = new vis.DataSet(
    data.nodes.map(n => {
      const isCard = n.type === "card";
      const risk = n.risk || 0;
      let color = isCard ? "#ff2d55" : "#00b4ff";
      let size = isCard ? 14 : 10;

      if (risk > 40) {
        color = "#ff2d55";
        size = 20;
      } else if (risk > 20) {
        color = "#ffb800";
        size = 16;
      } else if (!isCard) {
        color = "#00b4ff";
      }

      return {
        id: n.id,
        label: isCard ? maskCard(n.id) : n.id.slice(0, 12),
        color: {
          background: color,
          border: color,
          highlight: { background: "#ffffff", border: color }
        },
        font: { color: "#c8fff7", size: 10, face: "Share Tech Mono" },
        size,
        borderWidth: 1,
        shadow: { enabled: true, color: color, size: 10 }
      };
    })
  );

  const edges = new vis.DataSet(
    data.edges.map(e => ({
      from: e.source,
      to: e.target,
      color: { color: "#0f3d4a", highlight: "#00ffe1" },
      width: 1
    }))
  );

  const options = {
    nodes: { shape: "dot" },
    edges: { smooth: { type: "dynamic" } },
    physics: {
      stabilization: { iterations: 150 },
      barnesHut: { gravitationalConstant: -3000, springLength: 95 }
    },
    interaction: { hover: true, tooltipDelay: 100 },
    background: { color: "transparent" }
  };

  new vis.Network(
    document.getElementById("networkGraph"),
    { nodes, edges },
    options
  );
}

// ========== METRICS ==========
async function viewMetrics() {
  try {
    const res = await fetch(`${backend}/metrics`);
    const data = await res.json();
    document.getElementById("mDatasets").textContent = data.datasets_processed ?? "—";
    document.getElementById("mTransactions").textContent = data.transactions_processed ?? "—";
    toast("Metrics refreshed", "info");
  } catch (e) {
    toast("Failed to fetch metrics", "error");
  }
}

// Auto-load metrics on startup
viewMetrics();
