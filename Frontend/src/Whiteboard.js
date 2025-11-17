import React, { useRef, useEffect, useState } from "react";
import socket from "./socket";
import { v4 as uuidv4 } from "uuid";

export default function Whiteboard({ user }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState("pen"); // pen | line | circle | rect | triangle | star | eraser | text
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(3);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const [zoom, setZoom] = useState(100);
  const opsRef = useRef([]);

  useEffect(() => {
    socket.on("connect", () => console.log("socket connected", socket.id));

    socket.on("sync-state", (payload) => {
      opsRef.current = payload.operations || [];
      drawAll(opsRef.current);
    });

    socket.on("draw-op", (op) => {
      opsRef.current.push(op);
      drawOp(op);
    });

    socket.on("clear", () => {
      opsRef.current = [];
      clearCanvas();
    });

    socket.on("undo", ({ op }) => {
      if (op?.id) opsRef.current = opsRef.current.filter(o => o.id !== op.id);
      else opsRef.current.pop();
      drawAll(opsRef.current);
    });

    socket.on("chat", (m) => setChat(c => [...c, m]));

    return () => {
      socket.off("sync-state");
      socket.off("draw-op");
      socket.off("clear");
      socket.off("undo");
      socket.off("chat");
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.style.width = "820px";
    canvas.style.height = "600px";
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 820 * dpr;
    canvas.height = 600 * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctxRef.current = ctx;
    drawAll(opsRef.current);
  }, []);

  const drawingRef = useRef(false);
  const currentRef = useRef(null);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function pointerDown(e) {
    drawingRef.current = true;
    const p = getPos(e);
    const op = { id: uuidv4(), type: "stroke", points: [p], color: tool === "eraser" ? "#ffffff" : color, width: Number(width), tool };
    currentRef.current = op;
  }
  function pointerMove(e) {
    const p = getPos(e);
    if (!drawingRef.current) {
      socket.emit("cursor", p);
      return;
    }
    const op = currentRef.current;
    if (!op) return;
    op.points.push(p);
    drawPartial(op);
  }
  function pointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const op = currentRef.current;
    if (!op) return;
    opsRef.current.push(op);
    socket.emit("draw-op", op);
    currentRef.current = null;
  }

  function drawOp(op) {
    const ctx = ctxRef.current;
    if (!op || !ctx) return;
    if (op.type !== "stroke") return;
    const pts = op.points;
    if (!pts || pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = op.color;
    ctx.lineWidth = op.width;
    ctx.stroke();
    ctx.closePath();
  }

  function drawPartial(op) {
    const ctx = ctxRef.current;
    const pts = op.points;
    if (!pts || pts.length < 2) return;
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = op.color;
    ctx.lineWidth = op.width;
    ctx.stroke();
    ctx.closePath();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawAll(list) {
    clearCanvas();
    for (const op of list) drawOp(op);
  }

  function handleClear() {
    opsRef.current = [];
    drawAll([]);
    socket.emit("clear");
  }

  function handleUndo() {
    socket.emit("undo");
  }

  function sendChat() {
    if (!msg.trim()) return;
    socket.emit("chat", msg);
    setMsg("");
  }

  // auto-join room-demo with username
  useEffect(() => {
    if (!user) return;
    socket.emit("join-room", { roomId: "room-demo", username: user }, (res) => {
      if (!res?.ok) alert(res?.error || "Join failed");
    });
  }, [user]);

  const colors = ["#FFEB3B", "#FFA726", "#000000", "#4CAF50", "#00BCD4", "#2196F3", "#9C27B0", "#E91E63", "#F44336"];

  return (
    <div className="whiteboard-root">
      {/* Top Header */}
      <div className="header">
        <div className="header-left">
          <h3 style={{margin: 0}}>Biểu đồ không tiêu đề</h3>
        </div>
        <div className="header-right">
          <button className="header-btn">Đang kết nối</button>
          <button className="header-btn">Người dùng</button>
          <button className="header-btn danger">Dừng</button>
          <button className="header-btn">Bật</button>
          <button className="header-btn">Alco</button>
          <button className="header-btn">Card</button>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="tool-btn" title="View mode">☰</button>
          <div className="zoom-control">
            <span>{zoom}%</span>
          </div>
          <button className="tool-btn" onClick={handleUndo}>↶</button>
          <button className="tool-btn">↷</button>
          <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')}>✏️</button>
          <button className={`tool-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')}>Text</button>
          <button className="tool-btn">🖼️</button>
          <button className="tool-btn" onClick={handleClear}>🗑️</button>
          
          {/* Color Palette */}
          <div className="color-palette">
            {colors.map(c => (
              <button 
                key={c} 
                className={`color-btn ${color === c ? 'active' : ''}`}
                style={{backgroundColor: c}}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <button className="tool-btn">⛶</button>
          <button className="tool-btn">💾</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Sidebar - Shape Tools */}
        <div className="left-sidebar">
          <div className="tool-label">Quảng, khôi</div>
          <button className={`shape-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="Line">
            <div style={{width: '100%', height: '2px', background: '#666', margin: '20px 0'}}></div>
          </button>
          <button className={`shape-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => setTool('circle')} title="Circle">
            <div style={{width: '35px', height: '35px', border: '2px solid #666', borderRadius: '50%'}}></div>
          </button>
          <button className={`shape-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => setTool('rect')} title="Rectangle">
            <div style={{display: 'flex', gap: '4px'}}>
              <div style={{width: '20px', height: '30px', border: '2px solid #666'}}></div>
              <div style={{width: '30px', height: '30px', border: '2px solid #666'}}></div>
            </div>
          </button>
          <button className={`shape-btn ${tool === 'triangle' ? 'active' : ''}`} onClick={() => setTool('triangle')} title="Triangle">
            <div style={{width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: '35px solid #666'}}></div>
          </button>
          <button className={`shape-btn ${tool === 'star' ? 'active' : ''}`} onClick={() => setTool('star')} title="Star">
            <div style={{fontSize: '30px', color: '#666'}}>★</div>
          </button>
        </div>

        {/* Canvas Area */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            onMouseDown={pointerDown}
            onMouseMove={pointerMove}
            onMouseUp={pointerUp}
            onMouseLeave={pointerUp}
            onTouchStart={pointerDown}
            onTouchMove={pointerMove}
            onTouchEnd={pointerUp}
            className="canvas"
          />
        </div>

        {/* Right Sidebar - Chat */}
        <div className="right-sidebar">
          <div className="chat">
            <div className="chat-list">
              {chat.map((m, i) => <div key={i}><strong>{m.from}</strong>: {m.text}</div>)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendChat(); }} placeholder="Nhập tin nhắn..." />
              <button onClick={sendChat}>Gửi</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
