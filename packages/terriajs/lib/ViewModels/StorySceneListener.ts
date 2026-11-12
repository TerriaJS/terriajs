import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import { InitSourceData } from "../Models/InitSource";
import Terria from "../Models/Terria";
import { Story } from "../ReactViews/Story/Story";

/**
 * Parameters passed to the story-scene-activated callback.
 */
interface Parameters {
  scene: Story;

  /**
   * The scene's init sources, all already applied with `terria.applyInitData`
   */
  initSources: (InitSourceData | string)[];

  terria: Terria;
}

type StorySceneActivatedListener = (params: Parameters) => void;

/**
 * Shared instance for managing story-scene-activated events
 */
const storySceneActivatedEvent = new CesiumEvent();

/**
 * Add a new listener that is called after a story scene's init sources have
 * been applied
 *
 * @returns A destroyer function to remove the listener
 */
export function addStorySceneActivatedListener(
  callback: StorySceneActivatedListener
): () => void {
  const destroyer = storySceneActivatedEvent.addEventListener(callback);
  return destroyer;
}

/**
 * @private
 * Raises a story-scene-activated event
 */
export function raiseStorySceneActivatedEvent(parameters: Parameters) {
  storySceneActivatedEvent.raiseEvent(parameters);
}
