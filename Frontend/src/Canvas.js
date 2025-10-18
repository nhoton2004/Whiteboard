import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();
const ERASER_SIZE = 18; // cỡ tẩy (px) – bạn chỉnh tùy ý

const Canvas = ({ canvasRef, ctx, color, setElements, elements, tool }) => {
  const [isDrawing, setIsDrawing] = useState(false);

  // init canvas + DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const cssW = parent.clientWidth;
    const cssH = parent.clientHeight;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    const context = canvas.getContext("2d");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = 5;
    ctx.current = context;

    const onResize = () => {
      const cssW2 = parent.clientWidth;
      const cssH2 = parent.clientHeight;
      const dpr2 = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(cssW2 * dpr2);
      canvas.height = Math.round(cssH2 * dpr2);
      canvas.style.width = cssW2 + "px";
      canvas.style.height = cssH2 + "px";
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr2, dpr2);
      redraw();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (ctx.current) ctx.current.strokeStyle = color;
  }, [color, ctx]);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "pencil") {
      setElements((prev) => [
        ...prev,
        { offsetX, offsetY, path: [[offsetX, offsetY]], stroke: color, element: "pencil" },
      ]);
    } else if (tool === "eraser") {
      setElements((prev) => [
        ...prev,
        { offsetX, offsetY, path: [[offsetX, offsetY]], size: ERASER_SIZE, element: "eraser" },
      ]);
    } else {
      // rect | line
      setElements((prev) => [...prev, { offsetX, offsetY, stroke: color, element: tool }]);
    }
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if (tool === "rect") {
      setElements((prev) =>
        prev.map((ele, idx) =>
          idx === elements.length - 1
            ? {
                ...ele,
                width: Math.abs(offsetX - ele.offsetX),
                height: Math.abs(offsetY - ele.offsetY),
                offsetX: offsetX < ele.offsetX ? offsetX : ele.offsetX,
                offsetY: offsetY < ele.offsetY ? offsetY : ele.offsetY,
              }
            : ele
        )
      );
    } else if (tool === "line") {
      setElements((prev) =>
        prev.map((ele, idx) =>
          idx === elements.length - 1 ? { ...ele, width: offsetX, height: offsetY } : ele
        )
      );
    } else if (tool === "pencil" || tool === "eraser") {
      setElements((prev) =>
        prev.map((ele, idx) =>
          idx === elements.length - 1
            ? { ...ele, path: [...ele.path, [offsetX, offsetY]] }
            : ele
        )
      );
    }
  };

  const handleMouseUp = () => setIsDrawing(false);

  const drawEraserPath = (path, size) => {
    const c = ctx.current;
    c.save();
    c.globalCompositeOperation = "destination-out";
    c.strokeStyle = "rgba(0,0,0,1)"; // màu không quan trọng khi destination-out
    c.lineWidth = size;
    c.beginPath();
    c.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) c.lineTo(path[i][0], path[i][1]);
    c.stroke();
    c.restore();
  };

  // redraw tất cả element theo thứ tự đã vẽ
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
            strokeWidth: 5,
          })
        );
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 5,
          })
        );
      } else if (ele.element === "pencil") {
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: 5,
        });
      } else if (ele.element === "eraser") {
        drawEraserPath(ele.path, ele.size || ERASER_SIZE);
      }
    });
  };

  useLayoutEffect(() => {
    if (!ctx.current) return;
    redraw();
  }, [elements]);

  return (
    <div
      className="col-md-8 overflow-hidden border border-dark px-0 mx-auto mt-3"
      style={{ height: "500px" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Canvas;
