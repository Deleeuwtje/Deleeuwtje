import { GameController } from "./application/gameController";
import { villageStory, volcanoStory } from "./content/stories";
import { collectItems, completeStory, equipItem, initialProfile, type CampaignProfile, type GearItem } from "./domain/campaign";
import { type GameSession } from "./domain/session";
import type { StoryDefinition } from "./domain/story";
import { drawPixelWorld } from "./ui/pixelWorld";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error('Required app mount element "#app" was not found.');

const stories = [villageStory, volcanoStory];
const gear: readonly GearItem[] = [
  { id: "bell-shard", name: "Belscherf", slot: "charm", description: "Trilt zacht bij verborgen resonantie." },
  { id: "smith-coat", name: "Smidshuid jas", slot: "coat", description: "Oda's geharde jas; gemaakt voor hitte." },
];
const itemNames: Record<string, string> = {
  "brass-bell": "Koperen bel", "bell-shard": "Belscherf", "blue-thread": "Rindraad",
  "cinder-scale": "Asweegschaal", "river-stone": "Riviersteen", "glass-compass": "Glazen kompas",
  "smith-coat": "Smidshuid jas", "river-thread": "Rindraad", "basalt-heart": "Basaltkern",
  "moss-charm": "Mosamulet", "traveler-trust": "Vertrouwen van de reiziger",
  "warden-ember": "Wachtersvonk", "heart-of-the-mountain": "Bergkern",
};
const PROFILE_KEY = "deleeuwtje.campaign.v1";
let profile = loadProfile();
let controller: GameController | undefined;
let activeStory: StoryDefinition | undefined;

