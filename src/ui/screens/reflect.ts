import { el } from "../dom";
import type { Store } from "../../state";

/** REFLECT: 「夢とは何か」の答えを押し付けない。 */
export function renderReflect(store: Store): HTMLElement {
  const restartButton = el("button", { class: "btn btn-primary", type: "button" }, ["別の夢を見る"]);
  restartButton.addEventListener("click", () => store.reset());

  return el("section", { class: "screen screen-reflect" }, [
    el("h2", {}, ["REFLECT"]),
    el("p", {}, ["夢とは何か。その答えはここでは押し付けません。"]),
    el("p", {}, ["年齢を動かし、入口や例外ルートを見つけ、実在の人生を見てきました。"]),
    restartButton,
  ]);
}
