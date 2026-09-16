import { el } from "../dom";
import type { Store } from "../../state";
import { getPersonsForOccupation, getLifeEventsForPerson } from "../../engine/dreamLineEngine";
import { lifeEventTypeLabel } from "../labels";

/** AFTER: 実在人物の継続・引退・転身・挫折・復帰等を見る。成功者/失敗者に分類せず、動機・感情は推測しない。 */
export function renderAfter(store: Store): HTMLElement {
  const state = store.getState();
  const ds = store.ds;
  const occupation = ds.occupations.find((o) => o.id === state.occupationId);
  if (!occupation) throw new Error("occupationId が未設定のまま after 画面に到達しました");
  const persons = getPersonsForOccupation(ds, occupation.id);

  const backButton = el("button", { class: "btn-link", type: "button" }, ["← 戻る"]);
  backButton.addEventListener("click", () => store.setState({ phase: "dreamline" }));

  const container = el("section", { class: "screen screen-after" }, [backButton, el("h2", {}, ["AFTER"])]);

  if (persons.length === 0) {
    container.appendChild(
      el("p", { class: "after-empty" }, [
        "この夢の実在人物データはまだ検証中です(推測で埋めていません)。今後追加されます。",
      ])
    );
  } else {
    for (const person of persons) {
      const events = getLifeEventsForPerson(ds, person.id);
      const timeline = el("ol", { class: "life-event-timeline" });
      for (const event of events) {
        timeline.appendChild(
          el("li", { class: `life-event life-event-${event.type}` }, [
            el("span", { class: "life-event-date" }, [event.date ?? "日付未確認(UNKNOWN)"]),
            el("span", { class: "life-event-type" }, [lifeEventTypeLabel(event.type)]),
            el("p", { class: "life-event-desc" }, [event.description]),
          ])
        );
      }
      container.appendChild(
        el("div", { class: "person-block" }, [
          el("h3", {}, [person.name]),
          el("p", { class: "person-summary" }, [person.summary ?? ""]),
          timeline,
        ])
      );
    }
  }

  const nextButton = el("button", { class: "btn btn-primary", type: "button" }, ["REFLECTへ"]);
  nextButton.addEventListener("click", () => store.setState({ phase: "reflect" }));
  container.appendChild(nextButton);

  return container;
}
