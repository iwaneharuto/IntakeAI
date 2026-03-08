# IntakeAI — デプロイ手順

## ファイル構成

```
intakeai/
├── api/
│   └── analyze.js       # Vercel Serverless Function（APIキーをここで管理）
├── public/
│   └── index.html       # フロントエンド
├── vercel.json          # ルーティング設定
├── package.json
└── .gitignore
```

## Vercel へのデプロイ手順

### 1. GitHubにリポジトリを作成してプッシュ

```bash
cd intakeai
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのユーザー名/intakeai.git
git push -u origin main
```

### 2. Vercel にインポート

1. https://vercel.com にログイン
2. 「Add New → Project」をクリック
3. 作成した GitHub リポジトリを選択して「Import」
4. Framework Preset は **Other** のまま
5. 「Deploy」をクリック（まずデプロイを通す）

### 3. 環境変数を設定（重要）

デプロイ後、以下の手順で API キーを設定します。

1. Vercel Dashboard でプロジェクトを開く
2. **Settings → Environment Variables**
3. 以下を追加：

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

4. 「Save」後、**Deployments → Redeploy** で再デプロイ

### 4. 動作確認

デプロイ完了後、発行された URL にアクセスしてログイン。

- ID: `demo` / パスワード: `demo123`
- ID: `admin` / パスワード: `admin123`

---

## ローカル開発

```bash
npm install -g vercel
vercel dev
```

`vercel dev` は `/api/*.js` をローカルでサーバーレス関数として実行します。
`.env.local` ファイルに API キーを記述してください：

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## アーキテクチャ

```
ブラウザ (public/index.html)
    │
    │  POST /api/analyze  { memo: "..." }
    ▼
Vercel Serverless Function (api/analyze.js)
    │  x-api-key: $ANTHROPIC_API_KEY  ← サーバー側のみ
    ▼
Anthropic API
    │
    ▼  { title, facts, claims, issues, todo }
ブラウザ
```

APIキーはサーバー側の環境変数にのみ存在し、クライアントには一切露出しません。

---

## ユーザー管理について

現在のログインはデモ用ハードコードです。
本番運用する場合は `api/login.js` を追加し、JWT や session で認証することを推奨します。
