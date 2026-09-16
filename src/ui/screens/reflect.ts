import { el } from "../dom";
import type { Store } from "../../state";
import { getSeenDreamIds } from "../seenDreams";

async function shareDream(store: Store): Promise<void> {
  const state = store.getState();
  const ds = store.ds;
  const dream = ds.dreams.find((d) => d.occupation_ids.includes(state.occupationId ?? ""));
  const url = new URL(window.location.href);
  url.search = state.occupationId ? `?dream=${encodeURIComponent(state.occupationId)}` : "";
  const shareData = {
    title: "夢の賞味期限",
    text: dream ? `「${dream.name}」の賞味期限を確かめてみて。` : "夢の賞味期限を確かめてみて。",
    url: url.toString(),
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch {
    // ユーザーがキャンセルした場合等はクリップボードへのフォールバックも行わない
    return;
  }
  try {
    await navigator.clipboard.writeText(url.toString());
  } catch {
    // クリップボードが使えない環境では何もしない(機能を諦めるだけで、体験は壊さない)
  }
}

/** REFLECT: 「夢とは何か」の答えを押し付けない。 */
export function renderReflect(store: Store): HTMLElement {
  const ds = store.ds;
  const representativeIds = ds.dreams.filter((d) => d.is_representative).map((d) => d.occupation_ids[0]);
  const seen = getSeenDreamIds();
  const remaining = representativeIds.filter((id) => !seen.has(id)).length;

  const restartButton = el("button", { class: "btn btn-primary", type: "button" }, ["別の夢を見る"]);
  restartButton.addEventListener("click", () => store.reset());

  const shareButton = el("button", { class: "btn-link", type: "button" }, ["この夢の探索を共有する"]);
  shareButton.addEventListener("click", () => {
    void shareDream(store);
  });

  const container = el("section", { class: "screen screen-reflect" }, [
    el("h2", {}, ["REFLECT", el("span", { class: "heading-subtitle" }, ["(振り返り)"])]),
    el("p", {}, ["夢とは何か。その答えはここでは押し付けません。"]),
    el("p", {}, ["年齢を動かし、入口や例外ルートを見つけ、実在の人生を見てきました。"]),
  ]);

  if (remaining > 0) {
    container.appendChild(
      el("p", { class: "reflect-remaining" }, [`まだ見ていない夢が${remaining}個あります。`])
    );
  }

  container.appendChild(restartButton);
  container.appendChild(shareButton);

  return container;
}
