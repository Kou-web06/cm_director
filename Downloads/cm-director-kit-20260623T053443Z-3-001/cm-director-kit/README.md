# CM制作ディレクター キット（cm-director）

Claude Code を「CM監督エージェント」にして、**企画 → スタイル → キャラ → ロケ → 絵コンテ → 動画プロンプト → 動画生成 → QA** の8ステップでCM（広告動画）を一貫制作する環境です。
invideo の Agent One 相当を、**自分で所有・編集できるファイル + Higgsfield MCP** で再現します。

## この中身（共有すべきファイル）
```
cm-director-kit/
├─ CLAUDE.md                                  # 監督エージェントの常時ルール（最重要）
├─ .claude/
│  ├─ skills/cm-director/
│  │  ├─ SKILL.md                             # メインスキル（/cm-director で起動）
│  │  └─ templates/treatment-template.md      # 企画書（トリートメント）テンプレ
│  └─ agents/
│     └─ video-prompt-specialist.md           # ステップ6用サブエージェント
├─ productions/                               # 各案件はここに1フォルダずつ生成される（最初は空）
├─ .mcp.json.example                          # Higgsfield MCP 設定の雛形
└─ README.md                                  # これ
```

> `productions/` の中身（生成画像・動画・各案件の .md）は**案件ごとの成果物**なので共有不要。
> 仕組みを再現するのに必要なのは上記の CLAUDE.md / .claude 配下 / （各自で繋ぐ）Higgsfield MCP の3点です。

## 使い方（受け取った人）
1. このフォルダを Claude Code で開く（プロジェクトのルートにする）。
2. **Higgsfield MCP を接続する**（下記セットアップ）。これが無いと画像・動画生成ができません。
3. Claude に `/cm-director` と入力（または「CM作りたい」「絵コンテ作って」等）→ 8ステップが対話で進みます。

## セットアップ：Higgsfield MCP の接続
このキットは Higgsfield の MCP サーバー（画像 `generate_image` / 動画 `generate_video` / 一貫性 `show_reference_elements` 等）を使います。**各自の Higgsfield アカウントで接続**してください（APIキー/トークンは共有しない）。

- Claude Code に MCP を追加する一般的な方法のいずれかで Higgsfield コネクタを登録し、認証する。
  - 例（コネクタ/リモートMCPの場合）: Claude の「コネクタ追加」から Higgsfield を選んで OAuth 認証。
  - 例（CLIで追加する場合）: `claude mcp add` で Higgsfield のエンドポイントを登録。
- 接続できると `generate_image` / `generate_video` / `models_explore` / `balance` 等のツールが使えるようになります。
- `.mcp.json.example` は雛形です。実値（URL/トークン）は各自の Higgsfield 発行情報に置き換えてください。**実トークンを含む .mcp.json はコミット/共有しない**こと。

## 8ステップ（Notion準拠・SKILL.md が厳守）
1. フィルム・トリートメントノート（企画書）
2. スタイル・トーン・ライティング
3. キャラクター開発（Element/Soul で一貫性アンカー）
4. ロケーション開発（Element）
5. ストーリーボード（キーフレーム）
6. 専用の動画プロンプトエージェント（video-prompt-specialist）
7. アニメーション化（generate_video）
8. 実行システム（制御と品質保証）

## 一貫性のコツ（重要）
- 主役キャラ・ロケ・小道具は `show_reference_elements` で **Element 化**し、プロンプトに `<<<element_id>>>` を埋めて再利用する。
- 商品の正確再現が要るカットは、商品画像を `media_upload` → 参照 media として併用する。
- 各案件の確定ID（Element/ジョブ/動画）は `productions/<slug>/STATE.md` 等に必ず記録（これが「記憶」になる）。

## ライセンス/注意
- 生成にはクレジット消費（課金）が発生します。重い生成（動画/4K）の前は `balance` で残高確認を。
- 実在ブランドのロゴ等が映り込むと IP 検出で弾かれることがあります（架空ブランド名/無地に調整）。
