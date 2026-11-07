import { GameController } from "./application/gameController";
import { villageStory, volcanoStory } from "./content/stories";
import { worldForScene, type WorldTarget } from "./content/worlds";
import { collectItems, completeStory, equipItem, initialProfile, type CampaignProfile, type GearItem } from "./domain/campaign";
import type { GameSession } from "./domain/session";
import type { StoryDefinition } from "./domain/story";
import { WorldRenderer } from "./ui/worldRenderer";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error('Required app mount element "#app" was not found.');

const stories = [villageStory, volcanoStory] as const;
const gear: readonly GearItem[] = [
  { id: "bell-shard", name: "Belscherf", slot: "charm", description: "Trilt zacht bij verborgen resonantie." },
  { id: "smith-coat", name: "Smidshuid jas", slot: "coat", description: "Oda's geharde jas; gemaakt voor hitte." },
];
const items: Readonly<Record<string, string>> = {
  "brass-bell": "Koperen bel", "bell-shard": "Belscherf", "blue-thread": "Rindraad",
  "cinder-scale": "Asweegschaal", "river-stone": "Riviersteen", "glass-compass": "Glazen kompas",
  "smith-coat": "Smidshuid jas", "river-thread": "Rindraad", "basalt-heart": "Basaltkern",
  "moss-charm": "Mosamulet", "traveler-trust": "Vertrouwen van de reiziger",
  "warden-ember": "Wachtersvonk", "heart-of-the-mountain": "Bergkern",
};
const profileKey = "deleeuwtje.campaign.v2";
const sessionKey = (story: StoryDefinition): string => "deleeuwtje.session.v2." + story.id;
let profile = loadProfile();
let controller: GameController | undefined;
let activeStory: StoryDefinition | undefined;
let renderer: WorldRenderer | undefined;
let dialogue: { target: WorldTarget; page: number } | undefined;
let nearby: WorldTarget | undefined;

function loadProfile(): CampaignProfile {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(profileKey) ?? "null");
    if (typeof stored === "object" && stored !== null && "inventory" in stored && "equipment" in stored) {
      return stored as CampaignProfile;
    }
  } catch {
    // A broken save starts a fresh campaign.
  }
  return initialProfile;
}

function saveProfile(): void {
  try { localStorage.setItem(profileKey, JSON.stringify(profile)); } catch { /* Current play continues. */ }
}

function loadSession(story: StoryDefinition): GameSession | undefined {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(sessionKey(story)) ?? "null");
    if (typeof stored !== "object" || stored === null) return undefined;
    const session = stored as Partial<GameSession>;
    if (session.storyId !== story.id || typeof session.currentSceneId !== "string") return undefined;
    if (!story.scenes.some((scene) => scene.id === session.currentSceneId)) return undefined;
    if (!Array.isArray(session.visitedSceneIds) || !Array.isArray(session.chosenChoiceIds)) return undefined;
    return session as GameSession;
  } catch {
    return undefined;
  }
}

function saveSession(): void {
  if (!controller || !activeStory) return;
  try { localStorage.setItem(sessionKey(activeStory), JSON.stringify(controller.session)); } catch { /* Current play continues. */ }
}

function escapeHtml(value: string): string {
  const map: Readonly<Record<string, string>> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => map[character] ?? character);
}

function startStory(story: StoryDefinition): void {
  renderer?.destroy();
  activeStory = story;
  controller = new GameController(story, loadSession(story));
  dialogue = undefined;
  nearby = undefined;
  root.innerHTML = [
    '<main class="world-game">',
    '<canvas id="world" class="world-canvas" tabindex="0" aria-label="Speelwereld. Beweeg Aven met WASD of de pijltjestoetsen. Druk dichtbij een persoon of plek op E om te praten of onderzoeken."></canvas>',
    '<div class="world-vignette" aria-hidden="true"></div>',
    '<header id="hud" class="hud"></header>',
    '<div id="nearby-prompt" class="nearby-prompt" aria-live="polite"></div>',
    '<section id="overlay" class="overlay-layer"></section>',
    '</main>',
  ].join("");

  const scene = controller.currentScene;
  const canvas = root.querySelector<HTMLCanvasElement>("#world");
  if (!scene || !canvas) throw new Error("Could not start the current scene.");

  renderer = new WorldRenderer(canvas, worldForScene(story.id, scene.id), {
    onInteract: openDialogue,
    onNearChange: (target) => {
      nearby = target;
      renderPrompt();
    },
  });
  renderHud();
  renderOverlay();
  renderer.start();
}

