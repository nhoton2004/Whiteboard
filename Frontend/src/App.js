import React, { useRef, useState } from "react";
import Canvas from "./Canvas";

// danh sách người dùng mẫu cố định chưa socket
const USERS = [
  { id: "me", name: "Bạn", color: "#0ea5e9" },
  { id: "alice", name: "Alice", color: "#ef4444" },
  { id: "bob", name: "Bob", color: "#3b82f6" },
  { id: "carol", name: "Carol", color: "#7c3aed" },
];

export default function App() {
  const canvasRef = useRef(null);
  const ctx = useRef(null);

  const [elements, setElements] = useState([]);
  const [tool, setTool] = useState("pen"); // 'pen' | 'eraser' | 'rect' | 'line' | 'circle'
  const [color, setColor] = useState("#14b8a6"); 
  const [size, setSize] = useState(4); // S=2, M=4, L=8

  const palette = [
    "#000000", "#ef4444", "#3b82f6", "#22c55e",
    "#eab308", "#7c3aed", "#f97316", "#8b5cf6"
  ];

  const Pill = ({ u }) => (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"2px 10px", borderRadius:999,
      background:"#111827", border:"1px solid #1f2937", color:"#e5e7eb"
    }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:u.color }} />
      {u.name}
    </span>
  );

  const Btn = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding:"6px 10px", borderRadius:8, cursor:"pointer",
      border:"1px solid #334155",
      background: active ? "#1f2937" : "#111827",
      color:"#e5e7eb"
    }}>{label}</button>
  );

  return (
    <div style={{ background:"#0f172a", minHeight:"100vh" }}>
      {/* Thanh công cụ trên cùng */}
      <div style={{
        position:"sticky", top:0, zIndex:50,
        padding:"10px 14px", background:"#0f172a", color:"#e5e7eb",
        borderBottom:"1px solid #1f2937"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          {/* trạng thái kết nối */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:8, height:8, background:"#22c55e", borderRadius:"50%", display:"inline-block" }} />
            <span>Đang kết nối</span>
          </div>

          {/* danh sách người dùng */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ opacity:.8 }}>Người dùng:</span>
            {USERS.map(u => <Pill key={u.id} u={u} />)}
          </div>

          <div style={{ flex:"1 1 auto" }} />

          {/* cụm điều khiển */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ opacity:.8 }}>Công cụ:</span>
            <Btn label="Bút"   active={tool==="pen"}    onClick={()=>setTool("pen")} />
            <Btn label="Tẩy"   active={tool==="eraser"} onClick={()=>setTool("eraser")} />
            <Btn label="Xóa"   active={false}           onClick={()=>setElements([])} />
            <Btn label="Vuông" active={tool==="rect"}   onClick={()=>setTool("rect")} />
            <Btn label="Đường" active={tool==="line"}   onClick={()=>setTool("line")} />
            <Btn label="Tròn"  active={tool==="circle"} onClick={()=>setTool("circle")} />

            <span style={{ opacity:.8, marginLeft:8 }}>Màu:</span>
            {palette.map(c => (
              <button key={c} onClick={()=>setColor(c)} title={c}
                style={{
                  width:18, height:18, borderRadius:4, cursor:"pointer",
                  border: color===c ? "2px solid #e5e7eb" : "1px solid #334155",
                  background:c
                }} />
            ))}

            <span style={{ opacity:.8, marginLeft:8 }}>Kích thước:</span>
            {[ [2,"S"], [4,"M"], [8,"L"] ].map(([v,lab]) => (
              <button key={lab} onClick={()=>setSize(v)} style={{
                padding:"4px 8px", borderRadius:8,
                border:"1px solid #334155",
                background: size===v ? "#1f2937" : "#111827",
                color:"#e5e7eb", cursor:"pointer"
              }}>{lab}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Vùng bảng vẽ */}
      <Canvas
        canvasRef={canvasRef}
        ctx={ctx}
        color={color}
        size={size}
        setElements={setElements}
        elements={elements}
        tool={tool}
      />
    </div>
  );
}
