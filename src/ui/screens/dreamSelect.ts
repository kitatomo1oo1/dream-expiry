import { el } from "../dom";
import type { Store } from "../../state";

/** 夢を選ぶ画面。ホーム画面自体はカード一覧にしない、という制約のためホームの次に置く。 */
export function renderDreamSelect(store: Store): HTMLElement {
  const ds = store.ds;

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "home" }));

  const list = el("ul", { class: "dream-list" });
  const representative = ds.dreams.filter((d) => d.is_representative);
  for (const dream of representative) {
    const occupationId = dream.occupation_ids[0];
    const button = el("button", { class: "dream-item", type: "button" }, [dream.name]);
    button.addEventListener("click", () => {
      store.setState({ phase: "age", occupationId, age: 10, previousAge: null, discoveries: [] });
    });
    list.appendChild(el("li", {}, [button]));
  }

  return el("section", { class: "screen screen-dream-select" }, [
    backButton,
    el("h2", {}, ["夢を選ぶ"]),
    list,
  ]);
}
