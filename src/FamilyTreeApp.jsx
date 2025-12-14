import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { supabase } from "./supabaseClient";
import logo from "./logo.png";

/* ===========================
   CONSTANTS
=========================== */
const STORAGE_KEY = "familyTreeViewport";

/* ===========================
   COMPONENT
=========================== */
export default function FamilyTreeApp() {
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentEdit, setCurrentEdit] = useState(null);

  /* ---------- CANVAS STATE ---------- */
  const treeViewportRef = useRef(null);
  const treeCanvasRef = useRef(null);

  const viewRef = useRef({
    x: 0,
    y: 0,
    scale: 1,
    dragging: false,
    startX: 0,
    startY: 0
  });

  /* ---------- MERMAID INIT ---------- */
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      flowchart: {
        nodeSpacing: 60,
        rankSpacing: 100
      },
      themeVariables: {
        primaryColor: "#ffffff",
        primaryBorderColor: "#b91c1c",
        primaryTextColor: "#000",
        lineColor: "#555"
      }
    });
  }, []);

  /* ---------- LOAD VIEWPORT ---------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) Object.assign(viewRef.current, JSON.parse(saved));
  }, []);

  /* ---------- SAVE VIEWPORT ---------- */
  function persistView() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewRef.current));
  }

  /* ---------- DATA ---------- */
  useEffect(() => { fetchPeople(); }, []);

  async function fetchPeople() {
    setLoading(true);
    const { data } = await supabase.from("family_members").select("*");
    const obj = {};
    data?.forEach(p => (obj[p.id] = p));
    setPeople(obj);
    setLoading(false);
  }

  /* ---------- RENDER TREE ---------- */
  useEffect(() => {
    if (!loading) renderTree();
  }, [people, loading]);

  async function renderTree() {
    if (!treeCanvasRef.current || !Object.keys(people).length) return;

    const safeID = id => "N_" + String(id).replace(/\W/g, "_");
    const safeText = t => t ? String(t).replace(/[<>"]/g, "") : "";

    let chart = "flowchart TD\n";
    chart += "classDef person fill:#fff,stroke:#b91c1c,stroke-width:2px;\n";
    chart += "classDef marriage fill:none,stroke:none,width:1px,height:1px;\n";

    /* ---- PERSON NODES ---- */
    Object.values(people).forEach(p => {
      chart += `${safeID(p.id)}("${safeText(p.name)}<br/><small>${p.birth || ""}${p.death ? " - " + p.death : ""}</small>"):::person\n`;
    });

    /* ---- MARRIAGES ---- */
    const marriages = {};
    Object.values(people).forEach(p => {
      if (p.spouse && people[p.spouse]) {
        const a = safeID(p.id);
        const b = safeID(p.spouse);
        const key = [a, b].sort().join("_");
        if (!marriages[key]) {
          marriages[key] = "M_" + key;
          chart += `subgraph SG_${key} [ ]\n`;
          chart += "direction LR\n";
          chart += `${a} --- ${marriages[key]} --- ${b}\n`;
          chart += "end\n";
          chart += `${marriages[key]}{ }:::marriage\n`;
        }
      }
    });

    /* ---- CHILDREN ---- */
    Object.values(people).forEach(p => {
      if (Array.isArray(p.parents)) {
        if (p.parents.length === 2) {
          const key = [safeID(p.parents[0]), safeID(p.parents[1])].sort().join("_");
          if (marriages[key]) {
            chart += `${marriages[key]} --> ${safeID(p.id)}\n`;
            return;
          }
        }
        p.parents.forEach(par => {
          if (people[par]) chart += `${safeID(par)} --> ${safeID(p.id)}\n`;
        });
      }
    });

    treeCanvasRef.current.innerHTML = `<pre class="mermaid">${chart}</pre>`;
    await mermaid.run({ nodes: treeCanvasRef.current.querySelectorAll(".mermaid") });
    applyTransform();
  }

  /* ---------- TRANSFORM ---------- */
  function applyTransform() {
    const { x, y, scale } = viewRef.current;
    treeCanvasRef.current.style.transform =
      `translate(${x}px, ${y}px) scale(${scale})`;
    persistView();
  }

  /* ---------- PAN ---------- */
  function panStart(e) {
    viewRef.current.dragging = true;
    viewRef.current.startX = e.clientX - viewRef.current.x;
    viewRef.current.startY = e.clientY - viewRef.current.y;
  }

  function panMove(e) {
    if (!viewRef.current.dragging) return;
    viewRef.current.x = e.clientX - viewRef.current.startX;
    viewRef.current.y = e.clientY - viewRef.current.startY;
    applyTransform();
  }

  function panEnd() {
    viewRef.current.dragging = false;
  }

  /* ---------- ZOOM ---------- */
  function onWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    viewRef.current.scale = Math.min(2, Math.max(0.3, viewRef.current.scale + delta));
    applyTransform();
  }

  /* ---------- AUTO CENTER ---------- */
  function centerOnPerson(id) {
    const node = document.getElementById("N_" + id);
    if (!node) return;
    const box = node.getBoundingClientRect();
    const vp = treeViewportRef.current.getBoundingClientRect();
    viewRef.current.x += vp.width / 2 - box.left - box.width / 2;
    viewRef.current.y += vp.height / 2 - box.top - box.height / 2;
    applyTransform();
  }

  /* ===========================
     RENDER
=========================== */
  return (
    <div style={styles.page}>
      <img src={logo} alt="Logo" style={styles.logo} />

      <div
        ref={treeViewportRef}
        style={styles.viewport}
        onMouseDown={panStart}
        onMouseMove={panMove}
        onMouseUp={panEnd}
        onMouseLeave={panEnd}
        onWheel={onWheel}
      >
        {loading ? <p>Loading…</p> : (
          <div ref={treeCanvasRef} style={styles.canvas} />
        )}
      </div>
    </div>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = {
  page: {
    background: "#f4f1ea",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "Georgia, serif"
  },
  logo: {
    display: "block",
    maxWidth: "300px",
    margin: "0 auto 20px"
  },
  viewport: {
    position: "relative",
    height: "85vh",
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    cursor: "grab"
  },
  canvas: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transformOrigin: "0 0",
    minWidth: "2500px",
    minHeight: "2500px"
  }
};