function isProfile(value: unknown): value is CampaignProfile {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<CampaignProfile>;
  const equipment = data.equipment;
  return typeof data.characterName === "string"
    && Array.isArray(data.inventory) && data.inventory.every((id) => typeof id === "string")
    && Array.isArray(data.upgrades) && data.upgrades.every((id) => typeof id === "string")
    && Array.isArray(data.completedStoryIds) && data.completedStoryIds.every((id) => typeof id === "string")
    && typeof equipment === "object" && equipment !== null
    && ["weapon", "coat", "charm"].every((slot) => {
      const itemId = equipment[slot as keyof typeof equipment];
      return itemId === null || typeof itemId === "string";
    });
}
function loadProfile(): CampaignProfile {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null");
    return isProfile(parsed) ? parsed : initialProfile;
  } catch { return initialProfile; }
}
function persistProfile(): void {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* Play continues without saves. */ }
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
function sessionKey(story: StoryDefinition): string { return `deleeuwtje.session.v1.${story.id}`; }
function readSession(story: StoryDefinition): GameSession | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(sessionKey(story)) ?? "null");
    if (typeof value !== "object" || value === null) return undefined;
    const candidate = value as Partial<GameSession>;
    if (candidate.storyId !== story.id || typeof candidate.currentSceneId !== "string"
      || !story.scenes.some((scene) => scene.id === candidate.currentSceneId)
      || !Array.isArray(candidate.visitedSceneIds) || !candidate.visitedSceneIds.every((id) => typeof id === "string")
      || !Array.isArray(candidate.chosenChoiceIds) || !candidate.chosenChoiceIds.every((id) => typeof id === "string")) return undefined;
    return candidate as GameSession;
  } catch { return undefined; }
}
function saveSession(): void {
  if (!controller || !activeStory) return;
  try { localStorage.setItem(sessionKey(activeStory), JSON.stringify(controller.session)); } catch { /* The scene remains playable. */ }
}
function renderMenu(): void {
  controller = undefined;
  activeStory = undefined;
  const completed = new Set(profile.completedStoryIds);
  root.innerHTML = `
    <main class="game-shell">
      <header class="masthead"><span class="mark" aria-hidden="true">✳</span><span class="wordmark">DELEEUWTJE <span>STUDIO</span></span><span class="status">EEN VERHAALRIJKE RPG</span></header>
      <section class="library">
        <div class="library-copy"><p class="kicker"><span></span> DE KLOKDRAGER · VERHALENREEKS</p><h1>Waar begint<br />jouw <em>reis?</em></h1><p class="intro">Volg Aven, een dorpsreparateur die ontdekt dat zelfs een vulkaan redenen heeft.</p></div>
        <div class="story-list">
          ${stories.map((story, index) => {
            const unlocked = index === 0 || completed.has(villageStory.id);
            const saved = readSession(story);
            const length = story.id === volcanoStory.id ? "4 UUR · PROLOOG SPEELBAAR" : "MAX. 1 UUR";
            return `<article class="story-card ${unlocked ? "" : "locked"}">
              <div class="card-index">AFLEVERING 0${index + 1} <span>${unlocked ? length : "VERGRENDELD"}</span></div>
              <h2>${escapeHtml(story.title)}</h2><p>${escapeHtml(story.subtitle)}</p>
              <button class="choice-button" data-start="${story.id}" ${unlocked ? "" : "disabled"}>${unlocked ? (saved ? "Ga verder" : "Begin verhaal") : "Voltooi eerst Veldhaven"}</button>
            </article>`;
          }).join("")}
        </div>
      </section>
      <section class="profile-strip"><div><span class="eyebrow">AVEN'S UITRUSTING</span><p>${profile.inventory.length ? profile.inventory.map((id) => escapeHtml(itemNames[id] ?? id)).join(" · ") : "Nog geen vondsten"}</p></div><span class="profile-name">✳ ${escapeHtml(profile.characterName)}</span></section>
      <footer class="footer"><span>GEMAAKT MET ZORG, SAMEN</span><span>BEWAARD OP DIT APPARAAT</span></footer>
    </main>`;
}
function renderStory(): void {
  if (!controller || !activeStory) return renderMenu();
  const scene = controller.currentScene;
  if (!scene) return renderMenu();
  const equipped = Object.values(profile.equipment).filter((id): id is string => id !== null).map((id) => itemNames[id] ?? id);
  root.innerHTML = `
    <main class="play-shell">
      <header class="masthead"><button class="text-button" data-back>← VERHALEN</button><span class="wordmark">${escapeHtml(activeStory.title)}</span><span class="status">${escapeHtml(scene.location)}</span></header>
      <section class="play-layout">
        <div class="world-column">
          <div class="world-frame"><canvas id="world" width="512" height="288" tabindex="0" role="img" aria-label="Pixelwereld. Focus op dit vlak en gebruik de pijltjestoetsen of WASD om Aven te bewegen."></canvas><div class="world-label">${escapeHtml(scene.location)}</div></div>
          <div class="world-hint"><span>WASD / PIJLTJES</span><span>BEWEEG AVEN</span></div>
          <aside class="gear-panel"><span class="eyebrow">UITGERUST</span><p>${equipped.length ? equipped.map(escapeHtml).join(" · ") : "Oefenzwaard · reiskleding"}</p>
            <div class="gear-actions">${gear.filter((item) => profile.inventory.includes(item.id)).map((item) => `<button class="text-button" data-equip="${item.id}">${profile.equipment[item.slot] === item.id ? "✓ " : ""}Draag ${escapeHtml(item.name)}</button>`).join("")}</div>
          </aside>
        </div>
        <article class="dialogue" aria-live="polite">
          <p class="kicker"><span></span> ${scene.encounter === "combat" ? "GEVAAR" : scene.encounter === "puzzle" ? "KIJK GOED" : "VERHAAL"}</p>
          <h1>${escapeHtml(scene.title)}</h1>
          ${scene.paragraphs.map((paragraph) => `<p class="story-text">${escapeHtml(paragraph)}</p>`).join("")}
          <div class="choices">${scene.choices.map((choice) => `<button class="choice-button" data-choice="${choice.id}">${escapeHtml(choice.label)}<span aria-hidden="true">↗</span></button>`).join("")}</div>
          <p class="save-note">Aven neemt vondsten mee naar volgende verhalen.</p>
        </article>
      </section>
      <footer class="footer"><span>AFLEVERING ${activeStory.id.startsWith("01") ? "01 / 02" : "02 / 02"}</span><span>${profile.inventory.length} VONDSTEN</span></footer>
    </main>`;
  const canvas = root.querySelector<HTMLCanvasElement>("#world");
  if (canvas) drawPixelWorld(canvas, activeStory.id === villageStory.id ? "village" : "volcano");
}
function startStory(story: StoryDefinition): void {
  activeStory = story;
  controller = new GameController(story, readSession(story));
  renderStory();
}
root.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const startId = target.closest<HTMLElement>("[data-start]")?.dataset.start;
  if (startId) {
    const story = stories.find((entry) => entry.id === startId);
    if (story) startStory(story);
    return;
  }
  const choiceId = target.closest<HTMLElement>("[data-choice]")?.dataset.choice;
  if (choiceId && controller && activeStory) {
    const sceneBefore = controller.currentScene;
    const choice = sceneBefore?.choices.find(({ id }) => id === choiceId);
    if (choice && controller.choose(choiceId)) {
      if (choice.rewardIds) profile = collectItems(profile, choice.rewardIds);
      if (sceneBefore?.id === "ending" || sceneBefore?.id === "descent") {
        profile = completeStory(profile, activeStory.id);
        persistProfile();
        try { localStorage.removeItem(sessionKey(activeStory)); } catch { /* Completion still counts in memory. */ }
        renderMenu();
      } else {
        persistProfile();
        saveSession();
        renderStory();
      }
    }
    return;
  }
  const equipId = target.closest<HTMLElement>("[data-equip]")?.dataset.equip;
  const item = gear.find(({ id }) => id === equipId);
  if (item) { profile = equipItem(profile, item); persistProfile(); renderStory(); return; }
  if (target.closest("[data-back]")) { saveSession(); renderMenu(); }
});
renderMenu();
