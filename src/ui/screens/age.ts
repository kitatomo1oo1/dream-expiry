import { el } from "../dom";
import type { Store } from "../../state";
import type { DataSet, Occupation, Rule } from "../../types";
import { evaluateOccupation, computeStandardRouteExpiryAge, computeJourneyStory } from "../../engine/routeEvaluator";
import { computeDiscoveries, getDreamLine } from "../../engine/dreamLineEngine";
import { statusLabel, expiryLabel, buildJourneyNarrative } from "../labels";

/** ルールの根拠となる出典のうち、最も確度が低いものを返す(近似値・要検証であることを隠さない)。 */
function lowestConfidenceNote(ds: DataSet, rule: Rule | null): string | null {
  if (!rule) return null;
  const order = { low: 0, unknown: 1, medium: 2, high: 3 } as const;
  const sources = rule.source_ids.map((id) => ds.sources.find((s) => s.id === id)).filter((s) => Boolean(s));
  if (sources.length === 0) return null;
  const lowest = sources.reduce((worst, cur) => (order[cur!.confidence] < order[worst!.confidence] ? cur : worst));
  if (lowest!.confidence === "high") return null;
  return `確度:${lowest!.confidence}(${lowest!.note ?? lowest!.title})`;
}

/** 0〜100の中で、このOccupationの年齢ルールが切り替わる境界年齢を抽出する(スライダーの目盛り用)。 */
function boundaryAges(ds: DataSet, occupation: Occupation): number[] {
  const boundaries = new Set<number>();
  for (const routeId of occupation.route_ids) {
    const route = ds.routes.find((r) => r.id === routeId);
    if (!route) continue;
    for (const stepId of route.step_ids) {
      const step = ds.steps.find((s) => s.id === stepId);
      if (!step) continue;
      for (const ruleId of step.rule_ids) {
        const rule = ds.rules.find((r) => r.id === ruleId);
        if (!rule) continue;
        const cond = rule.age_condition;
        if (cond.kind === "lt" || cond.kind === "gte") boundaries.add(cond.age);
        if (cond.kind === "lte" || cond.kind === "gt") boundaries.add(cond.age + 1);
        if (cond.kind === "between") {
          boundaries.add(cond.min);
          boundaries.add(cond.max + 1);
        }
      }
    }
  }
  return Array.from(boundaries)
    .filter((age) => age > 0 && age < 100)
    .sort((a, b) => a - b);
}

/** 近接した境界年齢のラベルが重なって読めなくなるのを防ぐため、近いものは1つにまとめる。 */
function clusterBoundariesForDisplay(
  boundaries: number[],
  minGap = 4
): Array<{ label: string; position: number }> {
  const clusters: number[][] = [];
  for (const age of boundaries) {
    const current = clusters[clusters.length - 1];
    if (current && age - current[current.length - 1] < minGap) {
      current.push(age);
    } else {
      clusters.push([age]);
    }
  }
  return clusters.map((cluster) => ({
    label: cluster.length === 1 ? String(cluster[0]) : `${cluster[0]}-${cluster[cluster.length - 1]}`,
    position: cluster.reduce((sum, age) => sum + age, 0) / cluster.length,
  }));
}

/** 「この夢の賞味期限は何歳か」の見出し。標準ルートが年齢で閉じるなら年齢を、閉じないなら見つからない旨を表示する。 */
function renderExpiryHeadline(ds: DataSet, occupationId: string): HTMLElement {
  const expiryAge = computeStandardRouteExpiryAge(ds, occupationId);
  if (expiryAge === null) {
    return el("div", { class: "expiry-headline expiry-headline-none" }, [
      el("p", { class: "expiry-headline-label" }, ["この夢の賞味期限(標準ルート)"]),
      el("p", { class: "expiry-headline-value" }, ["見つかっていません"]),
      el("p", { class: "expiry-headline-note" }, ["締切がないことと簡単なことは別です。"]),
    ]);
  }
  return el("div", { class: "expiry-headline" }, [
    el("p", { class: "expiry-headline-label" }, ["この夢の賞味期限(標準ルート)"]),
    el("p", { class: "expiry-headline-value" }, [`${expiryAge}歳`]),
    el("p", { class: "expiry-headline-note" }, ["過去の制度・事例に基づく近似であり、別の入口が残っている場合もあります。"]),
  ]);
}

