import { useMemo, useRef, useState } from "react";
import "./App.css";

const initialMatches = [
  {
    id: 1,
    village: "Rampur",
    hindi: "रामपुर",
    district: "Gorakhpur",
    state: "Uttar Pradesh",
    sourceA: "SOIL-104",
    sourceB: "WX-208",
    sourceC: "CROP-051",
    confidence: 96,
    status: "Verified",
    evidence: ["Name similarity", "Hindi transliteration", "Centroid match"],
    updated: "29 Oct 2026",
  },
  {
    id: 2,
    village: "Basantpur",
    hindi: "बसंतपुर",
    district: "Deoria",
    state: "Uttar Pradesh",
    sourceA: "SOIL-211",
    sourceB: "WX-309",
    sourceC: "CROP-081",
    confidence: 84,
    status: "Needs review",
    evidence: ["Similar spelling", "District match"],
    updated: "29 Oct 2026",
  },
  {
    id: 3,
    village: "Shivpur",
    hindi: "शिवपुर",
    district: "Gorakhpur",
    state: "Uttar Pradesh",
    sourceA: "SOIL-087",
    sourceB: "WX-166",
    sourceC: "CROP-027",
    confidence: 72,
    status: "Needs review",
    evidence: ["Name similarity", "Tehsil alignment"],
    updated: "28 Oct 2026",
  },
  {
    id: 4,
    village: "Madhopur",
    hindi: "माधोपुर",
    district: "Kushinagar",
    state: "Uttar Pradesh",
    sourceA: "SOIL-320",
    sourceB: "WX-411",
    sourceC: "CROP-103",
    confidence: 43,
    status: "Uncertain",
    evidence: ["Partial name match", "Location not verified"],
    updated: "28 Oct 2026",
  },
  {
    id: 5,
    village: "Belwa",
    hindi: "बेलवा",
    district: "Maharajganj",
    state: "Uttar Pradesh",
    sourceA: "SOIL-156",
    sourceB: "WX-232",
    sourceC: "CROP-069",
    confidence: 98,
    status: "Verified",
    evidence: ["Name match", "Administrative ID verified"],
    updated: "27 Oct 2026",
  },
  {
    id: 6,
    village: "Kalyanpur",
    hindi: "कल्याणपुर",
    district: "Kanpur Nagar",
    state: "Uttar Pradesh",
    sourceA: "SOIL-412",
    sourceB: "WX-102",
    sourceC: "CROP-311",
    confidence: 94,
    status: "Verified",
    evidence: ["Exact script match", "LGD Code alignment"],
    updated: "27 Oct 2026",
  },
  {
    id: 7,
    village: "Bishunpur",
    hindi: "बिश्ुनपुर",
    district: "Basti",
    state: "Uttar Pradesh",
    sourceA: "SOIL-501",
    sourceB: "WX-612",
    sourceC: "CROP-119",
    confidence: 88,
    status: "Needs review",
    evidence: ["Phonetic match", "Minor spelling variation"],
    updated: "26 Oct 2026",
  },
  {
    id: 8,
    village: "Chandpur",
    hindi: "चांदपुर",
    district: "Varanasi",
    state: "Uttar Pradesh",
    sourceA: "SOIL-220",
    sourceB: "WX-341",
    sourceC: "CROP-092",
    confidence: 92,
    status: "Verified",
    evidence: ["High confidence overlap", "Weather grid match"],
    updated: "26 Oct 2026",
  },
  {
    id: 9,
    village: "Pipraich",
    hindi: "पिपराइच",
    district: "Gorakhpur",
    state: "Uttar Pradesh",
    sourceA: "SOIL-109",
    sourceB: "WX-210",
    sourceC: "CROP-058",
    confidence: 99,
    status: "Verified",
    evidence: ["Pin code match", "Cadastral boundary verified"],
    updated: "25 Oct 2026",
  },
  {
    id: 10,
    village: "Saidpur",
    hindi: "सैदपुर",
    district: "Ghazipur",
    state: "Uttar Pradesh",
    sourceA: "SOIL-610",
    sourceB: "WX-702",
    sourceC: "CROP-401",
    confidence: 65,
    status: "Needs review",
    evidence: ["Multiple village match candidates"],
    updated: "25 Oct 2026",
  },
  {
    id: 11,
    village: "Fatehpur",
    hindi: "फतेहपुर",
    district: "Barabanki",
    state: "Uttar Pradesh",
    sourceA: "SOIL-701",
    sourceB: "WX-811",
    sourceC: "CROP-502",
    confidence: 51,
    status: "Uncertain",
    evidence: ["Boundary mismatch", "Duplicate place name in district"],
    updated: "24 Oct 2026",
  },
  {
    id: 12,
    village: "Anandpur",
    hindi: "आनंदपुर",
    district: "Patna",
    state: "Bihar",
    sourceA: "SOIL-802",
    sourceB: "WX-190",
    sourceC: "CROP-610",
    confidence: 95,
    status: "Verified",
    evidence: ["State registry match", "Exact phonetic fit"],
    updated: "24 Oct 2026",
  },
  {
    id: 13,
    village: "Sultanpur",
    hindi: "सुल्तानपुर",
    district: "Muzaffarpur",
    state: "Bihar",
    sourceA: "SOIL-841",
    sourceB: "WX-220",
    sourceC: "CROP-640",
    confidence: 78,
    status: "Needs review",
    evidence: ["District level candidate matched"],
    updated: "23 Oct 2026",
  },
  {
    id: 14,
    village: "Bikramganj",
    hindi: "बिक्रमगंज",
    district: "Rohtas",
    state: "Bihar",
    sourceA: "SOIL-901",
    sourceB: "WX-310",
    sourceC: "CROP-702",
    confidence: 49,
    status: "Uncertain",
    evidence: ["Missing soil card coordinates"],
    updated: "23 Oct 2026",
  },
  {
    id: 15,
    village: "Shivapur",
    hindi: "शिवापूर",
    district: "Pune",
    state: "Maharashtra",
    sourceA: "SOIL-112",
    sourceB: "WX-501",
    sourceC: "CROP-810",
    confidence: 97,
    status: "Verified",
    evidence: ["7/12 record matched", "AgriStack verified"],
    updated: "22 Oct 2026",
  },
  {
    id: 16,
    village: "Chandrapur",
    hindi: "चंद्रपूर",
    district: "Nagpur",
    state: "Maharashtra",
    sourceA: "SOIL-134",
    sourceB: "WX-522",
    sourceC: "CROP-840",
    confidence: 82,
    status: "Needs review",
    evidence: ["Regional dialect variation"],
    updated: "22 Oct 2026",
  },
  {
    id: 17,
    village: "Sonpur",
    hindi: "सोनपुर",
    district: "Saran",
    state: "Bihar",
    sourceA: "SOIL-922",
    sourceB: "WX-388",
    sourceC: "CROP-755",
    confidence: 91,
    status: "Verified",
    evidence: ["River boundary match", "Verified crop survey"],
    updated: "21 Oct 2026",
  },
  {
    id: 18,
    village: "Govindpur",
    hindi: "गोविंदपुर",
    district: "Dhanbad",
    state: "Jharkhand",
    sourceA: "SOIL-301",
    sourceB: "WX-412",
    sourceC: "CROP-221",
    confidence: 62,
    status: "Needs review",
    evidence: ["Spatial centroid offset by 1.2km"],
    updated: "21 Oct 2026",
  },
  {
    id: 19,
    village: "Rampura",
    hindi: "रामपुरा",
    district: "Jaipur",
    state: "Rajasthan",
    sourceA: "SOIL-441",
    sourceB: "WX-610",
    sourceC: "CROP-339",
    confidence: 89,
    status: "Needs review",
    evidence: ["Hindi trailing vowel variation (-a vs -pur)"],
    updated: "20 Oct 2026",
  },
  {
    id: 20,
    village: "Mohanpur",
    hindi: "मोहनपुर",
    district: "Nadia",
    state: "West Bengal",
    sourceA: "SOIL-520",
    sourceB: "WX-711",
    sourceC: "CROP-480",
    confidence: 45,
    status: "Uncertain",
    evidence: ["Bengali script transliteration missing"],
    updated: "20 Oct 2026",
  },
  {
    id: 21,
    village: "Krishnapur",
    hindi: "कृष्णपुर",
    district: "Hooghly",
    state: "West Bengal",
    sourceA: "SOIL-550",
    sourceB: "WX-730",
    sourceC: "CROP-492",
    confidence: 93,
    status: "Verified",
    evidence: ["Block boundary matched", "Historical registry link"],
    updated: "19 Oct 2026",
  },
  {
    id: 22,
    village: "Sundarpur",
    hindi: "सुंदरपुर",
    district: "Ganjam",
    state: "Odisha",
    sourceA: "SOIL-620",
    sourceB: "WX-810",
    sourceC: "CROP-580",
    confidence: 76,
    status: "Needs review",
    evidence: ["Odia script mapping pending verification"],
    updated: "19 Oct 2026",
  },
  {
    id: 23,
    village: "Gopalpur",
    hindi: "गोपालपुर",
    district: "Balasore",
    state: "Odisha",
    sourceA: "SOIL-655",
    sourceB: "WX-832",
    sourceC: "CROP-601",
    confidence: 96,
    status: "Verified",
    evidence: ["Coastal survey plot match", "LGD match"],
    updated: "18 Oct 2026",
  },
  {
    id: 24,
    village: "Raipur",
    hindi: "रायपुर",
    district: "Durg",
    state: "Chhattisgarh",
    sourceA: "SOIL-711",
    sourceB: "WX-902",
    sourceC: "CROP-680",
    confidence: 58,
    status: "Uncertain",
    evidence: ["Conflicting village vs urban ward ID"],
    updated: "18 Oct 2026",
  },
  {
    id: 25,
    village: "Dharampur",
    hindi: "धरमपुर",
    district: "Valsad",
    state: "Gujarat",
    sourceA: "SOIL-880",
    sourceB: "WX-950",
    sourceC: "CROP-790",
    confidence: 90,
    status: "Verified",
    evidence: ["Tribal land record matched", "AgriStack ID verified"],
    updated: "17 Oct 2026",
  },
];

