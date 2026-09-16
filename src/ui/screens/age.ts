import { el } from "../dom";
import type { Store } from "../../state";
import { evaluateOccupation } from "../../engine/routeEvaluator";
import { computeDiscoveries } from "../../engine/dreamLineEngine";
import { statusLabel, expiryLabel } from "../labels";

/** DISTANCE(現在地の提示) + DISCOVER(年齢スライダーで何が変わるかを発見する)を担う画面。 */
export function renderAge(store: Store): HTMLElement {
  const state = store.getState();
  const ds = store.ds;
  const occupation = ds.occupations.find((o) => o.id === state.occupationId);
  if (!occupation) throw new Error("occupationId が未設定のまま age 画面に到達しました");
  const dream = ds.dreams.find((d) => d.occupation_ids.includes(occupation.id));

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "dreamSelect" }));

  const ageValue = el("p", { class: "age-value" }, [`${state.age}歳`]);

  const slider = el("input", {
    type: "range",
    min: "0",
    max: "100",
    step: "1",
    value: String(state.age),
    class: "age-slider",
    "aria-label": "年齢を動かして入口の変化を発見する",
  });
  slider.addEventListener("input", () => {
    const newAge = Number((slider as HTMLInputElement).value);
    const discoveries = computeDiscoveries(ds, occupation.id, state.age, newAge);
    store.setState({ previousAge: state.age, age: newAge, discoveries });
  });

  const evaluation = evaluateOccupation(ds, occupation.id, state.age);
  const statusSection = el("div", { class: "status-panel" });
  for (const route of evaluation.routes) {
    const routeBlock = el("div", { class: "route-block" }, [
      el("h3", { class: "route-name" }, [route.is_standard ? "標準ルート" : "代替ルート"]),
    ]);
    for (const step of route.steps) {
      routeBlock.appendChild(
        el("div", { class: `step-status status-${step.status}` }, [
          el("span", { class: "step-status-label" }, [statusLabel(step.status)]),
          el("span", { class: "step-expiry-label" }, [expiryLabel(step.expiry_type)]),
        ])
      );
    }
    statusSection.appendChild(routeBlock);
  }

  const container = el("section", { class: "screen screen-age" }, [
    backButton,
    el("h2", {}, [dream?.name ?? occupation.name]),
    ageValue,
    slider,
    statusSection,
  ]);

  if (state.discoveries.length > 0) {
    const discoveryBox = el("div", { class: "discovery-box", role: "status" }, [
      el("p", { class: "discovery-heading" }, ["発見"]),
    ]);
    for (const discovery of state.discoveries) {
      discoveryBox.appendChild(el("p", { class: "discovery-text" }, [discovery.text]));
    }
    container.appendChild(discoveryBox);
  }

  const nextButton = el("button", { class: "btn btn-primary", type: "button" }, ["DREAM LINEへ"]);
  nextButton.addEventListener("click", () => store.setState({ phase: "dreamline" }));
  container.appendChild(nextButton);

  return container;
}
