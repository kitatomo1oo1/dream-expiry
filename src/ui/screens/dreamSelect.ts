import { el } from "../dom";
import type { Store } from "../../state";
import { computeInitialInsight } from "../../engine/dreamLineEngine";

const START_AGE = 10;
/** 夢ごとに視覚的な差別化をつけるための色帯(意味を持たない、識別だけの目的)。 */
const BADGE_PALETTE = ["#e8b34a", "#6fbf73", "#5aa9d6", "#c97fd6", "#e08a6b", "#8a86c9", "#5ac9b0", "#d67f9e", "#a9c95a", "#7fa8e8"];

/** 夢を選ぶ画面。ホーム画面自体はカード一覧にしない、という制約のためホームの次に置く。 */
export function renderDreamSelect(store: Store): HTMLElement {
  const ds = store.ds;

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "home" }));

  const list = el("ul", { class: "dream-list" });
  const representative = ds.dreams.filter((d) => d.is_representative);
  representative.forEach((dream, index) => {
    const occupationId = dream.occupation_ids[0];
    const badge = el("span", { class: "dream-badge", style: `background:${BADGE_PALETTE[index % BADGE_PALETTE.length]}` }, [
      dream.name.charAt(0),
    ]);
    const button = el("button", { class: "dream-item", type: "button" }, [badge, dream.name]);
    button.addEventListener("click", () => {
      const initialDiscoveries = computeInitialInsight(ds, occupationId, START_AGE);
      store.setState({
        phase: "age",
        occupationId,
        age: START_AGE,
        previousAge: null,
        discoveries: initialDiscoveries,
      });
    });
    list.appendChild(el("li", {}, [button]));
  });

  return el("section", { class: "screen screen-dream-select" }, [
    backButton,
    el("h2", {}, ["夢を選ぶ"]),
    list,
  ]);
}