const initialDatasets = [
  { id: 1, name: "Soil Health Records", code: "SOIL", type: "Soil", records: 12400, format: "CSV" },
  { id: 2, name: "Village Weather Data", code: "WX", type: "Weather", records: 9800, format: "CSV" },
  { id: 3, name: "Crop Survey Records", code: "CROP", type: "Crop", records: 15600, format: "CSV" },
  { id: 4, name: "Cadastral Plot Boundaries", code: "CAD", type: "Boundary", records: 8400, format: "GeoJSON" },
  { id: 5, name: "PM-KISAN Farmer Registry", code: "PMK", type: "Registry", records: 21000, format: "API" },
  { id: 6, name: "Groundwater Survey DB", code: "CGW", type: "Water", records: 4300, format: "JSON" },
];

const navItems = [
  { id: "overview", icon: "◫", label: "Overview" },
  { id: "matches", icon: "⇄", label: "Match explorer" },
  { id: "datasets", icon: "▤", label: "Datasets" },
  { id: "review", icon: "✓", label: "Review queue" },
  { id: "provenance", icon: "⌘", label: "Data provenance" },
  { id: "accuracy", icon: "◉", label: "Accuracy lab" },
];

function confidenceLabel(score) {
  if (score >= 90) return "High";
  if (score >= 70) return "Medium";
  return "Low";
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFC")
    .toLocaleLowerCase("en-IN")
    .replace(/[\s\-_.]+/g, "")
    .trim();
}

