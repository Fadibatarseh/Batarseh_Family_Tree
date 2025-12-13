import { useEffect, useState, useRef } from 'react';
import mermaid from "mermaid";
import { supabase } from './supabaseClient';
import logo from './logo.png';

export default function FamilyTreeApp() {
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [currentEdit, setCurrentEdit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", birth: "", death: "", img_url: "", parents: [] });
  const treeRef = useRef(null);

  // 1. INITIALIZE MERMAID
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      flowchart: { curve: 'stepAfter' },
      themeVariables: {
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        primaryBorderColor: '#b91c1c',
        lineColor: '#555',
        secondaryColor: '#f4f4f4',
        tertiaryColor: '#fff'
      }
    });
  }, []); 

  // 2. FETCH DATA FROM SUPABASE
  useEffect(() => {
    fetchPeople();
  }, []);

  async function fetchPeople() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('family_members').select('*');
      
      if (error) throw error;

      // Convert Array from DB back to Object for our app logic
      const peopleObject = {};
      data.forEach(person => {
        peopleObject[person.id] = person;
      });
      
      setPeople(peopleObject);
    } catch (error) {
      console.error("Error loading family:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // 3. RENDER TREE WHEN PEOPLE CHANGE
  useEffect(() => {
    if (!loading) renderTree();
  }, [people, loading]);

  async function renderTree() {
    if (!treeRef.current || Object.keys(people).length === 0) return;

    let chart = `flowchart TD\n`;
    chart += `classDef mainNode fill:#fff,stroke:#b91c1c,stroke-width:2px,rx:5,ry:5,color:#000,width:150px;\n`;
    chart += `linkStyle default stroke:#666,stroke-width:2px;\n`;

    Object.values(people).forEach(p => {
      const safeName = p.name.replace(/"/g, "'");
      // Use img_url from DB
      const imgTag = p.img_url 
        ? `<img src='${p.img_url}' width='60' height='60' style='border-radius:50%; object-fit:cover; margin-bottom:5px;' /><br/>` 
        : "";
      chart += `${p.id}("${imgTag}<b>${safeName}</b><br/><span style='font-size:0.8em'>${p.birth}${p.death ? ` - ${p.death}` : ""}</span>"):::mainNode\n`;
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

    treeRef.current.innerHTML = `<pre class="mermaid" style="width: 100%; height: 100%;">${chart}</pre>`;
    try {
      await mermaid.run({ nodes: treeRef.current.querySelectorAll('.mermaid') });
    } catch (error) {
      console.error("Mermaid Render Error:", error);
    }
  }

  function openEdit(id) {
    const p = people[id];
    setCurrentEdit(id);
    setForm({ ...p, parents: p.parents || [] });
    setModalOpen(true);
  }

  function openAdd() {
    setCurrentEdit(null);
    setForm({ name: "", birth: "", death: "", img_url: "", parents: [] });
    setModalOpen(true);
  }

  function toggleParent(parentId) {
    const currentParents = form.parents || [];
    if (currentParents.includes(parentId)) {
      setForm({ ...form, parents: currentParents.filter(id => id !== parentId) });
    } else {
      setForm({ ...form, parents: [...currentParents, parentId] });
    }
  }

  // 4. SAVE TO SUPABASE
  async function save() {
    // If no ID (New Person), we don't send an ID so Supabase creates one
    // If ID exists (Edit), we send it to update
    const personData = {
      name: form.name,
      birth: form.birth,
      death: form.death,
      img_url: form.img_url,
      parents: form.parents
    };

    if (currentEdit) {
      // Update existing
      const { error } = await supabase.from('family_members').update(personData).eq('id', currentEdit);
      if (error) alert("Error updating: " + error.message);
    } else {
      // Insert new
      const { error } = await supabase.from('family_members').insert([personData]);
      if (error) alert("Error adding: " + error.message);
    }

    // Refresh data from server
    await fetchPeople();
    setModalOpen(false);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Helvetica, Arial, sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src={logo} alt="Logo" style={{ width: "120px", height: "auto", marginBottom: "15px" }} />
          <h1 style={{ color: "#b91c1c", margin: "0" }}>Batarseh Family Tree</h1>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
           <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
             + Add Family Member
           </button>
        </div>

        <div style={{ 
          background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          height: "600px", overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start" 
        }}>
          {loading ? <p>Loading family data...</p> : <div ref={treeRef} style={{ minWidth: "100%" }} />}
        </div>

        <div style={{ marginTop: "40px", borderTop: "2px solid #eee", paddingTop: "20px" }}>
          <h3 style={{ color: "#444" }}>Member Database</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {Object.values(people).map(p => (
              <button 
                key={p.id} 
                onClick={() => openEdit(p.id)}
                style={{ padding: "8px 12px", background: "#fff", border: "1px solid #ddd", borderRadius: "20px", cursor: "pointer", fontSize: "0.9em", display: "flex", alignItems: "center", gap: "5px" }}
              >
                {p.img_url && <img src={p.img_url} style={{width:20, height:20, borderRadius:"50%"}} />}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "white", padding: "30px", width: "400px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "15px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: 0 }}>{currentEdit ? "Edit" : "Add"} Person</h3>

            <label style={labelStyle}>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            
            <div style={{display:"flex", gap:"10px"}}>
                <div style={{flex:1}}>
                    <label style={labelStyle}>Birth Year</label>
                    <input value={form.birth} onChange={e => setForm({ ...form, birth: e.target.value })} style={inputStyle} />
                </div>
                <div style={{flex:1}}>
                    <label style={labelStyle}>Death Year</label>
                    <input value={form.death} onChange={e => setForm({ ...form, death: e.target.value })} style={inputStyle} />
                </div>
            </div>

            <label style={labelStyle}>Image URL</label>
            <input placeholder="https://..." value={form.img_url} onChange={e => setForm({ ...form, img_url: e.target.value })} style={inputStyle} />
            
            <div>
               <label style={labelStyle}>Select Parents:</label>
               <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px", maxHeight: "150px", overflowY: "scroll", background: "#f9f9f9" }}>
                 {Object.values(people).filter(p => p.id !== currentEdit).map(p => (
                     <div key={p.id} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                       <input type="checkbox" checked={(form.parents || []).includes(p.id)} onChange={() => toggleParent(p.id)} style={{ marginRight: "8px" }} />
                       <span style={{ fontSize: "0.9em" }}>{p.name}</span>
                     </div>
                   ))}
               </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={save} style={{ flex: 1, padding: "10px", background: "#b91c1c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Save</button>
              <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: "10px", background: "#e5e7eb", color: "black", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "5px", width: "100%", boxSizing: "border-box" };
const labelStyle = { fontSize: "0.8em", fontWeight: "bold", color: "#555", display: "block", marginBottom: "5px" };
