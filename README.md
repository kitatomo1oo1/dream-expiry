# 夢の賞味期限

無料スマホブラウザで「夢を想像するワクワク」と「その夢を生きる現実」を体験する。職業検索・転職・適職診断ではない。

IMAGINE → DISTANCE → DISCOVER → DREAM_LINE → AFTER → REFLECT

- **DREAM LINE**: その職業・活動そのものによって、対価を受け取る資格・権利・契約・採用・商業的機会等を初めて取得した地点。「なる」と「成功する」を分離する。
- 夢＋年齢から開始。年齢を指(スライダー)で動かし、入口・期限・例外ルートの変化を発見する。
- DREAM LINE後は実在人物の継続・引退・転身・挫折・復帰等(AFTER)を見る。最後に「夢とは何か」の答えを押し付けない(REFLECT)。
- 禁止: 架空の成功率・難易度点・人生ランキング・年収による勝敗、UNKNOWNの0/false扱い、ROUTE_CLOSEDを「夢は不可能」と表示すること、年齢上限なし＝簡単という誤読。

現在、代表11夢(医師/JRA騎手/プロボクサー/力士/プロサッカー選手/YouTuber/プロ棋士/宝塚歌劇団員/漫画家/俳優/プロ野球選手)についてIMAGINE〜REFLECTまでE2Eで遊べる。未検証・未実装の項目は [TODO_DATA.md](./TODO_DATA.md) を参照。

## Architecture

無料スマホブラウザMVP。ログイン不要。ビルド後は静的ファイルのみ(HTML/CSS/JS)で、任意の静的ホスティング(GitHub Pages等)にそのまま配置できる。DB・サーバー・課金API・生成AI APIは使用しない。

- Vite + TypeScript(バニラ、フレームワーク非依存)
- ルールエンジンはクライアントサイドで完全に決定的(同じ入力(夢・年齢・日付)には常に同じ結果)
- テストは Vitest

```
data/                    正本データ(JSON)。dream_line_seed.json / launch_dreams.json / rule_constants.json は無変更で保持
src/
  types.ts               スキーマ定義(Dream/Occupation/Route/RouteStep/Rule/DreamLine/Source/Person/LifeEvent)
  data/loader.ts          data/*.json を読み込み、参照整合性を検証する
  engine/
    ageEvaluator.ts        年齢がAgeConditionを満たすかの判定
    ruleEngine.ts           ルール選択(年齢+有効期間で該当ルールを1件選ぶ)
    routeEvaluator.ts       Route/Step/Occupation単位のStatus評価(ROUTE_CLOSED≠dream_impossibleを保証)
    dreamLineEngine.ts      DREAM LINE定義・AFTER人物データの取得、年齢変化による「発見」の算出
  ui/                     画面(IMAGINE〜REFLECTの6 Phase)、フレームワーク非依存のDOMヘルパー
tests/                   Vitest による境界値・不変条件のテスト
```

## 起動方法

```bash
npm install
npm run dev
```

`http://localhost:5173` で開く(ポートが使用中の場合はViteが別ポートを提示する)。

## Build

```bash
npm run build
```

`tsc --noEmit` による型チェック後、`dist/` に静的ファイルを生成する。`npm run preview` でビルド結果を確認できる。

## Test

```bash
npm test
```

Vitest で以下を検証する:

- `spec/ENGINE.md` の必須境界(JRA 14/15,19/20、Boxer 16/17-34/35、Sumo 22/24)がRoute Evaluatorで正しく判定されること
- UNKNOWN が false/0 にフォールバックしないこと、ROUTE_CLOSED でも代替ルートがあれば ALTERNATIVE_AVAILABLE になること(不変条件)
- 年齢スライダーの「発見」ロジック
- data/*.json の参照整合性(存在しないID参照があればロード時に例外)

## Deploy (GitHub Pages)

`main` ブランチへの push で `.github/workflows/deploy.yml` が自動的に `npm test` → `npm run build` → GitHub Pages への公開を行う。リポジトリの Settings → Pages → Source を「GitHub Actions」に設定しておくこと。

## 未検証データ

[TODO_DATA.md](./TODO_DATA.md) を参照。年齢ルール・AFTER実例のうち、一次資料での最終確認が未完了、またはサイクルにより将来値が変わる項目を明示している。
