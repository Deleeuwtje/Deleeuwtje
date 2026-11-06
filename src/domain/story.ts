export type EncounterKind = "story" | "combat" | "puzzle";
export interface StoryChoice {
  readonly id: string;
  readonly label: string;
  readonly nextSceneId: string;
  readonly rewardIds?: readonly string[];
}
export interface StoryScene {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly choices: readonly StoryChoice[];
  readonly encounter?: EncounterKind;
  readonly location: string;
}
export interface StoryDefinition {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly startSceneId: string;
  readonly scenes: readonly StoryScene[];
  readonly estimatedMinutes: number;
}
export type ValidationResult = { readonly ok: true } | { readonly ok: false; readonly errors: readonly string[] };

export function validateStory(story: StoryDefinition): ValidationResult {
  const errors: string[] = [];
  const ids = new Set(story.scenes.map((scene) => scene.id));
  if (!story.id.trim() || !story.title.trim()) errors.push("Story needs an id and title.");
  if (!ids.has(story.startSceneId)) errors.push("Start scene does not exist.");
  if (ids.size !== story.scenes.length) errors.push("Scene ids must be unique.");
  for (const scene of story.scenes) {
    if (!scene.id.trim() || !scene.title.trim() || !scene.location.trim()) errors.push("Every scene needs an id, title, and location.");
    if (scene.paragraphs.length === 0 || scene.paragraphs.some((p) => !p.trim())) errors.push("Scene text must not be empty.");
    const choices = new Set(scene.choices.map((choice) => choice.id));
    if (choices.size !== scene.choices.length) errors.push("Choice ids must be unique within a scene.");
    for (const choice of scene.choices) {
      if (!choice.id.trim() || !choice.label.trim() || !ids.has(choice.nextSceneId)) errors.push("Choice is incomplete or points to a missing scene.");
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
