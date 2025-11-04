import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.6;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    socket.on("drawing", ({ x0, y0, x1, y1 }) => {
      drawLine(x0, y0, x1, y1, false);
    });

    return () => {
      socket.off("drawing");
    };
  }, []);

  const drawLine = (x0, y0, x1, y1, emit) => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    socket.emit("drawing", { x0, y0, x1, y1 });
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    drawLine(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY,
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY,
      true
    );
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}

export default Canvas;