function renderHud(): void {
  const hud = root.querySelector<HTMLElement>("#hud");
  const scene = controller?.currentScene;
  if (!hud || !scene || !activeStory) return;
  const world = worldForScene(activeStory.id, scene.id);
  hud.innerHTML = [
    '<div class="hud-card hud-title"><span class="hud-eyebrow">DE KLOKDRAGER</span>',
    '<strong>', escapeHtml(world.placeName), '</strong><span>', escapeHtml(activeStory.title), '</span></div>',
    '<div class="hud-card hud-quest"><span class="hud-eyebrow">NU</span><strong>',
    escapeHtml(world.target.prompt), '</strong><span class="quest-dot">◆</span></div>',
    '<div class="hud-actions"><button class="hud-button" type="button" data-action="inventory">TAS <span>',
    String(profile.inventory.length), '</span></button><button class="hud-button" type="button" data-action="stories">VERHALEN</button></div>',
  ].join("");
}

function renderPrompt(): void {
  const host = root.querySelector<HTMLElement>("#nearby-prompt");
  if (!host) return;
  if (!nearby || dialogue) {
    host.innerHTML = "";
    return;
  }
  host.innerHTML = [
    '<button type="button" class="interact-button" data-action="interact"><kbd>E</kbd><span>',
    escapeHtml(nearby.prompt), '</span></button>',
  ].join("");
}

function openDialogue(target: WorldTarget): void {
  dialogue = { target, page: 0 };
  renderPrompt();
  renderOverlay();
}

function closeOverlay(): void {
  dialogue = undefined;
  renderOverlay();
  renderPrompt();
  renderer?.focus();
}

function renderOverlay(): void {
  const host = root.querySelector<HTMLElement>("#overlay");
  const scene = controller?.currentScene;
  if (!host || !scene || !activeStory) return;
  if (!dialogue) {
    host.innerHTML = "";
    return;
  }
  const hasNext = dialogue.page < scene.paragraphs.length - 1;
  const bottom = hasNext
    ? '<button class="dialogue-next" type="button" data-action="next">Verder <span aria-hidden="true">↘</span></button>'
    : '<div class="dialogue-choices">' + scene.choices.map((choice) => [
      '<button class="dialogue-choice" type="button" data-choice="', choice.id, '">',
      escapeHtml(choice.label), '<span aria-hidden="true">↗</span></button>',
    ].join("")).join("") + '</div>';

  host.innerHTML = [
    '<section class="dialogue-dock" role="dialog" aria-labelledby="speaker">',
    '<div class="portrait portrait-', dialogue.target.kind, '" aria-hidden="true"><span></span></div>',
    '<div class="dialogue-copy"><div class="dialogue-name"><span id="speaker">',
    escapeHtml(dialogue.target.speaker), '</span><small>', escapeHtml(scene.title), '</small></div>',
    '<p class="dialogue-line">', escapeHtml(scene.paragraphs[dialogue.page] ?? ""), '</p>',
    bottom, '</div></section>',
  ].join("");
}

function nextDialogue(): void {
  const scene = controller?.currentScene;
  if (!dialogue || !scene) return;
  if (dialogue.page < scene.paragraphs.length - 1) {
    dialogue = { ...dialogue, page: dialogue.page + 1 };
    renderOverlay();
  }
}

function applyChoice(choiceId: string): void {
  if (!controller || !activeStory) return;
  const previous = controller.currentScene;
  const choice = previous?.choices.find((item) => item.id === choiceId);
  if (!previous || !choice || !controller.choose(choiceId)) return;
  if (choice.rewardIds) profile = collectItems(profile, choice.rewardIds);

  if (previous.id === "ending" || previous.id === "descent") {
    profile = completeStory(profile, activeStory.id);
    saveProfile();
    try { localStorage.removeItem(sessionKey(activeStory)); } catch { /* Completion stays in memory. */ }
    showCompletion(previous.id === "ending" ? "Veldhaven heeft de nacht doorstaan." : "De rivier heeft weer een bedding.");
    return;
  }

  saveProfile();
  saveSession();
  dialogue = undefined;
  const current = controller.currentScene;
  if (!current) return;
  renderer?.setPresentation(worldForScene(activeStory.id, current.id));
  renderHud();
  renderOverlay();
  renderPrompt();
  renderer?.focus();
}

