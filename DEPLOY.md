# 自動部署設定

push 到 `main` → 後端自動部署到 Cloud Run、前端自動部署到 Vercel。

| 部分 | 機制 | 觸發條件 |
|------|------|----------|
| 後端 | Cloud Build GitHub 觸發器（`backend/cloudbuild.yaml`） | push 到 `main` 且異動 `backend/**` |
| 前端 | Vercel Git 整合 | 每次 push（含 PR preview） |

---

## A. 後端 → Cloud Run（Cloud Build 觸發器）

### 0. 前置
```bash
gcloud auth login          # 在輸入框用 ! 前綴執行
gcloud config set project <PROJECT_ID>
```
並先在 TiDB Cloud 建好資料庫：`CREATE DATABASE medicine;`

### 1. 連接 GitHub（一次性）
到 Cloud Build 安裝 GitHub App 並授權 `hychanga/medicine`：
<https://console.cloud.google.com/cloud-build/triggers/connect>

### 2. 跑設定腳本
編輯 `scripts/setup-gcp.sh` 開頭的變數（`PROJECT_ID` 與 TiDB 連線資訊），然後：
```bash
bash scripts/setup-gcp.sh
```
這個腳本（可重複執行）會自動完成：
- 啟用 run / cloudbuild / artifactregistry / secretmanager API
- 建立 Artifact Registry repo `medicine`
- 把 TiDB URL / 帳號 / 密碼存進 **Secret Manager**（`tidb-url`、`tidb-username`、`tidb-password`）
- 建立部署用 service account `medicine-deployer` 並授予 `run.admin`、`artifactregistry.writer`、`logging.logWriter`、actAs runtime SA
- 授予 Cloud Run runtime SA 讀取上述 secret 的權限
- 建立 Cloud Build 觸發器 `medicine-api-deploy`（branch `^main$`、path `backend/**`）

> repo 是 public，所以**所有機密都放 Secret Manager**，`cloudbuild.yaml` 不含敏感值。

### 3. 第一次部署
```bash
gcloud builds triggers run medicine-api-deploy --branch=main
```
完成後取得 service URL（給 Vercel 用）：
```bash
gcloud run services describe medicine-api --region=asia-east1 --format='value(status.url)'
```
之後只要 push 動到 `backend/**` 就會自動重新部署。

### 更新 TiDB 連線
改 secret 後重跑觸發器即可：
```bash
printf '%s' '<新值>' | gcloud secrets versions add tidb-password --data-file=-
gcloud builds triggers run medicine-api-deploy --branch=main
```

---

## B. 前端 → Vercel（Git 整合）

1. 到 <https://vercel.com/new> → Import `hychanga/medicine`
2. **Root Directory** 選 `frontend`（Framework 會自動偵測 Next.js）
3. **Environment Variables** 新增：
   | Name | Value |
   |------|-------|
   | `API_BASE_URL` | 步驟 A.3 取得的 Cloud Run URL（不含結尾斜線） |
4. Deploy

設定完成後，**每次 push 到 `main` 都會自動部署**，PR 也會有 preview URL。

> `API_BASE_URL` 在 build 時取值；之後若改了後端網址，到 Vercel 改環境變數並 redeploy（或推一個新 commit）即可。

---

## 流程總結

```
 git push main
      ├─ 動到 backend/**  → Cloud Build 觸發器 → build image → Cloud Run 部署
      └─ 任何變更          → Vercel → build → 部署（/api/* 代理到 Cloud Run）
```
