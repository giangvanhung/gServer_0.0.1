# Cách 2: Webpack Dev Server làm Client, WCF làm Backend trực tiếp

## Ý tưởng

Thay vì dùng gServerWeb làm cầu nối cho ExtJS, **webpack dev server (port 1962) tự proxy `/api/*` thẳng về WCF (port 52106)**.

```
Browser → localhost:1962  (webpack dev server — ExtJS UI)
              └── /api/* → proxy → localhost:52106  (WCF — REST API)
                                        └── SQL Server
```

gServerWeb vẫn chạy nhưng chỉ cần cho Login/ASPX pages, **không cần** cho client ExtJS.

---

## Ưu điểm so với Cách 1

| | Cách 1 (gServerWeb proxy) | Cách 2 (webpack proxy) |
|---|---|---|
| Cần ExtJS webpack? | Có | Có |
| `/~cmd/` path issue | Cần handler thêm | Webpack tự xử lý |
| Hot reload ExtJS | Qua proxy (chậm hơn) | Trực tiếp (nhanh) |
| Setup | Phức tạp | Đơn giản |

---

## Thay đổi đã thực hiện

### 1. `gClient_ExtJS/g-client/webpack.config.js`
Thêm proxy config: mọi request `/api/*` từ ExtJS được webpack chuyển tiếp về WCF, tự động strip prefix `/api`.

```
/api/LayerService.svc/layers → http://localhost:52106/LayerService.svc/layers ✓
```

### 2. `gServerWeb/gServerWeb.csproj.user`
Khi nhấn F5 trong VS2022, browser tự mở `http://localhost:1962/` (ExtJS app) thay vì ASPX page.

### 3. `Application.js`
`apiHost: '/api'` — đã set từ trước, webpack proxy sẽ handle.

---

## Cách chạy

### Bước 1 — Start trong VS2022
Chọn profile **"New Profile"** (toolbar dropdown) → nhấn **F5**

VS2022 sẽ start:
- `gServer_0.0.1` → WCF tại `http://localhost:52106`
- `gServerWeb` → IIS Express tại `http://localhost:63329`

### Bước 2 — Start webpack dev server
Mở terminal trong `gClient_ExtJS/g-client/`:

```powershell
npm run dev
```

Hoặc dùng terminal VS2022 (View → Terminal):
```powershell
cd gClient_ExtJS/g-client
npm run dev
```

### Bước 3 — Truy cập client
Browser tự mở tại `http://localhost:1962/`

Nếu không tự mở, truy cập thủ công: **http://localhost:1962**

---

## Flow dữ liệu thực tế

```
ExtJS (browser tại :1962)
    ↓ GET /api/LayerService.svc/Layers
webpack dev server (:1962)
    ↓ proxy: strip /api → forward
WCF (:52106) → LayerService.svc
    ↓
SQL Server → trả data
    ↑
ExtJS nhận JSON, render grid/map
```

---

## Lưu ý

- Chỉ cần Login vào gServerWeb khi cần test ASPX pages (`http://localhost:63329/Login.aspx`)
- ExtJS tại port 1962 **không** bị chặn bởi auth của gServerWeb
- Khi sửa file JS trong `gClient_ExtJS/g-client/app/`, webpack tự hot-reload trình duyệt