function escapeCSV(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function App() {
  const [matches, setMatches] = useState(initialMatches);
  const [datasets, setDatasets] = useState(initialDatasets);
  const [activePage, setActivePage] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [notice, setNotice] = useState("");
  const [language, setLanguage] = useState("EN");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [uploadName, setUploadName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const verifiedCount = matches.filter((m) => m.status === "Verified").length;
  const reviewCount = matches.filter((m) => m.status === "Needs review").length;
  const uncertainCount = matches.filter((m) => m.status === "Uncertain").length;

  const filteredMatches = useMemo(() => {
    const query = normalizeName(search);

    return matches.filter((m) => {
      const searchable = normalizeName([
        m.village,
        m.hindi,
        m.district,
        m.state,
        m.sourceA,
        m.sourceB,
        m.sourceC,
      ].join(" "));

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      const matchesSource =
        sourceFilter === "All" ||
        [m.sourceA, m.sourceB, m.sourceC].some((s) =>
          s.startsWith(sourceFilter)
        );

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [matches, search, statusFilter, sourceFilter]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function changeStatus(id, status) {
    setMatches((current) =>
      current.map((m) =>
        m.id === id
          ? { ...m, status, updated: new Date().toLocaleDateString("en-GB") }
          : m
      )
    );

    setSelectedMatch((current) =>
      current?.id === id ? { ...current, status } : current
    );

    showNotice(`Match marked as "${status}".`);
  }

  function exportMatches() {
    const headers = [
      "Village",
      "Hindi Name",
      "District",
      "State",
      "Soil ID",
      "Weather ID",
      "Crop ID",
      "Confidence",
      "Status",
      "Evidence",
    ];

    const rows = filteredMatches.map((m) => [
      m.village,
      m.hindi,
      m.district,
      m.state,
      m.sourceA,
      m.sourceB,
      m.sourceC,
      `${m.confidence}%`,
      m.status,
      m.evidence.join("; "),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kshetra-link-matches.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    showNotice("Matching table exported as CSV.");
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadPreview([]);
    setUploadName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a CSV file. Excel files are not supported in this demo.");
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());

      if (lines.length < 2) {
        setUploadError("The CSV must contain a header and at least one data row.");
        return;
      }

      function parseCSVLine(line) {
        const cells = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"' && inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            cells.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }

        cells.push(current.trim());
        return cells;
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
      const nameIndex = headers.findIndex((h) =>
        ["village", "village_name", "name", "place", "स्थान"].includes(h)
      );

      if (nameIndex === -1) {
        setUploadError("Add a column named village, village_name, name, place, or स्थान.");
        return;
      }

      const parsed = lines.slice(1).map((line, index) => {
        const cells = parseCSVLine(line);
        return {
          id: index + 1,
          name: cells[nameIndex] || "",
          row: index + 2,
          district:
            cells[headers.findIndex((h) => h === "district")] || "Not provided",
        };
      }).filter((row) => row.name);

      if (parsed.length === 0) {
        setUploadError("No village names were found in the uploaded file.");
        return;
      }

      setUploadPreview(parsed);
      showNotice(`${parsed.length} village records read from the CSV.`);
    } catch {
      setUploadError("Unable to read this file. Please check its CSV format.");
    }
  }

  function addImportedMatches() {
    if (uploadPreview.length === 0) return;

    const imported = uploadPreview.map((row, index) => {
      const existing = matches.find(
        (m) => normalizeName(m.village) === normalizeName(row.name)
      );

      return {
        id: Date.now() + index,
        village: row.name,
        hindi: "Not provided",
        district: row.district,
        state: "Not provided",
        sourceA: `UPLOAD-${row.row}`,
        sourceB: existing?.sourceB || "Not matched",
        sourceC: existing?.sourceC || "Not matched",
        confidence: existing ? 85 : 0,
        status: existing ? "Needs review" : "Uncertain",
        evidence: existing
          ? ["Name similarity with existing demo record", "Human review required"]
          : ["New record", "No confirmed cross-dataset match"],
        updated: new Date().toLocaleDateString("en-GB"),
      };
    });

    setMatches((current) => [...imported, ...current]);
    setDatasets((current) => [
      {
        id: Date.now(),
        name: uploadName,
        code: "UPLOAD",
        type: "Imported",
        records: uploadPreview.length,
        format: "CSV",
      },
      ...current,
    ]);
    setUploadPreview([]);
    setUploadName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setActivePage("matches");
    showNotice("Records imported. New matches are not automatically verified.");
  }

  const pageTitles = {
    overview: ["Overview", "Your geospatial matching workspace."],
    matches: ["Match explorer", "Compare place records across datasets."],
    datasets: ["Datasets", "Manage and inspect your imported data sources."],
    review: ["Review queue", "Resolve uncertain records with human oversight."],
    provenance: ["Data provenance", "Understand where each match came from."],
    accuracy: ["Accuracy lab", "Inspect the current demo matching results."],
  };

  const isHindi = language === "HI";

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <button className="brand" onClick={() => setActivePage("overview")}>
          <span className="brand-mark">K</span>
          <span>
            <strong>Kshetra Link</strong>
            <small>GEOCODE SETU</small>
          </span>
        </button>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => {
                setActivePage(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{isHindi && item.id === "overview" ? "डैशबोर्ड" : item.label}</span>
              {item.id === "review" && reviewCount + uncertainCount > 0 && (
                <span className="nav-count">{reviewCount + uncertainCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="principle-card">
            <span className="principle-icon">✳</span>
            <strong>Trust every match.</strong>
            <p>Transparent data. Collective decisions. Better connections.</p>
          </div>
          <div className="user-profile">
            <div className="avatar">KL</div>
            <div className="user-info">
              <strong>Workspace Admin</strong>
              <span>Demo workspace</span>
            </div>
            <span className="profile-dots">···</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageTitles[activePage][0]}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-pill"><span /> DEMO DATA</span>
            <button
              className="language-button"
              onClick={() => setLanguage((v) => (v === "EN" ? "HI" : "EN"))}
              title="Toggle language demo"
            >
              ◉ {language}
            </button>
            <button
              className="icon-button"
              title="Show data information"
              onClick={() => showNotice("This workspace currently uses local demo data.")}
            >
              ⓘ
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">BHOOMI & BHAROSA BHARAT</div>
              <h1>{isHindi && activePage === "overview" ? "नमस्ते, आपका स्वागत है" : pageTitles[activePage][0]}</h1>
              <p>{pageTitles[activePage][1]}</p>
            </div>
            <button className="button button-primary" onClick={() => {
              setActivePage("datasets");
              setTimeout(() => fileInputRef.current?.click(), 0);
            }}>
              <span>＋</span> Import dataset
            </button>
          </div>

          {activePage === "overview" && (
            <>
              <section className="hero-banner">
                <div className="hero-copy">
                  <div className="hero-tag"><span /> PLACE DATA, CONNECTED</div>
                  <h2>One place. Many records.<br />A single trusted connection.</h2>
                  <p>Connect soil, weather and crop records across languages, IDs and boundaries—with evidence behind every match.</p>
                  <button className="hero-button" onClick={() => setActivePage("matches")}>
                    Explore matches <span>→</span>
                  </button>
                </div>
                <div className="hero-visual" aria-label="Illustrative linked datasets">
                  <div className="map-orbit orbit-one" />
                  <div className="map-orbit orbit-two" />
                  <div className="map-node node-soil"><span>▧</span><small>SOIL</small></div>
                  <div className="map-node node-weather"><span>☼</span><small>WEATHER</small></div>
                  <div className="map-node node-crop"><span>♧</span><small>CROP</small></div>
                  <div className="map-center"><span>⌖</span><small>PLACE ID</small></div>
                  <span className="visual-line line-one" />
                  <span className="visual-line line-two" />
                  <span className="visual-line line-three" />
                </div>
              </section>

              <section className="stats-grid">
                <StatCard label="Total match candidates" value={matches.length} icon="⇄" note="Across connected records" tone="green" />
                <StatCard label="Verified links" value={verifiedCount} icon="✓" note={`${matches.length ? Math.round((verifiedCount / matches.length) * 100) : 0}% of current candidates`} tone="blue" />
                <StatCard label="Needs review" value={reviewCount} icon="◷" note="Awaiting human decision" tone="amber" />
                <StatCard label="Uncertain matches" value={uncertainCount} icon="!" note="Do not auto-merge" tone="red" />
              </section>

              <div className="content-grid">
                <section className="panel matches-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent match candidates</h3>
                      <p>Latest cross-dataset place connections</p>
                    </div>
                    <button className="text-button" onClick={() => setActivePage("matches")}>View all →</button>
                  </div>
                  <MatchTable
                    matches={matches.slice(0, 4)}
                    onSelect={setSelectedMatch}
                  />
                </section>

                <section className="panel source-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Connected sources</h3>
                      <p>Data available in this workspace</p>
                    </div>
                    <span className="source-count">{datasets.length} sources</span>
                  </div>
                  <div className="source-list">
                    {datasets.slice(0, 5).map((d, index) => (
                      <div className="source-row" key={d.id}>
                        <div className={`source-symbol source-${index % 3}`}>{["▧", "☼", "♧"][index % 3]}</div>
                        <div className="source-details">
                          <strong>{d.name}</strong>
                          <span>{d.records.toLocaleString()} records · {d.format}</span>
                        </div>
                        <span className="source-live">●</span>
                      </div>
                    ))}
                  </div>
                  <button className="button button-secondary full-button" onClick={() => setActivePage("datasets")}>Manage datasets</button>
                </section>
              </div>

              <section className="principles-strip">
                <div><span>01</span><strong>Explainable matching</strong><small>See the evidence behind a suggestion.</small></div>
                <div><span>02</span><strong>Visible provenance</strong><small>Trace every record to its source.</small></div>
                <div><span>03</span><strong>Collective governance</strong><small>Let reviewers resolve uncertainty.</small></div>
              </section>
            </>
          )}

          {activePage === "matches" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h3>Place matching registry</h3>
                  <p>Search aliases, source IDs, districts and place names.</p>
                </div>
                <button className="button button-secondary" onClick={exportMatches}>↓ Export CSV</button>
              </div>
              <div className="filter-row">
                <label className="search-box">
                  <span>⌕</span>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Rampur, रामपुर, district or ID..." />
                  {search && <button onClick={() => setSearch("")}>×</button>}
                </label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>All</option>
                  <option>Verified</option>
                  <option>Needs review</option>
                  <option>Uncertain</option>
                </select>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                  <option value="All">All sources</option>
                  <option value="SOIL">Soil</option>
                  <option value="WX">Weather</option>
                  <option value="CROP">Crop</option>
                </select>
              </div>
              <div className="table-summary"><span>{filteredMatches.length} records found</span><span>Scores are demo estimates, not validated probabilities.</span></div>
              <MatchTable matches={filteredMatches} onSelect={setSelectedMatch} />
              {filteredMatches.length === 0 && <div className="empty-state">No records found. Try another spelling or filter.</div>}
            </section>
          )}

          {activePage === "datasets" && (
            <div className="stack-layout">
              <section className="panel upload-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Import a dataset</h3>
                    <p>Upload a CSV containing village names to preview and add records to this demo.</p>
                  </div>
                  <span className="upload-icon">↑</span>
                </div>
                <div className="upload-dropzone">
                  <div className="upload-cloud">↑</div>
                  <strong>Choose a CSV file to get started</strong>
                  <p>Required column: <code>village</code>, <code>village_name</code>, <code>name</code>, <code>place</code> or <code>स्थान</code>.</p>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
                  <span className="muted-text">CSV only · Excel and server-side processing are not enabled in this demo</span>
                </div>
                {uploadError && <div className="error-message">{uploadError}</div>}
                {uploadPreview.length > 0 && (
                  <div className="preview-box">
                    <div className="panel-heading">
                      <div><h3>Import preview</h3><p>{uploadName} · {uploadPreview.length} rows</p></div>
                      <button className="button button-primary" onClick={addImportedMatches}>Add to registry</button>
                    </div>
                    <div className="preview-list">
                      {uploadPreview.slice(0, 5).map((row) => <div key={row.id}><span>{row.row}</span><strong>{row.name}</strong><small>{row.district}</small></div>)}
                      {uploadPreview.length > 5 && <p>And {uploadPreview.length - 5} more rows...</p>}
                    </div>
                  </div>
                )}
              </section>
              <section className="panel">
                <div className="panel-heading"><div><h3>Registered datasets</h3><p>Source metadata for this workspace</p></div><span className="source-count">{datasets.length} datasets</span></div>
                <div className="dataset-grid">
                  {datasets.map((d, index) => (
                    <article className="dataset-card" key={d.id}>
                      <div className={`dataset-symbol source-${index % 3}`}>{["▧", "☼", "♧"][index % 3]}</div>
                      <span className="dataset-type">{d.type}</span>
                      <h4>{d.name}</h4>
                      <p>Source code: {d.code}</p>
                      <div className="dataset-footer"><span>{d.records.toLocaleString()} records</span><span>{d.format}</span></div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activePage === "review" && (
            <section className="panel full-panel">
              <div className="panel-heading"><div><h3>Human review queue</h3><p>Only authorized reviewers should confirm ambiguous records.</p></div><span className="review-badge">{reviewCount + uncertainCount} pending</span></div>
              <div className="review-note"><strong>Review principle</strong><p>Names alone cannot prove two records refer to the same place. Verify administrative identifiers and boundaries where possible.</p></div>
              <MatchTable matches={matches.filter((m) => m.status !== "Verified")} onSelect={setSelectedMatch} />
              {matches.filter((m) => m.status !== "Verified").length === 0 && <div className="empty-state">No matches are waiting for review.</div>}
            </section>
          )}

          {activePage === "provenance" && (
            <section className="panel full-panel">
              <div className="panel-heading"><div><h3>Data provenance</h3><p>Source, evidence, status and update history for current demo records.</p></div><span className="source-count">Traceable records</span></div>
              <div className="timeline">
                {matches.map((m) => (
                  <article className="timeline-item" key={m.id}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-top"><strong>{m.village} <span className="hindi-inline">{m.hindi}</span></strong><span>{m.updated}</span></div>
                      <p>{m.district}, {m.state}</p>
                      <div className="provenance-tags">{[m.sourceA, m.sourceB, m.sourceC].map((s) => <span key={s}>{s}</span>)}</div>
                      <small>Evidence: {m.evidence.join(" · ")}</small>
                      <div className="timeline-bottom"><StatusBadge status={m.status} /><span>Demo confidence: {m.confidence}%</span><button className="text-button" onClick={() => setSelectedMatch(m)}>Inspect →</button></div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="muted-text">This prototype keeps decisions in browser memory. Persistent audit logging must be implemented in the backend.</p>
            </section>
          )}

          {activePage === "accuracy" && (
            <div className="stack-layout">
              <section className="panel">
                <div className="panel-heading"><div><h3>Matching overview</h3><p>Descriptive statistics for the current sample data.</p></div><span className="demo-pill"><span /> SAMPLE ONLY</span></div>
                <div className="accuracy-grid">
                  <div className="accuracy-card"><span>Total candidates</span><strong>{matches.length}</strong><small>Current records in browser state</small></div>
                  <div className="accuracy-card"><span>Verified</span><strong>{verifiedCount}</strong><small>Marked verified in demo</small></div>
                  <div className="accuracy-card"><span>Pending</span><strong>{reviewCount + uncertainCount}</strong><small>Needs review or uncertain</small></div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading"><div><h3>Confidence distribution</h3><p>How the current candidates are grouped by their demo scores.</p></div></div>
                {[
                  { label: "High · 90–100%", count: matches.filter((m) => m.confidence >= 90).length, tone: "high" },
                  { label: "Medium · 70–89%", count: matches.filter((m) => m.confidence >= 70 && m.confidence < 90).length, tone: "medium" },
                  { label: "Low · below 70%", count: matches.filter((m) => m.confidence < 70).length, tone: "low" },
                ].map((item) => (
                  <div className="distribution-row" key={item.label}>
                    <div><span>{item.label}</span><strong>{item.count}</strong></div>
                    <div className="distribution-track"><div className={`distribution-fill ${item.tone}`} style={{ width: `${matches.length ? (item.count / matches.length) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </section>
              <section className="review-note"><strong>What this page does not claim</strong><p>These counts are not precision, recall or real-world accuracy. To calculate those metrics, test predictions against a labelled dataset of confirmed matches and non-matches.</p></section>
            </div>
          )}

          <footer className="page-footer">
            <span>© 2026 Kshetra Link · Geocode Setu</span>
            <span><span className="footer-dot" /> Prototype · Sample data only</span>
          </footer>
        </div>
      </main>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}

      {selectedMatch && (
        <div className="modal-backdrop" onClick={() => setSelectedMatch(null)}>
          <section className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><div className="eyebrow">MATCH RECORD #{selectedMatch.id}</div><h2>{selectedMatch.village}</h2><p>{selectedMatch.hindi} · {selectedMatch.district}, {selectedMatch.state}</p></div>
              <button className="modal-close" onClick={() => setSelectedMatch(null)}>×</button>
            </div>
            <div className="modal-score">
              <div><span>Demo confidence score</span><strong>{selectedMatch.confidence}%</strong></div>
              <StatusBadge status={selectedMatch.status} />
            </div>
            <div className="modal-section"><h4>Linked source records</h4><div className="record-links"><div><span>SOIL</span><strong>{selectedMatch.sourceA}</strong></div><div><span>WEATHER</span><strong>{selectedMatch.sourceB}</strong></div><div><span>CROP</span><strong>{selectedMatch.sourceC}</strong></div></div></div>
            <div className="modal-section"><h4>Matching evidence</h4>{selectedMatch.evidence.map((e) => <div className="evidence-row" key={e}><span>✓</span>{e}</div>)}</div>
            <div className="review-note compact"><strong>Before confirming</strong><p>Check source identifiers and geographic boundaries. This prototype does not verify official records.</p></div>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => changeStatus(selectedMatch.id, "Uncertain")}>Flag uncertain</button>
              <button className="button button-danger" onClick={() => changeStatus(selectedMatch.id, "Needs review")}>Request review</button>
              <button className="button button-primary" onClick={() => changeStatus(selectedMatch.id, "Verified")}>✓ Verify match</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, note, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </article>
  );
}

function StatusBadge({ status }) {
  const className =
    status === "Verified"
      ? "status-verified"
      : status === "Needs review"
      ? "status-review"
      : "status-uncertain";

  return <span className={`status-badge ${className}`}><span />{status}</span>;
}

function MatchTable({ matches, onSelect }) {
  return (
    <div className="table-wrap">
      <table className="matches-table">
        <thead>
          <tr>
            <th>PLACE / ALIAS</th>
            <th>LINKED RECORDS</th>
            <th>CONFIDENCE</th>
            <th>STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td>
                <button className="place-button" onClick={() => onSelect(m)}>
                  <strong>{m.village}</strong>
                  <span>{m.hindi} · {m.district}</span>
                </button>
              </td>
              <td>
                <div className="linked-records">
                  <span title="Soil">{m.sourceA}</span>
                  <span title="Weather">{m.sourceB}</span>
                  <span title="Crop">{m.sourceC}</span>
                </div>
              </td>
              <td>
                <div className="confidence-cell">
                  <div className="confidence-label"><strong>{m.confidence}%</strong><span>{confidenceLabel(m.confidence)}</span></div>
                  <div className="confidence-track"><div className={`confidence-fill ${confidenceLabel(m.confidence).toLowerCase()}`} style={{ width: `${m.confidence}%` }} /></div>
                </div>
              </td>
              <td><StatusBadge status={m.status} /></td>
              <td><button className="row-action" onClick={() => onSelect(m)} aria-label={`View ${m.village}`}>↗</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;