import { clear } from "./dom";
import type { Store } from "../state";
import { renderHome } from "./screens/home";
import { renderDreamSelect } from "./screens/dreamSelect";
import { renderAge } from "./screens/age";
import { renderDreamLine } from "./screens/dreamline";
import { renderAfter } from "./screens/after";
import { renderReflect } from "./screens/reflect";

/** IMAGINE→DISTANCE→DISCOVER→DREAM_LINE→AFTER→REFLECT の各Phaseを描画する唯一の分岐点。 */
export function render(store: Store, root: HTMLElement): void {
  const state = store.getState();
  let screen: HTMLElement;
  switch (state.phase) {
    case "home":
      screen = renderHome(store);
      break;
    case "dreamSelect":
      screen = renderDreamSelect(store);
      break;
    case "age":
      screen = renderAge(store);
      break;
    case "dreamline":
      screen = renderDreamLine(store);
      break;
    case "after":
      screen = renderAfter(store);
      break;
    case "reflect":
      screen = renderReflect(store);
      break;
  }
  clear(root);
  root.appendChild(screen);
}
