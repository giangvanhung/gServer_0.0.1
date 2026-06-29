# Đã hoàn thành

Danh sách tất cả tính năng đã implement trong hệ thống.

---

## ASP.NET — gServerWeb

### Authentication (entry point)

- [x] `Login.aspx` — form đăng nhập với SHA-256 + salt validate DB
- [x] `FormsAuthentication` ticket (session cookie, 8h)
- [x] Generate HMAC-SHA256 token (cùng secret với WCF) sau khi login
- [x] Set cookie `gserver_auth` (non-HttpOnly) chứa `base64(JSON{token,username,role,fullName})`
- [x] Redirect sang ExtJS kèm `?loginUrl=` để ExtJS biết địa chỉ quay lại
- [x] `Home.aspx` — guard redirect: chưa login → `Login.aspx`, đã login → ExtJS
- [x] `WcfProxyHandler` — proxy `/api/*` → WCF :52106 (GET/POST/PUT/DELETE + body)
- [x] `Helpers/TokenHelper.cs` — HMAC token generation dùng chung với WCF

---

## Backend — gServer

### Kiến trúc & Infrastructure

- [x] WCF REST API với `webHttpBinding` — JSON (không phải SOAP)
- [x] 4 tầng rõ ràng: Interface → Service → Business → Repository
- [x] `QueryHelper` async ADO.NET (ExecuteNonQuery / ExecuteScalar / ExecuteReader)
- [x] `ServiceResult<T>` wrapper chuẩn cho tất cả response
- [x] CORS toàn cục trong `Global.asax.cs`
- [x] log4net rolling file (`logs\WCF.log`)
- [x] Script IIS Express (`run-server.ps1` / `run-server.sh`)

### Layer API (`LayerService.svc`)

- [x] `GET  /layers` — Danh sách tất cả layer
- [x] `POST /layers` — Tạo layer mới
- [x] `PUT  /layers/{Id}` — Cập nhật layer
- [x] `DELETE /layers/{Id}` — Xóa layer (cascade xóa FEATURES + LAYERSTYLE)

### Feature API

- [x] `GET  /layers/{layerId}/features` — Danh sách feature (không geometry)
- [x] `POST /layers/{layerId}/features` — Thêm feature (WKT + Properties)
- [x] `PUT  /features/{id}` — Cập nhật feature
- [x] `DELETE /features/{id}` — Xóa feature
- [x] `GET  /features/{id}` — Feature đầy đủ (geometry + properties)
- [x] `GET  /features/{featureId}/geometry` — Chỉ lấy WKT geometry
- [x] `POST /layers/{layerId}/features-batch` — Batch geometry + BoundingBox
- [x] `POST /layers/{layerId}/features/import` — Import hàng loạt feature
- [x] `POST /identify` — Tìm feature tại tọa độ lon/lat (STIntersects + buffer 5m)

### LayerStyle API (`LayerStyle.svc`)

- [x] `GET  /layerstyles` — Tất cả style
- [x] `GET  /layerstyles/{id}` — Style theo Id
- [x] `GET  /layers/{layerId}/style` — Style của layer
- [x] `POST /layerstyles` — Tạo style
- [x] `PUT  /layerstyles/{id}` — Cập nhật style
- [x] `DELETE /layerstyles/{id}` — Xóa style
- [x] `DELETE /layers/{layerId}/style` — Xóa style của layer

### Database

- [x] Bảng `LAYERS` với đầy đủ metadata (Opacity, MinZoom, MaxZoom…)
- [x] Bảng `FEATURES` với cột `geometry` SRID 4326
- [x] Bảng `LAYERSTYLE` (1-1 với LAYERS, cascade delete)
- [x] Spatial Index `GEOMETRY_AUTO_GRID` cho Việt Nam
- [x] Script import dữ liệu từ bảng cũ với `FOR JSON PATH`

---

## Frontend — gClient

### Kiến trúc

- [x] ExtJS 8 Modern toolkit + Material theme
- [x] `Application.js` — đọc `loginUrl` query param, `initFromCookie()`, redirect về ASP.NET nếu chưa auth
- [x] `LayerController.js` — single controller điều phối toàn bộ
- [x] Layout trang chính: hbox `[Layers | Map | Properties Panel]`

### Auth & Phân quyền

