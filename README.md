<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a2b67b1a-77c7-4bec-b42c-56a8e4b8ae74

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## 物件データ登録と外部連携

### 1) 自社物件の手動登録
- API: `POST /api/v1/properties`
- 必須項目: `title`, `location`, `layout`, `rent(number)`

### 2) いえらぶCLOUD連携準備
- 状態確認: `GET /api/v1/integrations/status`
- 同期実行: `POST /api/v1/integrations/ielove-cloud/sync`
- 必要な環境変数:
  - `IELOVE_CLOUD_API_BASE_URL`
  - `IELOVE_CLOUD_API_KEY`
  - `IELOVE_CLOUD_COMPANY_ID`

### 3) REINFOLIB（国交省）連携準備
- 申請ページ: https://www.reinfolib.mlit.go.jp/api/request/
- 状態確認: `GET /api/v1/integrations/status`
- 同期実行: `POST /api/v1/integrations/reinfolib/sync`
- 必要な環境変数:
  - `REINFOLIB_API_KEY`
  - （必要に応じて）`REINFOLIB_API_BASE_URL`

> 申請が通った後は `REINFOLIB_API_KEY` を設定すれば、同期APIをすぐ実行できる状態です。
