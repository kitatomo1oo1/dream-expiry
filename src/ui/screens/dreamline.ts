import { el } from "../dom";
import type { Store } from "../../state";
import { getDreamLine } from "../../engine/dreamLineEngine";
import { dreamLineStateLabel } from "../labels";

/** DREAM LINE: 「なる」と「成功する」を分離する地点そのものを提示する。UIがDREAM LINEを再定義しない。 */
export function renderDreamLine(store: Store): HTMLElement {
  const state = store.getState();
  const ds = store.ds;
  const occupation = ds.occupations.find((o) => o.id === state.occupationId);
  if (!occupation) throw new Error("occupationId が未設定のまま dreamline 画面に到達しました");
  const dreamLine = getDreamLine(ds, occupation.id);

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "age" }));

  const container = el("section", { class: "screen screen-dreamline" }, [
    backButton,
    el("p", { class: "dreamline-transition" }, ["夢が叶いました。"]),
    el("p", { class: "dreamline-transition dim" }, ["……でも、人生はここで終わりません。"]),
    el("h2", {}, ["DREAM LINE"]),
    el("p", { class: "dreamline-desc" }, [dreamLine?.description ?? "この夢のDREAM LINEはまだ確認できていません(UNKNOWN)。"]),
  ]);

  if (dreamLine) {
    container.appendChild(el("p", { class: "dreamline-state" }, [dreamLineStateLabel(dreamLine.state)]));

    const sources = dreamLine.source_ids
      .map((id) => ds.sources.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (sources.length > 0) {
      const sourceList = el("ul", { class: "source-list" });
      for (const source of sources) {
        const detailParts = [source.publisher, source.applicable_cycle, `確度:${source.confidence}`]
          .filter(Boolean)
          .join(" / ");
        sourceList.appendChild(el("li", {}, [`${source.title}(${detailParts})`]));
      }
      const details = el("details", { class: "source-details" }, [
        el("summary", {}, ["出典を確認する"]),
        sourceList,
      ]);
      container.appendChild(details);
    }
  }

  const nextButton = el("button", { class: "btn btn-primary", type: "button" }, ["AFTERへ"]);
  nextButton.addEventListener("click", () => store.setState({ phase: "after" }));
  container.appendChild(nextButton);

  return container;
}