- [x] `util/Auth.js` — singleton: `initFromCookie()`, `save()`, `restore()`, `clear()`, `getRole()`
- [x] Cookie `gserver_auth` → parse base64 JSON → lưu vào `localStorage` → xóa cookie
- [x] `Ext.Ajax.setDefaultHeaders({ Authorization: 'Bearer token' })` tự động mọi request
- [x] Logout → `Auth.clear()` → xóa localStorage + cookie → redirect `loginUrl` (Login.aspx)
- [x] `menu.json` — thêm `roles[]` mỗi item, item "Người dùng" chỉ cho `admin`
- [x] `MainViewController._filterMenuByRole()` — lọc menu theo role sau khi store load
- [x] `LoginView.js` + `LoginViewController.js` — giữ lại nhưng không còn dùng (auth do ASP.NET quản lý)

### Quản lý người dùng (Admin)

- [x] `view/admin/UserManagementView.js` — grid với tbar Add/Search, cột role/status có màu
- [x] `view/admin/UserManagementViewController.js` — CRUD: loadUsers, onAdd, onEdit, onDelete, dialog form

### Bản đồ OpenLayers

- [x] Khởi tạo `ol.Map` với `ol.source.Vector` + `ol.layer.Vector`
- [x] Render WKT lên map với đúng projection (`EPSG:4326` → view projection)
- [x] Zoom vừa khít vùng dữ liệu (`zoomToBoundingBox`)
- [x] Style khác nhau theo loại geometry:
    - [x] **Point** — `ol.style.Circle` hoặc `ol.style.Icon` (nếu có IconUrl)
    - [x] **LineString** — chỉ `ol.style.Stroke`
    - [x] **Polygon** — `ol.style.Fill` + `ol.style.Stroke`

### Layer toggle (eye button)

- [x] Bật layer: fetch feature, cache, vẽ lên map
- [x] Tắt layer: xóa tất cả feature khỏi vectorSource
- [x] Guard `layerLoading` chống double-click load đồng thời
- [x] Dùng cache cho lần bật tiếp theo (không gọi API lại)

### Feature toggle (checkbox)

- [x] Bật/tắt feature riêng lẻ qua CheckColumn trong grid
- [x] `hiddenFeatureIds` — chỉ skip feature đã bị user tắt (không skip feature chưa load)
- [x] Flag `_checkboxJustChanged` 150ms — chống itemtap fire sau checkchange
- [x] Guard itemtap: bỏ qua click trên `.x-checkcolumn-cell`

### Feature row tap

- [x] Tap row → mở Feature Properties Panel bên phải map
- [x] Tap row khi feature chưa có trên map → hiện trên map + mở panel
- [x] Tap row khi feature đang có trên map → xóa khỏi map
- [x] Tap cùng feature khi panel đang mở → toggle đóng panel
- [x] Close button trên panel → ẩn panel + `currentPanelFeatureId = null`

### Lazy Style Cache

- [x] Cache style lần đầu fetch (`undefined` → `null | {obj}`)
- [x] Không gọi API lần 2 nếu đã có cache
- [x] Invalidate + re-fetch + re-apply sau khi save style
- [x] `LayerStyleCRUDPanel.loadStyle()` hỗ trợ `initialStyle` param (không fetch nếu đã có)

### Vẽ geometry (EditLayer)

- [x] Vẽ **Point** — click 1 lần
- [x] Vẽ **LineString** — click nhiều điểm + **Finish Button**
- [x] Vẽ **Polygon** — click nhiều điểm + **Finish Button**
- [x] Nút Finish gọi `finishDrawing()` trên interaction
- [x] `drawabort` listener → Toast "Cần ít nhất 2 điểm" khi click Finish quá sớm
- [x] Hỗ trợ trên cả 2 trang: `LayerMap` và `EditLayer`

### CRUD UI

- [x] `LayerCRUDPanel` — Thêm/sửa layer (floated modal)
- [x] `FeatureCRUDPanel` — Thêm/sửa feature với WKT
- [x] `LayerStyleCRUDPanel` — Chỉnh style với preview màu realtime
- [x] Debounce + Batch geometry request (400ms window)

---

## Tài liệu

- [x] MkDocs Material với dark/light mode
- [x] Kiến trúc hệ thống (sơ đồ Mermaid)
- [x] ERD database
- [x] API Reference đầy đủ với request/response mẫu
- [x] Luồng dữ liệu (sequence diagram)
- [x] Cơ chế nâng cao (style cache, hiddenFeatureIds, batch)
- [x] Script khởi động (`run-server`, `run-client`, `serve-docs`)
- [x] **`build-deploy.md`** — hướng dẫn dev setup, production build, IIS deploy, luồng auth, troubleshooting