function showCompletion(message: string): void {
  const host = root.querySelector<HTMLElement>("#overlay");
  if (!host) return;
  host.innerHTML = [
    '<section class="completion-card" role="dialog" aria-label="Aflevering voltooid">',
    '<span class="hud-eyebrow">AFLEVERING VOLTOOID</span><h1>', escapeHtml(message), '</h1>',
    '<p>Avens vondsten en uitrusting blijven bewaard voor het volgende verhaal.</p>',
    '<button class="dialogue-next" type="button" data-action="stories">Bekijk verhalen <span aria-hidden="true">↗</span></button>',
    '</section>',
  ].join("");
}

function showStories(): void {
  if (!activeStory) return;
  const host = root.querySelector<HTMLElement>("#overlay");
  if (!host) return;
  const completed = new Set(profile.completedStoryIds);
  const cards = stories.map((story, index) => {
    const unlocked = index === 0 || completed.has(villageStory.id);
    const active = story.id === activeStory?.id;
    return [
      '<article class="story-menu-card', active ? ' is-active' : '', '"><span>AFLEVERING 0', String(index + 1),
      '</span><h2>', escapeHtml(story.title), '</h2><p>', escapeHtml(story.subtitle), '</p>',
      '<button type="button" class="dialogue-choice" data-start="', story.id, '" ', unlocked ? "" : "disabled", '>',
      unlocked ? (active ? "Verder spelen" : "Speel verhaal") : "Voltooi Veldhaven eerst",
      '<span aria-hidden="true">↗</span></button></article>',
    ].join("");
  }).join("");
  host.innerHTML = [
    '<section class="story-menu" role="dialog" aria-label="Verhalen"><button class="overlay-close" type="button" data-action="close">×</button>',
    '<span class="hud-eyebrow">KIES EEN VERHAAL</span><div class="story-menu-grid">', cards, '</div></section>',
  ].join("");
}

function showInventory(): void {
  const host = root.querySelector<HTMLElement>("#overlay");
  if (!host) return;
  const equipped = Object.values(profile.equipment).filter((id): id is string => id !== null);
  const controls = gear.filter((item) => profile.inventory.includes(item.id)).map((item) => [
    '<button class="dialogue-choice" type="button" data-equip="', item.id, '">',
    profile.equipment[item.slot] === item.id ? "✓ " : "", 'Draag ', escapeHtml(item.name),
    '<span aria-hidden="true">⌁</span></button>',
  ].join("")).join("");
  host.innerHTML = [
    '<section class="inventory-panel" role="dialog" aria-label="Avens tas"><button class="overlay-close" type="button" data-action="close">×</button>',
    '<span class="hud-eyebrow">AVENS TAS</span><h2>Vondsten die meegaan</h2><p class="inventory-items">',
    profile.inventory.length ? profile.inventory.map((id) => escapeHtml(items[id] ?? id)).join(" · ") : "Nog geen vondsten.",
    '</p><span class="hud-eyebrow">UITGERUST</span><p class="inventory-items">',
    equipped.length ? equipped.map((id) => escapeHtml(items[id] ?? id)).join(" · ") : "Oefenzwaard · reiskleding",
    '</p>', controls ? '<div class="equipment-controls">' + controls + '</div>' : "", '</section>',
  ].join("");
}

root.addEventListener("click", (event) => {
  const element = event.target;
  if (!(element instanceof HTMLElement)) return;
  const startId = element.closest<HTMLElement>("[data-start]")?.dataset.start;
  if (startId) {
    const story = stories.find((item) => item.id === startId);
    if (story) startStory(story);
    return;
  }
  const choiceId = element.closest<HTMLElement>("[data-choice]")?.dataset.choice;
  if (choiceId) {
    applyChoice(choiceId);
    return;
  }
  const equipId = element.closest<HTMLElement>("[data-equip]")?.dataset.equip;
  if (equipId) {
    const item = gear.find((entry) => entry.id === equipId);
    if (item) {
      profile = equipItem(profile, item);
      saveProfile();
      showInventory();
    }
    return;
  }
  const action = element.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action === "interact") renderer?.interact();
  if (action === "next") nextDialogue();
  if (action === "close") closeOverlay();
  if (action === "stories") showStories();
  if (action === "inventory") showInventory();
});

startStory(villageStory);
