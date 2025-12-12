import { useEffect, useState, useRef } from 'react';
import mermaid from "mermaid";

export default function FamilyTreeApp() {
  const [people, setPeople] = useState({
    "1": { id: "1", name: "Grandparent", birth: "1950", death: "", img: "", parents: [], children: ["2"] },
    "2": { id: "2", name: "You", birth: "1980", death: "", img: "", parents: ["1"], children: [] }
  });
  
  const [currentEdit, setCurrentEdit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", birth: "", death: "", img: "", parentId: "" });
  const treeRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
  }, []); 

  useEffect(() => {
    renderTree();
  }, [people]);

  async function renderTree() {
    if (!treeRef.current) return;

    let chart = `flowchart TD\n`;

    Object.values(people).forEach(p => {
      const safeName = p.name.replace(/"/g, "'");
      chart += `${p.id}["${safeName}<br/>${p.birth}${p.death ? ` - ${p.death}` : ""}"]\n`;
    });

    Object.values(people).forEach(p => {
      if (p.parents && p.parents.length > 0) {
        p.parents.forEach(parId => {
          if (people[parId]) {
            chart += `${parId} --> ${p.id}\n`;
          }
        });
      }
    });

    treeRef.current.innerHTML = `<pre class="mermaid">${chart}</pre>`;
    
    try {
      await mermaid.run({
        nodes: treeRef.current.querySelectorAll('.mermaid'),
      });
    } catch (error) {
      console.error("Mermaid failed to render:", error);
    }
  }

  function openEdit(id) {
    const p = people[id];
    setCurrentEdit(id);
    setForm({ ...p, parentId: p.parents ? p.parents.join(",") : "" });
    setModalOpen(true);
  }

  function openAdd() {
    setCurrentEdit(null);
    setForm({ name: "", birth: "", death: "", img: "", parentId: "" });
    setModalOpen(true);
  }

  function save() {
    const updated = { ...people };
    const id = currentEdit || String(Date.now());
    const parentIds = form.parentId.split(',').map(s => s.trim()).filter(Boolean);
    const existing = updated[id] || { children: [] };
    
    updated[id] = { ...existing, ...form, id, parents: parentIds };
    setPeople(updated);
    setModalOpen(false);
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Family Tree</h2>
      <button onClick={openAdd} style={{ padding: "8px 16px", marginBottom: "20px" }}>Add Member</button>
      <div ref={treeRef} style={{ border: "1px solid #ccc", padding: 20, borderRadius: 10, minHeight: "200px" }} />
      <div style={{ marginTop: 20 }}>
        <h3>Member List (Click to Edit)</h3>
        {Object.values(people).map(p => (
          <button key={p.id} onClick={() => openEdit(p.id)} style={{ margin: "5px", padding: "5px 10px" }}>
            {p.name} (ID: {p.id})
          </button>
        ))}
      </div>
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 20, width: 300, borderRadius: 10, display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3>{currentEdit ? "Edit" : "Add"} Person</h3>
            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Birth Year" value={form.birth} onChange={e => setForm({ ...form, birth: e.target.value })} />
            <input placeholder="Death Year" value={form.death} onChange={e => setForm({ ...form, death: e.target.value })} />
            <label style={{fontSize: "0.8em", color: "#666"}}>Parent IDs (comma separated):</label>
            <input placeholder="e.g. 1, 2" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={save} style={{ flex: 1 }}>Save</button>
              <button onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
