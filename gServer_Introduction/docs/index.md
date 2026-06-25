# Hệ thống WebGIS — gClient & gServer

## Giới thiệu

Dự án xây dựng một hệ thống **WebGIS** hoàn chỉnh cho phép quản lý và hiển thị dữ liệu không gian địa lý trên nền web.

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **gServer** | WCF .NET 4.5.1 + IIS Express | REST API JSON — layer, feature, style |
| **gClient** | ExtJS 8 + OpenLayers | Giao diện người dùng, hiển thị bản đồ |
| **Database** | SQL Server 2016+ Spatial | Lưu trữ `geometry`, SRID 4326 |

## Mục tiêu dự án

- WCF REST service cung cấp đầy đủ CRUD cho **LAYERS**, **FEATURES**, **LAYERSTYLE**
- Frontend ExtJS nhận dữ liệu, điều khiển hiển thị từng lớp bản đồ
- OpenLayers render hình học **WKT** lên bản đồ tương tác
- Hỗ trợ 3 loại đối tượng: `POINT` · `LINESTRING` · `POLYGON`

## Khởi động nhanh

```powershell
# 1. Backend (PowerShell — Windows)
.\run-server.ps1          # IIS Express port 52106

# 2. Frontend (PowerShell — Windows)
.\run-client.ps1          # webpack-dev-server port 1962

# 3. Tài liệu (PowerShell — Windows)
.\serve-docs.ps1          # MkDocs port 8000

# Hoặc Bash (WSL / Git Bash)
./serve-docs.sh
```

## Port mặc định

| Service | Port | URL |
|---|---|---|
| gServer (IIS Express) | **52106** | `http://localhost:52106/LayerService.svc` |
| gClient (dev server) | **1962** | `http://localhost:1962` |
| Tài liệu MkDocs | **8000** | `http://localhost:8000` |

## Cấu trúc kho mã

```
gServer_0.0.1/
├── gServer_0.0.1/        ← Backend WCF .NET (project chính)
│   ├── IServices/        ← WCF contract
│   ├── Services/         ← Triển khai .svc
│   ├── Bussines/         ← Business logic
│   ├── Repositories/     ← SQL thuần
│   ├── Models/           ← Entity + DTO
│   └── Helper/           ← DB, Log
├── gClient_ExtJS/        ← Frontend ExtJS + OpenLayers
├── gServer_Introduction/ ← Tài liệu MkDocs (bạn đang ở đây)
├── run-server.ps1        ← Khởi động backend
├── run-client.ps1        ← Khởi động frontend
└── serve-docs.ps1        ← Khởi động tài liệu
```
