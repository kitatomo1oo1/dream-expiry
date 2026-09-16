import { el } from "../dom";
import type { Store } from "../../state";
import { getDreamLine } from "../../engine/dreamLineEngine";
import { evaluateOccupation } from "../../engine/routeEvaluator";
import { dreamLineStateLabel } from "../labels";
import type { OccupationEvaluation } from "../../types";

/**
 * この画面が表示するのは「選んだ年齢で夢が叶った」という事実ではない。
 * 年齢スライダーは「その年齢から目指し始める」という起点であり、DREAM LINEは
 * その先にある定義的な地点(たどり着くかどうかとは別の、たどり着く先の定義)。
 * 入口が開いているかどうかで、これから目指す道が開けているかを伝えるだけで、
 * 「なる」を「叶った」と混同しない。
 */
function openingLine(evaluation: OccupationEvaluation): string {
  switch (evaluation.status) {
    case "OPEN":
    case "CONDITIONAL":
      return `${evaluation.age}歳から、この夢を目指す道を歩み始めることができます。`;
    case "ALTERNATIVE_AVAILABLE":
      return `${evaluation.age}歳では標準ルートは閉じていますが、別の入口から目指し始めることができます。`;
    case "FUTURE":
      return `${evaluation.age}歳では、まだこの夢を目指し始める年齢に達していません。`;
    case "ROUTE_CLOSED":
      return `${evaluation.age}歳では、標準ルートで目指し始める道はすでに閉じています。`;
    case "UNKNOWN":
      return `${evaluation.age}歳でこの夢を目指し始められるかどうかは、確認できていません。`;
  }
}

/**
 * 「上限が見つからない」という事実だけを取り上げて「簡単」と誤読させないための注意文を
 * 表示すべきかどうか。全体の判定がOPENの場合のみ意味を持つ
 * (ROUTE_CLOSED等の場合は既にopeningLine側でその旨を伝えているため、ここでは出さない)。
 */
function shouldShowNoDeadlineCaution(evaluation: OccupationEvaluation): boolean {
  if (evaluation.status !== "OPEN") return false;
  return evaluation.routes.some((route) => route.steps.some((step) => step.expiry_type === "NO_UPPER_DEADLINE_FOUND"));
}

export function renderDreamLine(store: Store): HTMLElement {
  const state = store.getState();
  const ds = store.ds;
  const occupation = ds.occupations.find((o) => o.id === state.occupationId);
  if (!occupation) throw new Error("occupationId が未設定のまま dreamline 画面に到達しました");
  const dreamLine = getDreamLine(ds, occupation.id);
  const evaluation = evaluateOccupation(ds, occupation.id, state.age);

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "age" }));

  const container = el("section", { class: "screen screen-dreamline" }, [
    backButton,
    el("p", { class: "dreamline-transition" }, [openingLine(evaluation)]),
  ]);

  if (shouldShowNoDeadlineCaution(evaluation)) {
    container.appendChild(
      el("p", { class: "dreamline-caution" }, ["締切がないことと簡単なことは別です。"])
    );
  }

  container.appendChild(el("h2", {}, ["DREAM LINE"]));
  container.appendChild(
    el("p", { class: "dreamline-desc" }, [dreamLine?.description ?? "この夢のDREAM LINEはまだ確認できていません(UNKNOWN)。"])
  );

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

  container.appendChild(
    el("p", { class: "dreamline-transition dim" }, ["この地点に実際に立った人たちがいます。"])
  );

  const nextButton = el("button", { class: "btn btn-primary", type: "button" }, ["AFTERへ"]);
  nextButton.addEventListener("click", () => store.setState({ phase: "after" }));
  container.appendChild(nextButton);

  return container;
}
