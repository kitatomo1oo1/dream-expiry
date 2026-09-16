import { el } from "../dom";
import type { Store } from "../../state";

/** IMAGINE: 大量フォームではなく、ひとつの問いかけだけで始める。カード一覧はホームに置かない。 */
export function renderHome(store: Store): HTMLElement {
  const startButton = el("button", { class: "btn btn-primary", type: "button" }, ["はじめる"]);
  startButton.addEventListener("click", () => store.setState({ phase: "dreamSelect" }));

  return el("section", { class: "screen screen-home" }, [
    el("h1", { class: "app-title" }, ["夢の賞味期限"]),
    el("p", { class: "app-tagline" }, ["夢を選んで、年齢を動かして、何が起きるか確かめる。"]),
    el("p", { class: "app-disclaimer" }, ["(職業検索・転職・適職診断ではありません)"]),
    startButton,
  ]);
}
