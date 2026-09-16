import "./style.css";
import { loadDataSet } from "./data/loader";
import { Store } from "./state";
import { render } from "./ui/render";

const root = document.getElementById("app");
if (!root) {
  throw new Error("#app が見つかりません");
}

const dataSet = loadDataSet();
const store = new Store(dataSet);
store.subscribe(() => render(store, root));
render(store, root);
