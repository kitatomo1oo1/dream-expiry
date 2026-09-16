import "./style.css";
import { loadDataSet } from "./data/loader";
import { Store } from "./state";
import { render } from "./ui/render";
import { computeInitialInsight } from "./engine/dreamLineEngine";
import { START_AGE } from "./ui/screens/dreamSelect";
import { markDreamSeen } from "./ui/seenDreams";

const root = document.getElementById("app");
if (!root) {
  throw new Error("#app が見つかりません");
}

const dataSet = loadDataSet();
const store = new Store(dataSet);
store.subscribe(() => render(store, root));

const sharedOccupationId = new URLSearchParams(window.location.search).get("dream");
const sharedOccupation = sharedOccupationId ? dataSet.occupations.find((o) => o.id === sharedOccupationId) : null;

if (sharedOccupation) {
  markDreamSeen(sharedOccupation.id);
  store.setState({
    phase: "age",
    occupationId: sharedOccupation.id,
    age: START_AGE,
    previousAge: null,
    discoveries: computeInitialInsight(dataSet, sharedOccupation.id, START_AGE),
  });
} else {
  render(store, root);
}
