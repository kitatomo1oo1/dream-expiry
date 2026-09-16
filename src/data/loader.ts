import dreamsRaw from "../../data/dreams.json";
import occupationsRaw from "../../data/occupations.json";
import routesData from "../../data/routes.json";
import dreamLineSeed from "../../data/dream_line_seed.json";
import dreamLineSources from "../../data/dream_line_sources.json";
import launchDreams from "../../data/launch_dreams.json";
import ruleConstantsRaw from "../../data/rule_constants.json";
import sourcesRaw from "../../data/sources.json";
import personsRaw from "../../data/persons.json";
import lifeEventsRaw from "../../data/life_events.json";

import type {
  DataSet,
  Dream,
  Occupation,
  DreamLine,
  Source,
  Person,
  LifeEvent,
  RuleConstants,
  Route,
  RouteStep,
  Rule,
} from "../types";

function buildLevelMap(): Map<string, "A" | "B"> {
  const map = new Map<string, "A" | "B">();
  for (const item of launchDreams as { id: string; level: "A" | "B" }[]) {
    map.set(item.id, item.level);
  }
  return map;
}

/**
 * data/*.json (正本) を読み込み、参照整合性を検証した DataSet を返す。
 * dream_line_seed.json / launch_dreams.json / rule_constants.json は
 * 既存の正本ファイルとして無変更のまま読み込み、必要な結合情報
 * (level, dream_line の source_ids) は dream_line_sources.json /
 * occupations.json 側から補う。
 */
export function loadDataSet(): DataSet {
  const levelMap = buildLevelMap();

  const occupations: Occupation[] = (occupationsRaw as Array<Omit<Occupation, "level">>).map((o) => ({
    ...o,
    level: levelMap.get(o.id) ?? "UNKNOWN",
  }));

  const sourceMap = dreamLineSources as Record<string, string[]>;
  const dreamLines: DreamLine[] = (dreamLineSeed as Array<{ id: string; dream_line: string; state: string }>).map(
    (d) => ({
      occupation_id: d.id,
      description: d.dream_line,
      state: d.state as DreamLine["state"],
      source_ids: sourceMap[d.id] ?? [],
    })
  );

  const dataset: DataSet = {
    dreams: dreamsRaw as Dream[],
    occupations,
    routes: (routesData as { routes: Route[] }).routes,
    steps: (routesData as { steps: RouteStep[] }).steps,
    rules: (routesData as { rules: Rule[] }).rules,
    dreamLines,
    sources: sourcesRaw as Source[],
    persons: personsRaw as Person[],
    lifeEvents: lifeEventsRaw as LifeEvent[],
    ruleConstants: ruleConstantsRaw as RuleConstants,
  };

  validateDataSet(dataset);
  return dataset;
}

/** データ間の参照整合性、および Status/ExpiryType が rule_constants.json の列に収まっているかを検証する。 */
export function validateDataSet(ds: DataSet): void {
  const occupationIds = new Set(ds.occupations.map((o) => o.id));
  for (const dream of ds.dreams) {
    for (const occId of dream.occupation_ids) {
      if (!occupationIds.has(occId)) {
        throw new Error(`Dream ${dream.id} が未知の occupation ${occId} を参照しています`);
      }
    }
  }

  const routeIds = new Set(ds.routes.map((r) => r.id));
  for (const occ of ds.occupations) {
    for (const routeId of occ.route_ids) {
      if (!routeIds.has(routeId)) {
        throw new Error(`Occupation ${occ.id} が未知の route ${routeId} を参照しています`);
      }
    }
  }

  const stepIds = new Set(ds.steps.map((s) => s.id));
  for (const route of ds.routes) {
    for (const stepId of route.step_ids) {
      if (!stepIds.has(stepId)) {
        throw new Error(`Route ${route.id} が未知の step ${stepId} を参照しています`);
      }
    }
  }

  const ruleIds = new Set(ds.rules.map((r) => r.id));
  for (const step of ds.steps) {
    for (const ruleId of step.rule_ids) {
      if (!ruleIds.has(ruleId)) {
        throw new Error(`Step ${step.id} が未知の rule ${ruleId} を参照しています`);
      }
    }
  }

  const sourceIds = new Set(ds.sources.map((s) => s.id));
  for (const rule of ds.rules) {
    for (const sid of rule.source_ids) {
      if (!sourceIds.has(sid)) {
        throw new Error(`Rule ${rule.id} が未知の source ${sid} を参照しています`);
      }
    }
  }
  for (const dreamLine of ds.dreamLines) {
    for (const sid of dreamLine.source_ids) {
      if (!sourceIds.has(sid)) {
        throw new Error(`DreamLine ${dreamLine.occupation_id} が未知の source ${sid} を参照しています`);
      }
    }
  }
  for (const person of ds.persons) {
    for (const sid of person.source_ids) {
      if (!sourceIds.has(sid)) {
        throw new Error(`Person ${person.id} が未知の source ${sid} を参照しています`);
      }
    }
  }
  for (const event of ds.lifeEvents) {
    for (const sid of event.source_ids) {
      if (!sourceIds.has(sid)) {
        throw new Error(`LifeEvent ${event.id} が未知の source ${sid} を参照しています`);
      }
    }
  }

  const personIds = new Set(ds.persons.map((p) => p.id));
  for (const event of ds.lifeEvents) {
    if (!personIds.has(event.person_id)) {
      throw new Error(`LifeEvent ${event.id} が未知の person ${event.person_id} を参照しています`);
    }
  }

  for (const rule of ds.rules) {
    if (!ds.ruleConstants.statuses.includes(rule.status)) {
      throw new Error(`Rule ${rule.id} の status "${rule.status}" は rule_constants.json に未定義です`);
    }
    if (!ds.ruleConstants.expiry_types.includes(rule.expiry_type)) {
      throw new Error(`Rule ${rule.id} の expiry_type "${rule.expiry_type}" は rule_constants.json に未定義です`);
    }
  }
}
