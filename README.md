# Dự án WebGIS — gClient & gServer

Hệ thống WebGIS hiển thị dữ liệu không gian địa lý trên nền web, gồm 3 thành phần đặt trong cùng một thư mục gốc.

```
📁 root/
├── 📁 gServer_0.0.1/        ← Backend WCF .NET
├── 📁 gClient_ExtJS/        ← Frontend ExtJS + OpenLayers
└── 📁 gServer_Introduction/ ← Tài liệu MkDocs
```

---

## gServer_0.0.1 — Backend WCF

Dịch vụ dữ liệu GIS xây dựng bằng **WCF Service Application** (.NET 4.5.1), cung cấp API JSON cho frontend.

**Yêu cầu:**
- Visual Studio 2022
- .NET Framework 4.5.1
- SQL Server (đã tạo sẵn schema LAYERS / FEATURES / LAYERSTYLE)

**Cách chạy:**

1. Mở file `gServer_0.0.1.sln` bằng Visual Studio 2022
2. Nhấn `F5` hoặc chọn **Debug → Start Debugging**
3. IIS Express tự khởi động, service chạy tại `http://localhost:52106`

**Kiểm tra hoạt động:**

Mở trình duyệt và truy cập:
```
http://localhost:52106/LayerService.svc/layers
```
Nếu trả về JSON là thành công.

---

## gClient_ExtJS — Frontend

Giao diện người dùng xây dựng bằng **ExtJS 8** + **OpenLayers**, hiển thị lớp bản đồ và render hình học WKT.

**Yêu cầu:**
- Node.js 16+
- npm

**Cách chạy:**

```bash
cd gClient_ExtJS
npm install      # lần đầu tiên
npm start
```

Ứng dụng chạy tại `http://localhost:1962`

> ⚠️ Cần khởi động **gServer_0.0.1** trước để frontend có dữ liệu.

---

## gServer_Introduction — Tài liệu

Tài liệu kỹ thuật trình bày kiến trúc hệ thống, CSDL, luồng dữ liệu — xây dựng bằng **MkDocs**.

**Yêu cầu:**
- Python 3.8+
- pip

**Cách chạy:**

```bash
pip install mkdocs mkdocs-material

cd gServer_Introduction
mkdocs serve
```

Tài liệu mở tại `http://localhost:8000`

---

## Thứ tự khởi động

```
1. gServer_0.0.1   →   F5 trong Visual Studio
2. gClient_ExtJS   →   npm start
3. gServer_Introduction   →   mkdocs serve  (tùy chọn)
```
