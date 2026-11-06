let playerX = 8;
let playerY = 6;

export function drawPixelWorld(canvas: HTMLCanvasElement, chapter: "village" | "volcano"): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const tile = 32, cols = 16, rows = 9;
  const palette = chapter === "village"
    ? ["#31483d", "#3d5947", "#c49968", "#685542"]
    : ["#292b2a", "#473b35", "#8f4d32", "#bd6b3a"];
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      ctx.fillStyle = (x * 7 + y * 13 + x * y) % 11 > 7 ? palette[1]! : palette[0]!;
      ctx.fillRect(x * tile, y * tile, tile, tile);
      if ((x + y * 3) % 13 === 0) { ctx.fillStyle = palette[2]!; ctx.fillRect(x * tile + 8, y * tile + 12, 3, 3); }
    }
    // Raised planes and props overlap to suggest a three-quarter perspective.
    ctx.fillStyle = palette[3]!; ctx.fillRect(72, 46, 105, 58);
    ctx.fillStyle = palette[2]!; ctx.fillRect(78, 38, 95, 15); ctx.fillRect(102, 20, 11, 21);
    ctx.fillStyle = chapter === "village" ? "#875848" : "#a95632"; ctx.fillRect(95, 48, 60, 40);
    ctx.fillStyle = "#d9a77b"; ctx.fillRect(122, 63, 12, 25);
    ctx.fillStyle = chapter === "village" ? "#9b8a65" : "#77716a";
    ctx.fillRect(246, 76, 130, 13); ctx.fillRect(315, 89, 13, 70);
    ctx.fillStyle = chapter === "village" ? "#b4996b" : "#8d5336";
    for (let i = 0; i < 7; i++) ctx.fillRect(188 + i * 15, 152 + i * 8, 14, 7);
    for (const [x, y] of [[390, 74], [432, 128], [44, 186], [454, 220]] as const) {
      ctx.fillStyle = chapter === "village" ? "#1f352b" : "#533d35";
      ctx.fillRect(x, y - 14, 22, 32); ctx.fillRect(x + 7, y - 23, 9, 10);
      ctx.fillStyle = chapter === "village" ? "#536b49" : "#cf7542"; ctx.fillRect(x + 5, y - 9, 12, 12);
    }
    const sx = Math.max(1, Math.min(cols - 2, playerX)) * tile;
    const sy = Math.max(2, Math.min(rows - 2, playerY)) * tile;
    ctx.fillStyle = "rgba(12,16,14,.35)"; ctx.fillRect(sx + 4, sy + 22, 18, 5);
    ctx.fillStyle = "#29231e"; ctx.fillRect(sx + 7, sy + 18, 5, 8); ctx.fillRect(sx + 16, sy + 18, 5, 8);
    ctx.fillStyle = "#d9a77b"; ctx.fillRect(sx + 5, sy + 7, 18, 13);
    ctx.fillStyle = "#49372f"; ctx.fillRect(sx + 6, sy + 3, 17, 7);
    ctx.fillStyle = "#e9bd91"; ctx.fillRect(sx + 11, sy + 9, 2, 2);
  };
  canvas.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) return;
    event.preventDefault();
    if (key === "arrowup" || key === "w") playerY--;
    if (key === "arrowdown" || key === "s") playerY++;
    if (key === "arrowleft" || key === "a") playerX--;
    if (key === "arrowright" || key === "d") playerX++;
    playerX = Math.max(1, Math.min(cols - 2, playerX));
    playerY = Math.max(2, Math.min(rows - 2, playerY));
    draw();
  });
  draw();
}
