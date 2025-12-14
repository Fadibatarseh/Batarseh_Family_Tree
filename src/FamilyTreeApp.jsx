import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { supabase } from "./supabaseClient";
import logo from "./logo.png";

export default function FamilyTreeApp() {
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);

  /* ---------------- CANVAS PAN STATE ---------------- */
  const panRef = useRef({
    x: 0,
    y: 0,
    dragging: false,
    startX: 0,
    startY: 0,
  });

  const treeViewportRef = useRef(null);
  const treeRef = useRef(null);

  /* ---------------- MERMAID INIT ---------------- */
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      flowchart: { curve: "stepAfter" },
      themeVariables: {
        primaryColor: "#ffffff",
        primaryTextColor: "#000000",
        primaryBorderColor: "#b91c1c",
        lineColor: "#555",
      },
    });
  }, []);

  useEffect(() => {
    fetchPeople();
  }, []);

  async function fetchPeople() {
    setLoading(true);
    const { data, error } = await supabase
      .from("family_members")
      .select("*");

    if (!error) {
      const obj = {};
      data.forEach((p) => (obj[p.id] = p));
      setPeople(obj);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!loading) renderTree();
  }, [people, loading]);

  /* ---------------- MERMAID RENDER ---------------- */
  async function renderTree() {
    if (!treeRef.current || Object.keys(people).length === 0) return;

    const safeID = (id) => "N_" + String(id).replace(/\W/g, "_");
    const safeText = (t) =>
      t ? String(t).replace(/[<>"]/g, "") : "";

    let chart = `flowchart TD\n`;

    chart += `classDef person fill:#fff,stroke:#b91c1c,stroke-width:2px;\n`;
    chart += `classDef marriage fill:none,stroke:none,width:0,height:0;\n`;

    /* ---- NODES ---- */
    Object.values(people).forEach((p) => {
      chart += `${safeID(p.id)}("${safeText(p.name)}<br/><small>${p.birth || ""}${p.death ? " - " + p.death : ""}</small>"):::person\n`;
    });

    /* ---- SPOUSES ---- */
    const marriages = {};
    Object.values(people).forEach((p) => {
      if (p.spouse && people[p.spouse]) {
        const a = safeID(p.id);
        const b = safeID(p.spouse);
        const key = [a, b].sort().join("_");

        if (!marriages[key]) {
          const m = `M_${key}`;
          marriages[key] = m;

          chart += `subgraph S_${key} [ ]\n`;
          chart += `direction LR\n`;
          chart += `${a} --- ${m} --- ${b}\n`;
          chart += `end\n`;
          chart += `${m}{ }:::marriage\n`;
        }
      }
    });

    /* ---- CHILDREN ---- */
    Object.values(people).forEach((p) => {
      if (Array.isArray(p.parents) && p.parents.length === 2) {
        const a = safeID(p.parents[0]);
        const b = safeID(p.parents[1]);
        const key = [a, b].sort().join("_");
        if (marriages[key]) {
          chart += `${marriages[key]} --> ${safeID(p.id)}\n`;
          return;
        }
      }
      if (Array.isArray(p.parents)) {
        p.parents.forEach((par) => {
          if (people[par]) {
            chart += `${safeID(par)} --> ${safeID(p.id)}\n`;
          }
        });
      }
    });

    treeRef.current.innerHTML = `<pre class="mermaid">${chart}</pre>`;
    await mermaid.run({ nodes: treeRef.current.querySelectorAll(".mermaid") });
  }

  /* ---------------- DRAG TO PAN ---------------- */
  function onMouseDown(e) {
    panRef.current.dragging = true;
    panRef.current.startX = e.clientX - panRef.current.x;
    panRef.current.startY = e.clientY - panRef.current.y;
    treeViewportRef.current.style.cursor = "grabbing";
  }

  function onMouseMove(e) {
    if (!panRef.current.dragging) return;
    panRef.current.x = e.clientX - panRef.current.startX;
    panRef.current.y = e.clientY - panRef.current.startY;

    treeRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px)`;
  }

  function onMouseUp() {
    panRef.current.dragging = false;
    treeViewportRef.current.style.cursor = "grab";
  }

  /* ---------------- UI ---------------- */
  return (
    <div style={styles.page}>
      <img src={logo} alt="Logo" style={styles.logo} />

      <div
        ref={treeViewportRef}
        style={styles.treeViewport}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        onMouseUp={onMouseUp}
      >
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : (
          <div ref={treeRef} style={styles.treeCanvas} />
        )}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: {
    fontFamily: "Georgia, serif",
    background: "#f4f1ea",
    minHeight: "100vh",
    padding: "20px",
  },
  logo: {
    maxWidth: "300px",
    display: "block",
    margin: "0 auto 20px",
  },
  treeViewport: {
    position: "relative",
    height: "90vh",
    overflow: "hidden",
    background: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "10px",
    cursor: "grab",
  },
  treeCanvas: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    minWidth: "2000px",
    minHeight: "2000px",
  },
};
