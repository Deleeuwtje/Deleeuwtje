export interface StoryChoice { readonly id: string; readonly label: string; readonly nextSceneId: string }
export interface StoryScene { readonly id: string; readonly title: string; readonly paragraphs: readonly string[]; readonly choices: readonly StoryChoice[] }
export interface StoryDefinition { readonly id: string; readonly title: string; readonly startSceneId: string; readonly scenes: readonly StoryScene[] }
export type ValidationResult = { readonly ok: true } | { readonly ok: false; readonly errors: readonly string[] };

export function validateStory(story: StoryDefinition): ValidationResult {
  const errors: string[] = [];
  const sceneIds = new Set(story.scenes.map((scene) => scene.id));
  if (!story.id.trim()) errors.push("Story id must not be empty.");
  if (!story.title.trim()) errors.push("Story title must not be empty.");
  if (!sceneIds.has(story.startSceneId)) errors.push("Start scene does not exist.");
  if (sceneIds.size !== story.scenes.length) errors.push("Scene ids must be unique.");
  for (const scene of story.scenes) {
    if (!scene.id.trim() || !scene.title.trim()) errors.push("Every scene needs an id and title.");
    if (scene.paragraphs.some((paragraph) => !paragraph.trim())) errors.push("Scene paragraphs must not be empty.");
    const choiceIds = new Set(scene.choices.map((choice) => choice.id));
    if (choiceIds.size !== scene.choices.length) errors.push("Choice ids must be unique within a scene.");
    for (const choice of scene.choices) {
      if (!choice.id.trim() || !choice.label.trim()) errors.push("Every choice needs an id and label.");
      if (!sceneIds.has(choice.nextSceneId)) errors.push("A choice points to a missing scene.");
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