/** DISTANCE(現在地の提示) + DISCOVER(年齢スライダーで何が変わるかを発見する)を担う画面。 */
export function renderAge(store: Store): HTMLElement {
  const state = store.getState();
  const ds = store.ds;
  const occupation = ds.occupations.find((o) => o.id === state.occupationId);
  if (!occupation) throw new Error("occupationId が未設定のまま age 画面に到達しました");
  const dream = ds.dreams.find((d) => d.occupation_ids.includes(occupation.id));

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "dreamSelect" }));

  const ageValue = el("p", { class: "age-value" }, [
    "あなたが",
    el("span", { class: "age-value-number" }, [`${state.age}歳`]),
    "から、この夢に挑むとしたら——",
  ]);

  const boundaries = boundaryAges(ds, occupation);
  const datalistId = `age-ticks-${occupation.id}`;
  const datalist = el(
    "datalist",
    { id: datalistId },
    boundaries.map((age) => el("option", { value: String(age) }))
  );

  const slider = el("input", {
    type: "range",
    min: "0",
    max: "100",
    step: "1",
    value: String(state.age),
    class: "age-slider",
    list: datalistId,
    "aria-label": "年齢を動かして入口の変化を発見する",
  });
  slider.addEventListener("input", () => {
    const newAge = Number((slider as HTMLInputElement).value);
    const discoveries = computeDiscoveries(ds, occupation.id, state.age, newAge);
    store.setState({ previousAge: state.age, age: newAge, discoveries });
  });

  const tickRow = el(
    "div",
    { class: "age-tick-row" },
    clusterBoundariesForDisplay(boundaries).map(({ label, position }) =>
      el("span", { class: "age-tick", style: `left:${position}%` }, [label])
    )
  );

  const sliderHint = el("p", { class: "age-slider-hint" }, [
    "まずは今のあなたの年齢に合わせて、それから動かしてみましょう。",
  ]);

  const evaluation = evaluateOccupation(ds, occupation.id, state.age);
  const timelineSection = el("div", { class: "timeline-section" });
  for (const route of evaluation.routes) {
    const routeDef = ds.routes.find((r) => r.id === route.route_id);
    const timeline = el("ol", { class: "timeline" });
    const orderedSteps = [...route.steps].sort((a, b) => {
      const orderA = ds.steps.find((s) => s.id === a.step_id)?.order ?? 0;
      const orderB = ds.steps.find((s) => s.id === b.step_id)?.order ?? 0;
      return orderA - orderB;
    });
    for (const step of orderedSteps) {
      const stepDef = ds.steps.find((s) => s.id === step.step_id);
      const stepName = stepDef?.name ?? step.step_id;
      const contentChildren: (Node | string)[] = [
        el("p", { class: "step-name" }, [stepName]),
        el("span", { class: "step-status-label" }, [statusLabel(step.status)]),
        el("span", { class: "step-expiry-label" }, [expiryLabel(step.expiry_type)]),
      ];
      const description = step.matched_rule?.description;
      const confidenceNote = lowestConfidenceNote(ds, step.matched_rule);
      if (description || confidenceNote) {
        const detailChildren: (Node | string)[] = [el("summary", {}, ["詳しく見る"])];
        if (description) detailChildren.push(el("p", { class: "step-description" }, [description]));
        if (confidenceNote) detailChildren.push(el("p", { class: "step-confidence-note" }, [confidenceNote]));
        contentChildren.push(el("details", { class: "step-details" }, detailChildren));
      }
      const caution = step.matched_rule?.caution_text;
      if (caution) {
        contentChildren.push(el("p", { class: "step-caution" }, [caution]));
      }
      timeline.appendChild(
        el("li", { class: `timeline-step status-${step.status}` }, [
          el("span", { class: "timeline-node" }),
          el("div", { class: "timeline-content" }, contentChildren),
        ])
      );
    }
    timelineSection.appendChild(
      el("div", { class: "route-timeline" }, [
        el("h3", { class: "route-name" }, [routeDef?.name ?? (route.is_standard ? "標準ルート" : "代替ルート")]),
        timeline,
      ])
    );
  }

  const dreamLine = getDreamLine(ds, occupation.id);
  const story = computeJourneyStory(ds, occupation.id, state.age);
  const narrativeSentences = buildJourneyNarrative(story, state.age, dreamLine?.description ?? null);
  const storySection = el(
    "div",
    { class: `story-section ${story.reachable ? "story-reachable" : "story-unreachable"}` },
    narrativeSentences.map((sentence) => el("p", { class: "story-sentence" }, [sentence]))
  );

  const timelineDetails = el("details", { class: "timeline-details" }, [
    el("summary", {}, ["経路の詳細を見る(出典・条件)"]),
    timelineSection,
  ]);

  const container = el("section", { class: "screen screen-age" }, [
    backButton,
    el("h2", {}, [dream?.name ?? occupation.name]),
    renderExpiryHeadline(ds, occupation.id),
    ageValue,
    storySection,
    sliderHint,
    slider,
    datalist,
    tickRow,
    timelineDetails,
  ]);

  if (state.discoveries.length > 0) {
    const discoveryBox = el("div", { class: "discovery-box", role: "status" }, [
      el("p", { class: "discovery-heading" }, ["発見"]),
    ]);
    for (const discovery of state.discoveries) {
      discoveryBox.appendChild(
        el("p", { class: `discovery-text discovery-${discovery.status}` }, [discovery.text])
      );
    }
    container.appendChild(discoveryBox);
  }

  const nextButton = el("button", { class: "btn btn-primary", type: "button" }, ["DREAM LINEへ"]);
  nextButton.addEventListener("click", () => store.setState({ phase: "dreamline" }));
  container.appendChild(nextButton);

  return container;
}
