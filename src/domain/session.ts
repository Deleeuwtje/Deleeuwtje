import type { StoryDefinition } from "./story";

export interface GameSession {
  readonly storyId: string;
  readonly currentSceneId: string;
  readonly visitedSceneIds: readonly string[];
  readonly chosenChoiceIds: readonly string[];
}
export type SessionResult = { readonly ok: true; readonly session: GameSession } | { readonly ok: false; readonly reason: string };

export function startSession(story: StoryDefinition): GameSession {
  return { storyId: story.id, currentSceneId: story.startSceneId, visitedSceneIds: [story.startSceneId], chosenChoiceIds: [] };
}

export function chooseOption(story: StoryDefinition, session: GameSession, choiceId: string): SessionResult {
  if (session.storyId !== story.id) return { ok: false, reason: "Save belongs to a different story." };
  const scene = story.scenes.find(({ id }) => id === session.currentSceneId);
  const choice = scene?.choices.find(({ id }) => id === choiceId);
  if (!scene || !choice) return { ok: false, reason: "Choice is not available in this scene." };
  return { ok: true, session: {
    ...session,
    currentSceneId: choice.nextSceneId,
    visitedSceneIds: [...session.visitedSceneIds, choice.nextSceneId],
    chosenChoiceIds: [...session.chosenChoiceIds, choice.id],
  } };
}
