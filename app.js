const canvas = document.querySelector("#paintCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const toolButtons = [...document.querySelectorAll(".tool-button")];
const swatches = [...document.querySelectorAll(".swatches button")];
const colorPicker = document.querySelector("#colorPicker");
const sizeSlider = document.querySelector("#sizeSlider");
const sizeValue = document.querySelector("#sizeValue");
const fillShape = document.querySelector("#fillShape");
const clearCanvas = document.querySelector("#clearCanvas");
const newCanvas = document.querySelector("#newCanvas");
const downloadImage = document.querySelector("#downloadImage");
const canvasWidth = document.querySelector("#canvasWidth");
const canvasHeight = document.querySelector("#canvasHeight");
const applyCanvasSize = document.querySelector("#applyCanvasSize");
const toolStatus = document.querySelector("#toolStatus");
const pointerStatus = document.querySelector("#pointerStatus");

const toolNames = {
  brush: "筆刷",
  eraser: "橡皮擦",
  line: "直線",
  rectangle: "矩形",
  circle: "圓形",
};

let activeTool = "brush";
let color = colorPicker.value;
let brushSize = Number(sizeSlider.value);
let isDrawing = false;
let startPoint = null;
let lastPoint = null;
let snapshot = null;

function resetCanvasBackground() {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function setTool(tool) {
  activeTool = tool;
  toolButtons.forEach((button) => {
    const isActive = button.dataset.tool === tool;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  toolStatus.textContent = `工具：${toolNames[tool]}`;
}

function setColor(nextColor) {
  color = nextColor;
  colorPicker.value = nextColor;
  swatches.forEach((button) => {
    button.classList.toggle("selected", button.dataset.color.toLowerCase() === nextColor.toLowerCase());
  });
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: Math.round((event.clientX - rect.left) * scaleX),
    y: Math.round((event.clientY - rect.top) * scaleY),
  };
}

function applyStrokeStyle() {
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : color;
  ctx.fillStyle = color;
}

function drawFreehand(from, to) {
  applyStrokeStyle();
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function drawShape(from, to) {
  applyStrokeStyle();
  const width = to.x - from.x;
  const height = to.y - from.y;

  if (activeTool === "line") {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    return;
  }

  if (activeTool === "rectangle") {
    if (fillShape.checked) {
      ctx.fillRect(from.x, from.y, width, height);
    } else {
      ctx.strokeRect(from.x, from.y, width, height);
    }
    return;
  }

  const radiusX = Math.abs(width / 2);
  const radiusY = Math.abs(height / 2);
  const centerX = from.x + width / 2;
  const centerY = from.y + height / 2;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  if (fillShape.checked) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function beginDrawing(event) {
  canvas.setPointerCapture(event.pointerId);
  isDrawing = true;
  startPoint = getPoint(event);
  lastPoint = startPoint;
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (activeTool === "brush" || activeTool === "eraser") {
    drawFreehand(startPoint, { x: startPoint.x + 0.1, y: startPoint.y + 0.1 });
  }
}

function continueDrawing(event) {
  const point = getPoint(event);
  pointerStatus.textContent = `座標：${point.x}, ${point.y}`;

  if (!isDrawing) return;

  if (activeTool === "brush" || activeTool === "eraser") {
    drawFreehand(lastPoint, point);
    lastPoint = point;
    return;
  }

  ctx.putImageData(snapshot, 0, 0);
  drawShape(startPoint, point);
}

function endDrawing(event) {
  if (!isDrawing) return;
  continueDrawing(event);
  isDrawing = false;
  startPoint = null;
  lastPoint = null;
  snapshot = null;
}

function clearCurrentCanvas() {
  resetCanvasBackground();
}

function resizeCanvas() {
  const nextWidth = Math.min(2400, Math.max(320, Number(canvasWidth.value) || 1200));
  const nextHeight = Math.min(1800, Math.max(240, Number(canvasHeight.value) || 760));
  const previous = document.createElement("canvas");
  previous.width = canvas.width;
  previous.height = canvas.height;
  previous.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  canvasWidth.value = nextWidth;
  canvasHeight.value = nextHeight;
  resetCanvasBackground();
  ctx.drawImage(previous, 0, 0);
}

function downloadCanvas() {
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = `paint-studio-${timestamp}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

toolButtons.forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

swatches.forEach((button) => {
  button.addEventListener("click", () => setColor(button.dataset.color));
});

colorPicker.addEventListener("input", (event) => setColor(event.target.value));

sizeSlider.addEventListener("input", (event) => {
  brushSize = Number(event.target.value);
  sizeValue.textContent = brushSize;
});

clearCanvas.addEventListener("click", clearCurrentCanvas);
newCanvas.addEventListener("click", clearCurrentCanvas);
applyCanvasSize.addEventListener("click", resizeCanvas);
downloadImage.addEventListener("click", downloadCanvas);

canvas.addEventListener("pointerdown", beginDrawing);
canvas.addEventListener("pointermove", continueDrawing);
canvas.addEventListener("pointerup", endDrawing);
canvas.addEventListener("pointercancel", endDrawing);
canvas.addEventListener("pointerleave", (event) => {
  pointerStatus.textContent = "座標：-";
  if (isDrawing) endDrawing(event);
});

resetCanvasBackground();
setTool(activeTool);
setColor(color);
