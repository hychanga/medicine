# 中醫小幫手 — 全端範例

包含兩個功能：
- **穴道圖典**（首頁 `/`）：互動式 SVG 人形經絡圖（正／背面）、約 60 個穴位、經絡與症狀方劑對照、**個人筆記**（存資料庫）。
- **藥品庫存**（`/inventory`）：藥品 CRUD 管理。

前端 Next.js（部署 Vercel）、後端 Spring Boot（部署 Cloud Run）、資料庫 TiDB Cloud（MySQL 相容）。

```
┌────────────┐    /api/* (rewrite)   ┌──────────────────┐    JDBC/TLS   ┌──────────────┐
│  Next.js   │ ───────────────────▶  │   Spring Boot     │ ───────────▶ │  TiDB Cloud   │
│  (Vercel)  │    同源、免 CORS      │   (Cloud Run)     │    MySQL      │  Serverless   │
└────────────┘                       └──────────────────┘               └──────────────┘
```

## 專案結構

```
medicine/
├── backend/    Spring Boot 3.3 / Java 21 REST API（含 Dockerfile）
│   └── src/main/java/com/medicine/api/  controller · service · repository · model
│       ├── medicines (CRUD) · notes (穴位筆記)
├── frontend/   Next.js 16 (App Router) + Tailwind v4
│   └── src/
│       ├── app/page.tsx            穴道圖典首頁
│       ├── app/inventory/page.tsx  藥品庫存
│       ├── components/AcupointAtlas · BodyFigure · MedicineForm
│       └── lib/acupoints · notesApi · api
├── 穴道圖典.html   原始單檔版本（已整合進前端，保留作參考）
└── README.md
```

## API

| Method | Path                  | 說明                          |
|--------|-----------------------|-------------------------------|
| GET    | `/api/medicines`      | 藥品列表（`?q=` 名稱/廠商搜尋）|
| GET    | `/api/medicines/{id}` | 藥品單筆                      |
| POST   | `/api/medicines`      | 新增藥品                      |
| PUT    | `/api/medicines/{id}` | 更新藥品                      |
| DELETE | `/api/medicines/{id}` | 刪除藥品                      |
| GET    | `/api/notes`          | 所有穴位筆記                  |
| GET    | `/api/notes/{pointId}`| 取得某穴位筆記（無則回空字串）|
| PUT    | `/api/notes/{pointId}`| 新增／更新穴位筆記（upsert）   |
| GET    | `/actuator/health`    | 健康檢查                      |

> 穴位筆記存於資料表 `acupoint_notes`，由 JPA 於啟動時自動建立；取代原 HTML 版本的 `window.storage`。

---

## 本機開發

**後端**（使用內建 H2 + 種子資料，免資料庫）：

```bash
cd backend
docker build -t medicine-api:local .
docker run --rm -p 8080:8080 -e SPRING_PROFILES_ACTIVE=local medicine-api:local
# 已安裝 Maven 者亦可：mvn spring-boot:run
```

**前端**：

```bash
cd frontend
cp .env.example .env.local   # API_BASE_URL 預設 http://localhost:8080 即可
npm install
npm run dev                  # http://localhost:3000
```

---

## 1. 建立 TiDB Cloud 資料庫

1. 至 https://tidbcloud.com 建立 **Serverless** 叢集（免費方案即可）。
2. 點 **Connect**，選 **General / Java**，取得 host、port(4000)、user(`<prefix>.root`)、password。
3. 用該連線資訊建立資料庫：
   ```sql
   CREATE DATABASE IF NOT EXISTS medicine;
   ```
   （資料表由 JPA `ddl-auto=update` 於後端啟動時自動建立。）

> TiDB Serverless 強制 TLS。JDBC URL 需帶 `sslMode=VERIFY_IDENTITY`，Cloud Run 的 JRE 映像已內建 CA 憑證，無須額外設定。

---

## 2. 部署後端到 Cloud Run

需先 `gcloud auth login` 並 `gcloud config set project <PROJECT_ID>`。

```bash
cd backend

gcloud run deploy medicine-api \
  --source . \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars "SPRING_PROFILES_ACTIVE=prod" \
  --set-env-vars "^@^SPRING_DATASOURCE_URL=jdbc:mysql://gateway01.<region>.prod.aws.tidbcloud.com:4000/medicine?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3" \
  --set-env-vars "SPRING_DATASOURCE_USERNAME=<prefix>.root" \
  --set-env-vars "SPRING_DATASOURCE_PASSWORD=<your-password>"
```

說明：
- `--source .` 會用 `backend/Dockerfile` 透過 Cloud Build 建置映像，無須本機 Maven。
- JDBC URL 含 `&`，故用 `^@^` 改變分隔符避免被 shell 解析（見 `--set-env-vars` 語法）。
- 密碼建議改用 Secret Manager：`--set-secrets SPRING_DATASOURCE_PASSWORD=tidb-password:latest`。

部署完成會輸出 service URL，例如 `https://medicine-api-xxxx-de.a.run.app`，請記下。

驗證：
```bash
curl https://medicine-api-xxxx-de.a.run.app/actuator/health
curl https://medicine-api-xxxx-de.a.run.app/api/medicines
```

---

## 3. 部署前端到 Vercel

1. 把整個 repo 推上 GitHub（見下方 Git 備註）。
2. 在 Vercel **Import Project**，**Root Directory** 選 `frontend`（Framework 會自動偵測為 Next.js）。
3. 設定環境變數：
   | Name           | Value                                         |
   |----------------|-----------------------------------------------|
   | `API_BASE_URL` | 步驟 2 取得的 Cloud Run URL（**不含結尾斜線**）|
4. Deploy。

前端以 `next.config.ts` 的 rewrites 把 `/api/*` 代理到 `API_BASE_URL`，瀏覽器為**同源請求**，因此不需處理 CORS。

> 改了 `API_BASE_URL` 後需 **重新部署** 前端才會生效（rewrites 在 build 時取值）。

或用 CLI：
```bash
npm i -g vercel
cd frontend
vercel link
vercel env add API_BASE_URL production   # 貼上 Cloud Run URL
vercel --prod
```

---

## Git 備註

`create-next-app` 在 `frontend/` 內建立了獨立的 `.git`。建議改成單一 repo：

```bash
cd medicine
rm -rf frontend/.git
git init
git add .
git commit -m "Initial medicine inventory app"
git remote add origin <your-repo-url>
git push -u origin main
```

---

## 環境變數總覽

| 位置       | 變數                          | 用途                              |
|------------|-------------------------------|-----------------------------------|
| Cloud Run  | `SPRING_PROFILES_ACTIVE`      | `prod`（啟用 MySQL/TiDB）         |
| Cloud Run  | `SPRING_DATASOURCE_URL`       | TiDB JDBC URL                     |
| Cloud Run  | `SPRING_DATASOURCE_USERNAME`  | TiDB 使用者                       |
| Cloud Run  | `SPRING_DATASOURCE_PASSWORD`  | TiDB 密碼（建議用 Secret Manager）|
| Cloud Run  | `APP_CORS_ALLOWED_ORIGINS`    | （選用）允許直連的前端網域        |
| Vercel     | `API_BASE_URL`                | Cloud Run service URL             |

範例檔見 `backend/.env.example`、`frontend/.env.example`。
