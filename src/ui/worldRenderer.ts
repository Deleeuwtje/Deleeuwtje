import type { AmbientCharacter, SpriteKind, WorldPresentation, WorldTarget } from "../content/worlds";

const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 270;
const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 720;

interface Point {
  x: number;
  y: number;
}

export interface WorldRendererCallbacks {
  readonly onInteract: (target: WorldTarget) => void;
  readonly onNearChange: (target: WorldTarget | undefined) => void;
}

export class WorldRenderer {
  #context: CanvasRenderingContext2D;
  #frame = 0;
  #lastTime = 0;
  #running = false;
  #keys = new Set<string>();
  #player: Point;
  #camera: Point;
  #presentation: WorldPresentation;
  #nearby: WorldTarget | undefined;
  #walkFrame = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    presentation: WorldPresentation,
    private readonly callbacks: WorldRendererCallbacks,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("A 2D canvas context is required.");
    this.#context = context;
    context.imageSmoothingEnabled = false;
    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;
    this.#presentation = presentation;
    this.#player = { ...presentation.spawn };
    this.#camera = this.#cameraFor(this.#player);
    canvas.addEventListener("keydown", this.#onKeyDown);
    canvas.addEventListener("keyup", this.#onKeyUp);
    canvas.addEventListener("blur", this.#onBlur);
    canvas.addEventListener("pointerdown", this.#onPointerDown);
  }

  start(): void {
    this.#running = true;
    this.canvas.focus({ preventScroll: true });
    this.#frame = requestAnimationFrame(this.#tick);
  }

  destroy(): void {
    this.#running = false;
    cancelAnimationFrame(this.#frame);
    this.canvas.removeEventListener("keydown", this.#onKeyDown);
    this.canvas.removeEventListener("keyup", this.#onKeyUp);
    this.canvas.removeEventListener("blur", this.#onBlur);
    this.canvas.removeEventListener("pointerdown", this.#onPointerDown);
  }

  setPresentation(presentation: WorldPresentation): void {
    const changedTheme = presentation.theme !== this.#presentation.theme;
    this.#presentation = presentation;
    if (changedTheme) {
      this.#player = { ...presentation.spawn };
      this.#camera = this.#cameraFor(this.#player);
    }
    this.#nearby = undefined;
    this.callbacks.onNearChange(undefined);
  }

  interact(): void {
    if (this.#nearby) this.callbacks.onInteract(this.#nearby);
  }

  focus(): void {
    this.canvas.focus({ preventScroll: true });
  }

  #onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === "e" || key === "enter" || key === " ") {
      event.preventDefault();
      this.interact();
      return;
    }
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      this.#keys.add(key);
    }
  };

  #onKeyUp = (event: KeyboardEvent): void => {
    this.#keys.delete(event.key.toLowerCase());
  };

  #onBlur = (): void => {
    this.#keys.clear();
  };

  #onPointerDown = (): void => {
    this.focus();
    this.interact();
  };

  #tick = (time: number): void => {
    if (!this.#running) return;
    const elapsed = this.#lastTime === 0 ? 0 : Math.min((time - this.#lastTime) / 1000, 0.05);
    this.#lastTime = time;
    this.#move(elapsed);
    this.#draw(time);
    this.#frame = requestAnimationFrame(this.#tick);
  };

  #move(elapsed: number): void {
    let axisX = 0;
    let axisY = 0;
    if (this.#keys.has("arrowleft") || this.#keys.has("a")) axisX -= 1;
    if (this.#keys.has("arrowright") || this.#keys.has("d")) axisX += 1;
    if (this.#keys.has("arrowup") || this.#keys.has("w")) axisY -= 1;
    if (this.#keys.has("arrowdown") || this.#keys.has("s")) axisY += 1;
    if (axisX !== 0 || axisY !== 0) {
      const length = Math.hypot(axisX, axisY);
      this.#player.x = clamp(this.#player.x + (axisX / length) * 82 * elapsed, 18, WORLD_WIDTH - 18);
      this.#player.y = clamp(this.#player.y + (axisY / length) * 82 * elapsed, 34, WORLD_HEIGHT - 18);
      this.#walkFrame += elapsed * 10;
    }
    const targetCamera = this.#cameraFor(this.#player);
    this.#camera.x += (targetCamera.x - this.#camera.x) * Math.min(1, elapsed * 9);
    this.#camera.y += (targetCamera.y - this.#camera.y) * Math.min(1, elapsed * 9);
    const target = this.#presentation.target;
    const distance = Math.hypot(target.x - this.#player.x, target.y - this.#player.y);
    const nextNearby = distance < 40 ? target : undefined;
    if (nextNearby?.id !== this.#nearby?.id) {
      this.#nearby = nextNearby;
      this.callbacks.onNearChange(nextNearby);
    }
  }

  #cameraFor(point: Point): Point {
    return {
      x: clamp(point.x - VIEW_WIDTH / 2, 0, WORLD_WIDTH - VIEW_WIDTH),
      y: clamp(point.y - VIEW_HEIGHT / 2, 0, WORLD_HEIGHT - VIEW_HEIGHT),
    };
  }

  #draw(time: number): void {
    const ctx = this.#context;
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    if (this.#presentation.theme === "village") {
      drawVillageGround(ctx, this.#camera, time);
    } else {
      drawVolcanoGround(ctx, this.#camera, time);
    }

    const target = this.#presentation.target;
    const actors: Array<{ kind: SpriteKind; x: number; y: number; label?: string; active?: boolean }> = [
      ...this.#presentation.ambient.map((person) => ({
        kind: person.kind,
        x: person.x,
        y: person.y,
        label: person.label,
      })),
      { kind: target.kind, x: target.x, y: target.y, label: target.label, active: true },
      { kind: "villager", x: this.#player.x, y: this.#player.y, label: "Aven" },
    ];
    actors.sort((left, right) => left.y - right.y);
    for (const actor of actors) {
      const x = Math.round(actor.x - this.#camera.x);
      const y = Math.round(actor.y - this.#camera.y);
      if (x < -36 || x > VIEW_WIDTH + 36 || y < -46 || y > VIEW_HEIGHT + 36) continue;
      if (actor.label === "Aven") {
        drawHero(ctx, x, y, this.#walkFrame);
      } else {
        drawWorldSprite(ctx, actor.kind, x, y, time);
      }
      if (actor.active) drawInteractGlyph(ctx, x, y - 34, time, this.#nearby?.id === target.id);
    }
  }
}

function drawVillageGround(ctx: CanvasRenderingContext2D, camera: Point, time: number): void {
  ctx.fillStyle = "#5b7b4c";
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawTileNoise(ctx, camera, ["#6b8d56", "#4d6e45", "#83a561", "#385a3e"]);
  drawRiver(ctx, camera, "#458592", "#2f6575");
  drawRoad(ctx, camera, "#b49365", "#8d714f");
  drawVillageBuildings(ctx, camera);
  drawVillageTrees(ctx, camera);
  drawVillageDetails(ctx, camera, time);
}

function drawVolcanoGround(ctx: CanvasRenderingContext2D, camera: Point, time: number): void {
  ctx.fillStyle = "#352b31";
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawTileNoise(ctx, camera, ["#4b3b3c", "#352e35", "#66433c", "#26262d"]);
  drawLava(ctx, camera, time);
  drawCavePaths(ctx, camera);
  drawCaveRocks(ctx, camera);
}

function drawTileNoise(ctx: CanvasRenderingContext2D, camera: Point, colors: readonly string[]): void {
  const tile = 16;
  const startX = Math.floor(camera.x / tile) - 1;
  const startY = Math.floor(camera.y / tile) - 1;
  for (let row = startY; row < startY + VIEW_HEIGHT / tile + 3; row++) {
    for (let col = startX; col < startX + VIEW_WIDTH / tile + 3; col++) {
      const seed = Math.abs((col * 73 + row * 199 + col * row * 7) % 17);
      const screenX = col * tile - camera.x;
      const screenY = row * tile - camera.y;
      ctx.fillStyle = colors[seed % 2]!;
      ctx.fillRect(Math.floor(screenX), Math.floor(screenY), tile, tile);
      if (seed > 11) {
        ctx.fillStyle = colors[2]!;
        ctx.fillRect(Math.floor(screenX + 3), Math.floor(screenY + 6), 2, 2);
        ctx.fillRect(Math.floor(screenX + 11), Math.floor(screenY + 11), 1, 2);
      }
    }
  }
}

function drawRiver(ctx: CanvasRenderingContext2D, camera: Point, water: string, shade: string): void {
  const x = 34 - camera.x;
  const y = 464 - camera.y;
  ctx.fillStyle = shade;
  ctx.fillRect(Math.floor(x), Math.floor(y), 520, 155);
  ctx.fillStyle = water;
  ctx.fillRect(Math.floor(x + 5), Math.floor(y + 4), 510, 145);
  for (let index = 0; index < 20; index++) {
    ctx.fillStyle = index % 2 === 0 ? "#a2d3cc" : "#75b5b0";
    const waveX = x + 18 + ((index * 37) % 474);
    const waveY = y + 17 + ((index * 29) % 115);
    ctx.fillRect(Math.floor(waveX), Math.floor(waveY), 12, 2);
  }
  ctx.fillStyle = "#355c45";
  ctx.fillRect(Math.floor(35 - camera.x), Math.floor(454 - camera.y), 530, 12);
}

function drawRoad(ctx: CanvasRenderingContext2D, camera: Point, road: string, edge: string): void {
  const segments = [
    [150, 395, 1040, 395],
    [570, 230, 570, 585],
    [890, 130, 1120, 280],
  ] as const;
  ctx.lineCap = "square";
  for (const segment of segments) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(segment[0] - camera.x, segment[1] - camera.y);
    ctx.lineTo(segment[2] - camera.x, segment[3] - camera.y);
    ctx.stroke();
    ctx.strokeStyle = road;
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(segment[0] - camera.x, segment[1] - camera.y);
    ctx.lineTo(segment[2] - camera.x, segment[3] - camera.y);
    ctx.stroke();
  }
  for (let index = 0; index < 42; index++) {
    const x = 180 + (index * 67) % 900 - camera.x;
    const y = 384 + ((index * 29) % 24) - camera.y;
    ctx.fillStyle = index % 2 === 0 ? "#d4b985" : "#a98760";
    ctx.fillRect(Math.floor(x), Math.floor(y), 3, 2);
  }
}

function drawVillageBuildings(ctx: CanvasRenderingContext2D, camera: Point): void {
  drawHouse(ctx, 242 - camera.x, 218 - camera.y, "#7a4939", "#e2c58e", "#554137");
  drawHouse(ctx, 689 - camera.x, 260 - camera.y, "#6e3d36", "#d8b67d", "#463933");
  drawHouse(ctx, 926 - camera.x, 182 - camera.y, "#5b3c36", "#cda970", "#3d3430");
  drawBellTower(ctx, 775 - camera.x, 135 - camera.y);
  drawWell(ctx, 594 - camera.x, 515 - camera.y);
}

function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, roof: string, wall: string, shadow: string): void {
  ctx.fillStyle = shadow;
  ctx.fillRect(Math.floor(x + 10), Math.floor(y + 29), 76, 39);
  ctx.fillStyle = wall;
  ctx.fillRect(Math.floor(x + 4), Math.floor(y + 24), 76, 36);
  ctx.fillStyle = roof;
  ctx.fillRect(Math.floor(x), Math.floor(y + 10), 86, 18);
  ctx.fillRect(Math.floor(x + 9), Math.floor(y + 4), 68, 11);
  ctx.fillStyle = "#f3d890";
  ctx.fillRect(Math.floor(x + 18), Math.floor(y + 34), 11, 10);
  ctx.fillRect(Math.floor(x + 59), Math.floor(y + 34), 11, 10);
  ctx.fillStyle = "#65452f";
  ctx.fillRect(Math.floor(x + 38), Math.floor(y + 40), 13, 20);
  ctx.fillStyle = "#3c2b26";
  ctx.fillRect(Math.floor(x + 46), Math.floor(y + 6), 9, 14);
}

function drawBellTower(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#51483d";
  ctx.fillRect(Math.floor(x + 15), Math.floor(y + 40), 33, 86);
  ctx.fillStyle = "#79694e";
  ctx.fillRect(Math.floor(x + 11), Math.floor(y + 35), 41, 54);
  ctx.fillStyle = "#3f342e";
  ctx.fillRect(Math.floor(x + 6), Math.floor(y + 26), 51, 13);
  ctx.fillStyle = "#d7aa5e";
  ctx.fillRect(Math.floor(x + 23), Math.floor(y + 49), 17, 18);
  ctx.fillStyle = "#2d2826";
  ctx.fillRect(Math.floor(x + 27), Math.floor(y + 67), 9, 22);
  ctx.fillStyle = "#3d302d";
  ctx.fillRect(Math.floor(x + 17), Math.floor(y + 12), 31, 15);
  ctx.fillRect(Math.floor(x + 23), Math.floor(y + 4), 19, 10);
}

function drawWell(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#493f3b";
  ctx.fillRect(Math.floor(x - 17), Math.floor(y - 10), 35, 16);
  ctx.fillStyle = "#958b75";
  ctx.fillRect(Math.floor(x - 15), Math.floor(y - 13), 31, 10);
  ctx.fillStyle = "#253f4d";
  ctx.fillRect(Math.floor(x - 9), Math.floor(y - 10), 19, 5);
  ctx.fillStyle = "#6d604f";
  ctx.fillRect(Math.floor(x - 13), Math.floor(y - 29), 4, 20);
  ctx.fillRect(Math.floor(x + 10), Math.floor(y - 29), 4, 20);
  ctx.fillRect(Math.floor(x - 14), Math.floor(y - 31), 28, 4);
}

function drawVillageTrees(ctx: CanvasRenderingContext2D, camera: Point): void {
  const trees = [[103, 164], [159, 568], [473, 168], [643, 625], [1002, 534], [1160, 441], [1140, 110], [341, 92], [112, 310]] as const;
  for (const tree of trees) drawTree(ctx, tree[0] - camera.x, tree[1] - camera.y);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#3b4e35";
  ctx.fillRect(Math.floor(x - 15), Math.floor(y - 6), 30, 17);
  ctx.fillStyle = "#294430";
  ctx.fillRect(Math.floor(x - 11), Math.floor(y - 20), 22, 22);
  ctx.fillRect(Math.floor(x - 19), Math.floor(y - 14), 15, 17);
  ctx.fillRect(Math.floor(x + 5), Math.floor(y - 15), 14, 19);
  ctx.fillStyle = "#6b8950";
  ctx.fillRect(Math.floor(x - 7), Math.floor(y - 18), 13, 10);
  ctx.fillRect(Math.floor(x - 15), Math.floor(y - 10), 8, 8);
  ctx.fillStyle = "#5a4230";
  ctx.fillRect(Math.floor(x - 3), Math.floor(y), 6, 15);
}

function drawVillageDetails(ctx: CanvasRenderingContext2D, camera: Point, time: number): void {
  for (const flower of [[360, 438], [390, 450], [462, 579], [715, 534], [844, 289], [1064, 378]] as const) {
    const x = flower[0] - camera.x;
    const y = flower[1] - camera.y;
    ctx.fillStyle = "#f1d77b";
    ctx.fillRect(Math.floor(x), Math.floor(y), 3, 3);
    ctx.fillStyle = "#cc7f70";
    ctx.fillRect(Math.floor(x + 3), Math.floor(y + 2), 2, 2);
  }
  const cloudX = (time / 50) % 640 - 80;
  ctx.fillStyle = "rgba(244, 226, 186, .13)";
  ctx.fillRect(Math.floor(cloudX), 24, 46, 5);
  ctx.fillRect(Math.floor(cloudX + 9), 18, 27, 5);
}

function drawLava(ctx: CanvasRenderingContext2D, camera: Point, time: number): void {
  const x = 720 - camera.x;
  const y = 486 - camera.y;
  ctx.fillStyle = "#4e2828";
  ctx.fillRect(Math.floor(x - 12), Math.floor(y - 9), 590, 182);
  ctx.fillStyle = "#b44f32";
  ctx.fillRect(Math.floor(x), Math.floor(y), 570, 164);
  for (let index = 0; index < 20; index++) {
    const offset = Math.floor((time / 110 + index * 13) % 48);
    ctx.fillStyle = index % 2 === 0 ? "#ef9a45" : "#d86536";
    ctx.fillRect(Math.floor(x + (index * 41) % 548), Math.floor(y + 12 + ((index * 31 + offset) % 132)), 19, 4);
  }
}

function drawCavePaths(ctx: CanvasRenderingContext2D, camera: Point): void {
  ctx.fillStyle = "#67514a";
  ctx.fillRect(Math.floor(122 - camera.x), Math.floor(455 - camera.y), 620, 55);
  ctx.fillRect(Math.floor(604 - camera.x), Math.floor(143 - camera.y), 66, 330);
  ctx.fillStyle = "#8f7865";
  ctx.fillRect(Math.floor(130 - camera.x), Math.floor(461 - camera.y), 600, 40);
  ctx.fillRect(Math.floor(611 - camera.x), Math.floor(149 - camera.y), 50, 312);
  for (let index = 0; index < 31; index++) {
    ctx.fillStyle = index % 2 === 0 ? "#b8997c" : "#584841";
    ctx.fillRect(Math.floor(148 + (index * 41) % 535 - camera.x), Math.floor(470 + (index * 17) % 23 - camera.y), 4, 3);
  }
}

function drawCaveRocks(ctx: CanvasRenderingContext2D, camera: Point): void {
  const rocks = [[160, 142], [317, 248], [437, 612], [790, 124], [1020, 242], [1127, 517], [935, 625]] as const;
  for (const rock of rocks) {
    const x = rock[0] - camera.x;
    const y = rock[1] - camera.y;
    ctx.fillStyle = "#252630";
    ctx.fillRect(Math.floor(x - 16), Math.floor(y - 11), 34, 24);
    ctx.fillStyle = "#4c4143";
    ctx.fillRect(Math.floor(x - 12), Math.floor(y - 16), 25, 21);
    ctx.fillStyle = "#865040";
    ctx.fillRect(Math.floor(x - 5), Math.floor(y - 12), 10, 8);
  }
  for (const crystal of [[405, 344], [880, 214], [1007, 578]] as const) {
    const x = crystal[0] - camera.x;
    const y = crystal[1] - camera.y;
    ctx.fillStyle = "#49384e";
    ctx.fillRect(Math.floor(x - 7), Math.floor(y - 4), 14, 10);
    ctx.fillStyle = "#d97753";
    ctx.fillRect(Math.floor(x - 3), Math.floor(y - 21), 7, 22);
    ctx.fillStyle = "#ffd073";
    ctx.fillRect(Math.floor(x - 1), Math.floor(y - 17), 2, 12);
  }
}

function drawWorldSprite(ctx: CanvasRenderingContext2D, kind: SpriteKind, x: number, y: number, time: number): void {
  switch (kind) {
    case "oda":
      drawPerson(ctx, x, y, "#4a3a32", "#99644a", "#d7ab78", "#cc8a4c", time);
      return;
    case "rin":
      drawPerson(ctx, x, y, "#d1a968", "#67493d", "#efc69a", "#f2e0a9", time);
      return;
    case "traveler":
      drawPerson(ctx, x, y, "#3d4c58", "#222a31", "#c77d5e", "#b8d4d3", time);
      return;
    case "villager":
      drawPerson(ctx, x, y, "#62734d", "#4b352d", "#e5b886", "#d4c47f", time);
      return;
    case "hound":
      drawLavaHound(ctx, x, y, time);
      return;
    case "warden":
      drawWarden(ctx, x, y, time);
      return;
    case "bell":
      drawBellObject(ctx, x, y, time);
      return;
    case "well":
      drawWell(ctx, x, y);
      return;
    case "gate":
      drawStoneGate(ctx, x, y);
      return;
    case "cave":
      drawCaveEntrance(ctx, x, y, time);
      return;
    case "machine":
      drawMachine(ctx, x, y, time);
      return;
  }
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, walkFrame: number): void {
  const step = Math.floor(walkFrame) % 2;
  ctx.fillStyle = "rgba(21, 20, 18, .38)";
  ctx.fillRect(x - 8, y - 1, 17, 4);
  ctx.fillStyle = "#292b32";
  ctx.fillRect(x - 6, y - 8, 5, 8);
  ctx.fillRect(x + 2, y - 8 + step, 5, 8);
  ctx.fillStyle = "#39535a";
  ctx.fillRect(x - 7, y - 19, 15, 13);
  ctx.fillStyle = "#607c78";
  ctx.fillRect(x - 9, y - 17, 3, 10);
  ctx.fillStyle = "#cb6d4e";
  ctx.fillRect(x - 8, y - 20, 17, 3);
  ctx.fillStyle = "#e8b882";
  ctx.fillRect(x - 5, y - 28, 11, 9);
  ctx.fillStyle = "#4c382e";
  ctx.fillRect(x - 6, y - 31, 13, 5);
  ctx.fillRect(x - 7, y - 27, 3, 5);
  ctx.fillStyle = "#f6dbab";
  ctx.fillRect(x + 2, y - 25, 2, 2);
  ctx.fillStyle = "#d9a77b";
  ctx.fillRect(x + 8, y - 16, 3, 10);
  ctx.fillStyle = "#7b5b3c";
  ctx.fillRect(x + 10, y - 23, 2, 18);
}

function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, coat: string, hair: string, skin: string, accent: string, time: number): void {
  const bob = Math.floor(time / 500) % 2;
  ctx.fillStyle = "rgba(20, 18, 17, .35)";
  ctx.fillRect(x - 7, y - 1, 15, 4);
  ctx.fillStyle = "#292727";
  ctx.fillRect(x - 5, y - 8, 4, 8);
  ctx.fillRect(x + 2, y - 8 + bob, 4, 8);
  ctx.fillStyle = coat;
  ctx.fillRect(x - 7, y - 19, 15, 12);
  ctx.fillStyle = accent;
  ctx.fillRect(x - 8, y - 16, 3, 8);
  ctx.fillRect(x + 6, y - 16, 3, 8);
  ctx.fillStyle = "#45342d";
  ctx.fillRect(x - 7, y - 10, 15, 2);
  ctx.fillStyle = skin;
  ctx.fillRect(x - 5, y - 28, 11, 10);
  ctx.fillStyle = hair;
  ctx.fillRect(x - 6, y - 31, 13, 5);
  ctx.fillRect(x - 7, y - 27, 3, 6);
  ctx.fillStyle = "#f6deb1";
  ctx.fillRect(x + 2, y - 25, 2, 2);
}

function drawLavaHound(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const glow = Math.floor(time / 170) % 2;
  ctx.fillStyle = "rgba(25, 12, 11, .45)";
  ctx.fillRect(x - 16, y - 1, 31, 5);
  ctx.fillStyle = "#3a3030";
  ctx.fillRect(x - 15, y - 16, 25, 14);
  ctx.fillRect(x + 7, y - 22, 12, 15);
  ctx.fillStyle = "#9b4635";
  ctx.fillRect(x - 9, y - 14, 8, 5);
  ctx.fillRect(x + 10, y - 18, 6, 4);
  ctx.fillStyle = glow ? "#ffb34c" : "#e96b38";
  ctx.fillRect(x - 5, y - 11, 4, 3);
  ctx.fillRect(x + 11, y - 18, 3, 3);
  ctx.fillStyle = "#d8d0b2";
  ctx.fillRect(x + 16, y - 19, 5, 2);
  ctx.fillRect(x + 16, y - 15, 5, 2);
}

function drawWarden(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const glow = Math.floor(time / 120) % 2;
  ctx.fillStyle = "rgba(15, 10, 10, .55)";
  ctx.fillRect(x - 16, y, 32, 5);
  ctx.fillStyle = "#302e32";
  ctx.fillRect(x - 12, y - 35, 24, 33);
  ctx.fillRect(x - 18, y - 24, 8, 20);
  ctx.fillRect(x + 11, y - 24, 8, 20);
  ctx.fillStyle = "#79413c";
  ctx.fillRect(x - 8, y - 29, 16, 7);
  ctx.fillRect(x - 3, y - 17, 6, 12);
  ctx.fillStyle = glow ? "#ffc15a" : "#dd6a3b";
  ctx.fillRect(x - 2, y - 27, 5, 5);
  ctx.fillRect(x - 5, y - 15, 10, 3);
}

function drawBellObject(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const glint = Math.floor(time / 350) % 2;
  ctx.fillStyle = "rgba(20, 18, 17, .35)";
  ctx.fillRect(x - 12, y, 24, 4);
  ctx.fillStyle = "#6e5137";
  ctx.fillRect(x - 2, y - 28, 4, 27);
  ctx.fillStyle = "#d4a85d";
  ctx.fillRect(x - 11, y - 22, 22, 17);
  ctx.fillRect(x - 7, y - 27, 14, 7);
  ctx.fillStyle = "#594333";
  ctx.fillRect(x - 13, y - 6, 26, 4);
  ctx.fillStyle = glint ? "#fff0a5" : "#f0d270";
  ctx.fillRect(x + 5, y - 19, 3, 4);
}

function drawStoneGate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#282b2f";
  ctx.fillRect(x - 22, y - 38, 44, 39);
  ctx.fillStyle = "#71645c";
  ctx.fillRect(x - 18, y - 36, 12, 34);
  ctx.fillRect(x + 6, y - 36, 12, 34);
  ctx.fillRect(x - 21, y - 41, 42, 7);
  ctx.fillStyle = "#c68a5a";
  ctx.fillRect(x - 3, y - 28, 6, 21);
}

function drawCaveEntrance(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  ctx.fillStyle = "#1e2027";
  ctx.fillRect(x - 31, y - 43, 62, 43);
  ctx.fillStyle = "#5b4946";
  ctx.fillRect(x - 36, y - 24, 72, 24);
  ctx.fillRect(x - 25, y - 38, 51, 15);
  ctx.fillStyle = "#a85639";
  if (Math.floor(time / 250) % 2 === 0) ctx.fillRect(x - 4, y - 18, 8, 7);
}

function drawMachine(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  const turn = Math.floor(time / 180) % 4;
  ctx.fillStyle = "#302f35";
  ctx.fillRect(x - 22, y - 24, 44, 25);
  ctx.fillStyle = "#75665e";
  ctx.fillRect(x - 17, y - 31, 34, 14);
  ctx.fillStyle = "#3c3d44";
  ctx.fillRect(x - 10, y - 43, 20, 16);
  ctx.fillStyle = "#df9c54";
  ctx.fillRect(x - 5, y - 38, 10, 8);
  ctx.fillStyle = "#f6cd72";
  if (turn % 2 === 0) ctx.fillRect(x - 2, y - 36, 4, 4);
  ctx.fillStyle = "#9c7659";
  ctx.fillRect(x - 28, y - 8, 56, 6);
}

function drawInteractGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, near: boolean): void {
  const offset = Math.round(Math.sin(time / 170) * 2);
  ctx.fillStyle = near ? "#fff0b8" : "#d9a77b";
  ctx.fillRect(x - 7, y - 7 + offset, 14, 14);
  ctx.fillStyle = "#293137";
  ctx.fillRect(x - 1, y - 4 + offset, 2, 6);
  ctx.fillRect(x - 1, y + 4 + offset, 2, 2);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
