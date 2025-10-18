import React, { useRef, useState } from "react";
import Canvas from "./Canvas";

export default function App() {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#111111");
  const [tool, setTool] = useState("pencil");
  const [elements, setElements] = useState([]);

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          display: "flex",
          gap: 8,
          background: "#ffffffcc",
          padding: "8px 10px",
          borderRadius: 12,
          zIndex: 10,
        }}
      >
        <select value={tool} onChange={(e) => setTool(e.target.value)}>
          <option value="pencil">Pencil</option>
          <option value="line">Line</option>
          <option value="rect">Rect</option>
          <option value="eraser">Eraser</option>
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      <Canvas
        canvasRef={canvasRef}
        ctx={ctx}
        color={color}
        setElements={setElements}
        elements={elements}
        tool={tool}
      />
    </div>
  );
}
