import { chooseOption, startSession, type GameSession } from "../domain/session";
import { validateStory, type StoryDefinition } from "../domain/story";

export class GameController {
  readonly story: StoryDefinition;
  #session: GameSession;

  constructor(story: StoryDefinition, session?: GameSession) {
    const validation = validateStory(story);
    if (!validation.ok) throw new Error(`Invalid story content: ${validation.errors.join(" ")}`);
    this.story = story;
    this.#session = session ?? startSession(story);
  }
  get session(): GameSession { return this.#session; }
  get currentScene() { return this.story.scenes.find(({ id }) => id === this.#session.currentSceneId); }
  choose(choiceId: string): boolean {
    const result = chooseOption(this.story, this.#session, choiceId);
    if (!result.ok) return false;
    this.#session = result.session;
    return true;
  }
}
