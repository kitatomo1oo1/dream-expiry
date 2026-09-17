import type { Status, ExpiryType, LifeEventType, DreamLineState, JourneyStory } from "../types";

/** UI表示用の日本語ラベル。禁止事項(偽成功率・難易度点・人生ランキング)に該当しない、事実の状態説明のみを行う。 */

export function statusLabel(status: Status): string {
  switch (status) {
    case "OPEN":
      return "開いている";
    case "FUTURE":
      return "まだ先";
    case "CONDITIONAL":
      return "条件あり";
    case "ROUTE_CLOSED":
      return "閉じている";
    case "ALTERNATIVE_AVAILABLE":
      return "別の入口がある";
    case "UNKNOWN":
      return "未確認";
  }
}

/**
 * ステータスを「あなた」を主人公にした一人称の物語として語る。
 * 制度上のラベル(statusLabel/expiryLabel)だけでは、年齢スライダーを動かしても
 * 「資格要件データベースのフラグが切り替わる」だけの体験になってしまう。
 * ここでは同じ事実を、年齢を動かす行為そのものが「自分の人生を仮に生きてみる」
 * ことだと感じられるよう、当事者目線の文章として組み立てる。
 */
export function narrativeLine(status: Status, age: number, stepName: string): string {
  switch (status) {
    case "OPEN":
      return `${age}歳のあなたが今、${stepName}に挑むなら——その道はまだ開いています。`;
    case "CONDITIONAL":
      return `${age}歳のあなたは、${stepName}に挑めます。ただし、いくつかの条件が付きます。`;
    case "FUTURE":
      return `${age}歳のあなたには、${stepName}はまだ早すぎます。入口が開くのは、この先です。`;
    case "ROUTE_CLOSED":
      return `${age}歳のあなたが今、${stepName}を目指しても——この標準の道はすでに閉ざされています。`;
    case "ALTERNATIVE_AVAILABLE":
      return `${age}歳のあなたには、${stepName}という標準の道は閉ざされています。ただし、別の道が残っています。`;
    case "UNKNOWN":
      return `${age}歳のあなたが${stepName}に挑めるかどうかは、まだ確かめられていません。`;
  }
}

/**
 * Statusごとに「挑める」ことの確信度合いを変えた動詞句。CONDITIONAL/UNKNOWNを
 * OPENと同じ調子で語ると、「閉じてはいないが非常に狭い」実情を過信させてしまう
 * (例: プロサッカー選手を44歳から目指す場合、育成年代からの入口ではなく
 * 社会人リーグ経由のトライアウトという極めて狭い道になる)。
 */
function reachPhrase(status: Status, stepName: string): string {
  switch (status) {
    case "CONDITIONAL":
      return `条件付きで${stepName}に挑めます`;
    case "UNKNOWN":
      return `${stepName}に挑めるかどうかは、確認できていません`;
    default:
      return `${stepName}に挑めます`;
  }
}

/**
 * 「賞味期限内であるからには、夢をかなえる道筋がある」という前提のもと、
 * startAgeからDREAM LINEまでのJourneyStoryを、一連の物語として文章化する。
 * 単発のStatus表示ではなく、次に何歳で何が起きて、最終的にどこへ辿り着くかを繋げる。
 */
export function buildJourneyNarrative(
  story: JourneyStory,
  startAge: number,
  dreamLineDescription: string | null
): string[] {
  const sentences: string[] = [];

  story.beats.forEach((beat, index) => {
    if (story.used_alternative && index === story.standard_beats_count) {
      sentences.push(`標準ルートはこの年齢では閉じていますが、${story.route_name}という別の入口が残っています。`);
    }

    const previousAge = index === 0 ? startAge : story.beats[index - 1].age;
    const phrase = reachPhrase(beat.status, beat.step_name);

    if (index === 0) {
      if (beat.age === startAge) {
        sentences.push(`${startAge}歳の今、${phrase}。`);
      } else {
        sentences.push(`${startAge}歳の今はまだ${beat.step_name}に挑めません。${beat.age}歳になれば、${phrase}。`);
      }
    } else if (beat.age === previousAge) {
      sentences.push(`同時に、${phrase}。`);
    } else {
      sentences.push(`そこから${beat.age}歳で、${phrase}。`);
    }
  });

  const hasCaveat =
    story.used_alternative || story.beats.some((b) => b.status === "CONDITIONAL" || b.status === "UNKNOWN");

  if (story.reachable && dreamLineDescription && hasCaveat) {
    sentences.push(
      `そして、${dreamLineDescription}という地点に辿り着く道が、確かにあります。ただしその道は、誰にでも同じように開いているわけではありません。これが、${startAge}歳から始めるあなたの物語です。`
    );
  } else if (story.reachable && dreamLineDescription) {
    sentences.push(`そして、${dreamLineDescription}という地点に辿り着きます。これが、${startAge}歳から始めるあなたの物語です。`);
  } else if (!story.reachable && sentences.length === 0) {
    sentences.push(`${startAge}歳の今、確認できている入口が見つかりません。`);
  } else if (!story.reachable) {
    sentences.push("そこから先は、確認できている入口が見つかりませんでした。");
  }

  return sentences;
}

export function expiryLabel(expiry: ExpiryType): string {
  switch (expiry) {
    case "HARD":
      return "厳格な期限";
    case "ROUTE":
      return "ルート固有の期限";
    case "CONDITIONAL":
      return "条件付きの期限";
    case "DYNAMIC":
      return "変動する基準";
    case "NO_UPPER_DEADLINE_FOUND":
      return "年齢による正式な上限が見つからない";
    case "UNKNOWN":
      return "期限は未確認";
  }
}

export function lifeEventTypeLabel(type: LifeEventType): string {
  switch (type) {
    case "DREAM_START":
      return "夢のはじまり";
    case "ENTRY":
      return "参入";
    case "TRAINING":
      return "修行・育成";
    case "DREAM_LINE":
      return "DREAM LINE";
    case "MILESTONE":
      return "節目";
    case "SETBACK":
      return "挫折";
    case "RETIREMENT":
      return "引退";
    case "CAREER_CHANGE":
      return "転身";
    case "COMEBACK":
      return "復帰";
  }
}

export function dreamLineStateLabel(state: DreamLineState): string {
  switch (state) {
    case "SEED_VERIFIED":
    case "SEED_VERIFIED_2026":
      return "一次資料で確認済み";
    case "CYCLE_SCOPED":
      return "年度・サイクルにより数値が変わる";
    case "ROUTE_SCOPED":
      return "特定ルートに固有の定義";
    case "DEFINITIONAL":
      return "免許・制度を伴わない定義的な地点";
    case "DYNAMIC":
      return "基準が将来変わりうる";
    case "NEEDS_PRIMARY_FINALIZATION":
      return "一次資料での最終確認が未完了";
  }
}
