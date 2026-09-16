# Claude Code 実装マスタープロンプト v1.0

あなたは実装責任者です。仕様を要約して返すのではなく、実際に動く無料スマホブラウザアプリ「夢の賞味期限」を完成させてください。

## 開始
最初に作業フォルダを再帰監査し、README/spec/data/testsと既存コード全体、entry point、build、data flow、testsを把握してください。既存コードを読まずに置換禁止。.env/秘密鍵/認証情報を表示・変更・commit禁止。

## 正本優先順位
spec/PRODUCT_SPEC.md → spec/ENGINE.md → spec/DATA_POLICY.md → data/* → tests/ACCEPTANCE.md。
重大な矛盾以外は推奨案で自律判断し、軽微な質問で停止しない。DREAM LINE、事実データ、プロダクト思想を変更しないと進めない場合だけ確認する。

## 絶対条件
これは職業検索/転職/適職診断ではない。
IMAGINE→DISTANCE→DISCOVER→DREAM_LINE→AFTER→REFLECT を守る。
DREAM LINE = その職業・活動そのものによって対価を受け取る資格・権利・契約・採用・商業的機会等を初めて取得した地点。
「なる」と「成功する」を分離。

## Architecture
無料スマホブラウザMVP。ログイン不要。static hosting可能を優先。versioned JSON + deterministic client-side rule engine。MVPだけのためにDB、サーバー、課金API、生成AI APIを追加しない。既存stackがあれば尊重。空なら保守性・静的配信・test容易性で選ぶ。

## 縦に完成させる代表10夢
医師/JRA騎手/プロボクサー/力士/プロサッカー/YouTuber/プロ棋士/宝塚/漫画家/俳優。
56件を薄く並べる前に、この代表群でE2Eを完成。未検証値は捏造せずUNKNOWN。

## UI
最初は「あなたの夢の賞味期限は？」→夢→年齢。大量フォーム禁止。不足条件だけ後から聞く。
年齢スライダーはRule Engineを再評価し「何が変わったか」を発見として表示。
事実と一致する場合のみ「まだ開いている入口があります」「この入口は閉じました」「ただし別の入口があります」「年齢による正式な上限が見つかりません」「締切がないことと簡単なことは別です」等を使える。
DREAM LINEで「夢が叶いました。」→「……でも、人生はここで終わりません。」→AFTER。
カード一覧をホームにしない。

## ゲーム性
偽成功率、難易度点、人生スコア、年収ランキング禁止。年齢を触る、入口/例外ルートを発見する、実在人生の意外な転身を見ることをゲーム性にする。

## Data
最低schema: Dream/Occupation/Route/RouteStep/Rule/DreamLine/Source/Person/LifeEvent。
RuleはStepに紐付け、StatusとExpiryTypeを分離。dynamic rulesはvalidityを持つ。SourceをUIから追跡可能にする。NEEDS_*は確認前に確定表示禁止。

## AFTER
人物を成功者/失敗者に分類しない。DREAM_START/ENTRY/TRAINING/DREAM_LINE/MILESTONE/SETBACK/RETIREMENT/CAREER_CHANGE/COMEBACKを扱える。動機・感情を推測しない。

## 自律実装順
A repository audit
B architecture
C schema/data loader
D rule engine
E date/age evaluator
F route evaluator
G DREAM LINE evaluator
H unit/boundary tests
I Part1 mobile UI
J person/life-event engine
K Part2 UI
L transition/polish
M accessibility/responsive
N E2E
O failures修正
P production build

後工程で根本エラーが出たら前段へ戻って修正。「とりあえず動いた」で終了禁止。

## 完成条件
production build成功、tests成功、代表夢をスマホで最後まで遊べる、360px級横スクロールなし、UNKNOWN保持、route closed≠dream impossible、DREAM LINE不変、Source確認可能、AFTER到達、console/build error 0、READMEに起動/build/test/deploy、未検証はTODO_DATA.mdへ。

## 拡張
代表E2E完成後、LEVEL A→LEVEL Bの順でlaunch_dreams.jsonを同じengineへ追加。未調査を推測で完成扱いしない。

## 最終報告
長い実況不要。完了時に「実装内容/テスト結果/起動方法/未検証データ/残課題/主要ファイル」だけ簡潔に報告。

ここから監査を開始し、そのまま実装・テスト・修正まで進めてください。
