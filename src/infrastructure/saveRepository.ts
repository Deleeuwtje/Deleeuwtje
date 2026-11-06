import type { GameSession } from "../domain/session";
import type { StoryDefinition } from "../domain/story";

const SAVE_VERSION = 1;
interface SaveEnvelope { readonly version: typeof SAVE_VERSION; readonly session: GameSession }
export type LoadResult =
  | { readonly status: "found"; readonly session: GameSession }
  | { readonly status: "missing" | "invalid" | "unavailable" };
export interface SaveRepository {
  load(story: StoryDefinition): LoadResult;
  save(session: GameSession): boolean;
  clear(storyId: string): boolean;
}

function isSession(value: unknown, story: StoryDefinition): value is GameSession {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Partial<GameSession>;
  return data.storyId === story.id
    && typeof data.currentSceneId === "string"
    && story.scenes.some(({ id }) => id === data.currentSceneId)
    && Array.isArray(data.visitedSceneIds)
    && data.visitedSceneIds.every((id) => typeof id === "string")
    && Array.isArray(data.chosenChoiceIds)
    && data.chosenChoiceIds.every((id) => typeof id === "string");
}

export function createBrowserSaveRepository(storage: Storage | undefined): SaveRepository {
  const keyFor = (storyId: string) => `deleeuwtje.save.v${SAVE_VERSION}.${storyId}`;
  return {
    load(story) {
      if (!storage) return { status: "unavailable" };
      try {
        const raw = storage.getItem(keyFor(story.id));
        if (raw === null) return { status: "missing" };
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return { status: "invalid" };
        const envelope = parsed as Partial<SaveEnvelope>;
        if (envelope.version !== SAVE_VERSION || !isSession(envelope.session, story)) return { status: "invalid" };
        return { status: "found", session: envelope.session };
      } catch { return { status: "unavailable" }; }
    },
    save(session) {
      if (!storage) return false;
      try {
        storage.setItem(keyFor(session.storyId), JSON.stringify({ version: SAVE_VERSION, session } satisfies SaveEnvelope));
        return true;
      } catch { return false; }
    },
    clear(storyId) {
      if (!storage) return false;
      try { storage.removeItem(keyFor(storyId)); return true; }
      catch { return false; }
    },
  };
}
