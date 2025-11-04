const socket = io();

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const lineWidth = document.getElementById("lineWidth");
const clearBtn = document.getElementById("clear");

canvas.width = 900;
canvas.height = 550;

let drawing = false;
let current = {
  color: colorPicker.value,
  width: lineWidth.value,
};

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
canvas.addEventListener("mousemove", draw);

colorPicker.addEventListener("input", () => {
  current.color = colorPicker.value;
});
lineWidth.addEventListener("input", () => {
  current.width = lineWidth.value;
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear");
});

// Lắng nghe dữ liệu vẽ từ client khác
socket.on("draw", (data) => {
  drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.width, false);
});

// Lắng nghe lệnh clear
socket.on("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

let prevX, prevY;

function startDrawing(e) {
  drawing = true;
  const rect = canvas.getBoundingClientRect();
  prevX = e.clientX - rect.left;
  prevY = e.clientY - rect.top;
}

function stopDrawing() {
  drawing = false;
  prevX = null;
  prevY = null;
}

function draw(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  drawLine(prevX, prevY, x, y, current.color, current.width, true);
  prevX = x;
  prevY = y;
}

function drawLine(x0, y0, x1, y1, color, width, emit) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.closePath();

  if (!emit) return;
  socket.emit("draw", { x0, y0, x1, y1, color, width });
}
