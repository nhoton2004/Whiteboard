import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

export default function Canvas({
  canvasRef, ctx, color, size, setElements, elements, tool
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });

  // khởi tạo canvas + DPR theo kích thước container
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const cssW = parent.clientWidth;
    const cssH = parent.clientHeight;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + "px";
    canvas.style.height = cssH + "px";

    const context = canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = size;
    ctx.current = context;

    const onResize = () => {
      const cssW2 = parent.clientWidth;
      const cssH2 = parent.clientHeight;
      const dpr2 = Math.max(1, window.devicePixelRatio || 1);
      canvas.width  = Math.round(cssW2 * dpr2);
      canvas.height = Math.round(cssH2 * dpr2);
      canvas.style.width  = cssW2 + "px";
      canvas.style.height = cssH2 + "px";
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr2, dpr2);
      redraw();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line
  }, []);

  // đổi màu khi đổi palette
  useEffect(() => {
    if (ctx.current) ctx.current.strokeStyle = color;
  }, [color, ctx]);

  /*** Input handlers ***/
  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pen") {
      setElements(prev => [...prev, {
        element: "pencil", offsetX, offsetY, path: [[offsetX, offsetY]],
        stroke: color, size
      }]);
    } else if (tool === "eraser") {
      setElements(prev => [...prev, {
        element: "eraser", offsetX, offsetY, path: [[offsetX, offsetY]],
        size: Math.max(8, size * 3) // tẩy to hơn nét
      }]);
    } else if (tool === "rect") {
      setElements(prev => [...prev, {
        element: "rect", offsetX, offsetY, width: 0, height: 0,
        stroke: color, size
      }]);
    } else if (tool === "line") {
      setElements(prev => [...prev, {
        element: "line", offsetX, offsetY, width: offsetX, height: offsetY,
        stroke: color, size
      }]);
    } else if (tool === "circle") {
      setElements(prev => [...prev, {
        element: "circle", cx: offsetX, cy: offsetY, r: 0,
        stroke: color, size
      }]);
    }

    setIsDrawing(true);
    setCursor({ x: offsetX, y: offsetY, visible: true });
  };

  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setCursor({ x: offsetX, y: offsetY, visible: true });
    if (!isDrawing) return;

    if (tool === "rect") {
      setElements(prev => prev.map((ele, i) =>
        i === elements.length - 1
          ? {
              ...ele,
              width: Math.abs(offsetX - ele.offsetX),
              height: Math.abs(offsetY - ele.offsetY),
              offsetX: offsetX < ele.offsetX ? offsetX : ele.offsetX,
              offsetY: offsetY < ele.offsetY ? offsetY : ele.offsetY
            }
          : ele
      ));
    } else if (tool === "line") {
      setElements(prev => prev.map((ele, i) =>
        i === elements.length - 1 ? { ...ele, width: offsetX, height: offsetY } : ele
      ));
    } else if (tool === "pen" || tool === "eraser") {
      setElements(prev => prev.map((ele, i) =>
        i === elements.length - 1
          ? { ...ele, path: [...ele.path, [offsetX, offsetY]] }
          : ele
      ));
    } else if (tool === "circle") {
      setElements(prev => prev.map((ele, i) =>
        i === elements.length - 1
          ? { ...ele, r: Math.hypot(offsetX - ele.cx, offsetY - ele.cy) }
          : ele
      ));
    }
  };

  const handleMouseUp     = () => setIsDrawing(false);
  const handleMouseLeave  = () => setCursor(c => ({ ...c, visible: false }));

  /*** Vẽ lại toàn bộ ***/
  const drawEraserPath = (path, eraserSize) => {
    const c = ctx.current;
    c.save();
    c.globalCompositeOperation = "destination-out";
    c.lineCap = "round";
    c.lineWidth = eraserSize;
    c.beginPath();
    c.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) c.lineTo(path[i][0], path[i][1]);
    c.stroke();
    c.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const roughCanvas = rough.canvas(canvas);
    ctx.current.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((ele) => {
      if (ele.element === "rect") {
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.size || size,
          })
        );
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.size || size,
          })
        );
      } else if (ele.element === "pencil") {
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: ele.size || size,
        });
      } else if (ele.element === "eraser") {
        drawEraserPath(ele.path, ele.size || Math.max(8, size * 3));
      } else if (ele.element === "circle") {
        const d = (ele.r || 0) * 2; 
        roughCanvas.draw(
          generator.circle(ele.cx, ele.cy, d, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.size || size,
          })
        );
      }
    });
  };

  useLayoutEffect(() => { if (ctx.current) redraw(); }, [elements]);

  return (
    <div
      style={{
        height: "calc(100vh - 64px)",
        position: "relative",
        background: "#fff",
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} />
      {/* nhãn con trỏ "Bạn" */}
      {cursor.visible && (
        <div style={{
          position: "absolute",
          left: cursor.x + 10,
          top: cursor.y + 10,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#0ea5e9" }} />
          <span style={{
            background:"#111827", color:"#e5e7eb",
            fontSize:12, padding:"2px 6px", borderRadius:6,
            border:"1px solid #334155"
          }}>Bạn</span>
        </div>
      )}
    </div>
  );
}
