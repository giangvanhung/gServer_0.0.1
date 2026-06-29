# Hướng Dẫn Cách 2: Build ExtJS + Embed Vào ASP.NET

## Tổng Quan

```
Giai đoạn 1: Build Production ExtJS
Giai đoạn 2: Copy vào gPortal
Giai đoạn 3: Cleanup folders thừa
Giai đoạn 4: Deploy
```

---

## Giai Đoạn 1: Build Production ExtJS

### 1.1 Mở Command Prompt

```bash
# Điều hướng vào folder gClient
cd C:\Projects\gClient
```

### 1.2 Build Production

```bash
# Build ExtJS production
sencha app build production
```

**Output:**
```
C:\Projects\gClient\build\production\
├── app.js                    ← File bundled chính (gom tất cả code)
├── index.html                ← HTML entry point
├── resources/
│   ├── css/
│   │   └── app.css
│   ├── images/
│   └── (các file khác)
├── bootstrap.js              ← Loader
└── ...
```

### 1.3 Kiểm Tra Build OK

```bash
# Kiểm tra file app.js tồn tại
dir build\production\

# app.js size nên > 1MB (bundled tất cả)
# Nếu file bị nhỏ hoặc không có → build thất bại
```

---

## Giai Đoạn 2: Copy Vào gPortal

### 2.1 Tạo Folder gclient-build

```bash
# Điều hướng vào gPortal
cd C:\Projects\gPortal

# Tạo folder (nếu chưa có)
mkdir gclient-build
```

### 2.2 Copy Tất Cả File Từ build/production

```bash
# Copy tất cả từ gClient build
# Windows (PowerShell):
Copy-Item "C:\Projects\gClient\build\production\*" `
          "C:\Projects\gPortal\gclient-build\" `
          -Recurse -Force

# Hoặc dùng cmd:
xcopy C:\Projects\gClient\build\production\* C:\Projects\gPortal\gclient-build\ /E /Y

# Linux/Mac:
cp -r ~/Projects/gClient/build/production/* ~/Projects/gPortal/gclient-build/
```

### 2.3 Cấu Trúc Sau Copy

```
gPortal/
├── gclient-build/
│   ├── app.js                    ← Quan trọng!
│   ├── index.html
│   └── resources/
│       └── css/, images/, ...
├── Pages/
│   ├── SinhVien.aspx             ← Tạo file này
│   └── SinhVien.aspx.cs
└── web.config
```

---

## Giai Đoạn 3: Tạo File .aspx Nhúng

### 3.1 Tạo SinhVien.aspx

**File:** `C:\Projects\gPortal\Pages\SinhVien.aspx`

```html
<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="SinhVien.aspx.cs" 
         Inherits="gPortal.Pages.SinhVienPage" %>

<!DOCTYPE HTML>
<html manifest="">
<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=10, user-scalable=yes">
  <title>gClient - Quản Lý Sinh Viên</title>
  
  <!-- OpenLayers (nếu dùng GIS) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.1.0/ol.css">
  <script src="https://cdn.jsdelivr.net/npm/ol@v10.1.0/dist/ol.js"></script>
  
  <!-- ExtJS bundled app.js -->
  <script src="/gclient-build/app.js"></script>
  
  <!-- ExtJS CSS (nếu app.js không include) -->
  <link rel="stylesheet" href="/gclient-build/resources/css/app.css">
</head>
<body class="launching">
  <div id="splash" style="margin-top:20%;font-family:Arial;font-size:64px;text-align:center;color:#404040;">
    <div id="theLoadingText">LOADING...</div>
    <i style="margin:20px;" class="fa fa-spinner fa-spin"></i>
  </div>
</body>
</html>
```

### 3.2 Tạo SinhVien.aspx.cs (Code-Behind)

**File:** `C:\Projects\gPortal\Pages\SinhVien.aspx.cs`

```csharp
using System;
using System.Web.UI;

namespace gPortal.Pages {
    public partial class SinhVienPage : Page {
        protected void Page_Load(object sender, EventArgs e) {
            // Kiểm tra user đã login
            if (Session["UserId"] == null) {
                Response.Redirect("/Login.aspx");
                return;
            }
            
            // Kiểm tra quyền (tùy chọn)
            if (Session["Role"] != null && Session["Role"].ToString() != "Admin") {
                Response.Redirect("/AccessDenied.aspx");
                return;
            }
        }
    }
}
```

---

## Giai Đoạn 4: Cleanup Folders Thừa

### 4.1 Folders Thừa Cần Xóa

Khi build production, các folder sau **không cần thiết** khi deploy:

```
gClient/
├── .sencha/              ← Sencha config, không cần
├── app/                  ← Source code, không cần (đã build)
├── build/                ← Build folder (giữ development hoặc xóa)
│   ├── development/      ← ❌ XÓA
│   ├── testing/          ← ❌ XÓA
│   ├── production/       ← ✅ Giữ (hoặc xóa sau khi copy)
├── node_modules/         ← ❌ XÓA (rất nặng, 500MB+)
├── .git/                 ← ❌ XÓA (git config, không cần deploy)
├── *.lock                ← ❌ XÓA (package-lock.json, yarn.lock)
├── .cache/               ← ❌ XÓA (cache, không cần)
└── .sass-cache/          ← ❌ XÓA (SASS compile cache)
```

### 4.2 Cleanup Script (PowerShell - Windows)

**File:** `C:\Projects\cleanup.ps1`

```powershell
# Cleanup script cho gClient folder
# Chạy trước khi deploy

$gClientPath = "C:\Projects\gClient"
$gPortalPath = "C:\Projects\gPortal"

Write-Host "=== Cleanup gClient ===" -ForegroundColor Green

# 1. Xóa node_modules (nặng nhất ~500MB-1GB)
if (Test-Path "$gClientPath\node_modules") {
    Write-Host "Xóa node_modules..." -ForegroundColor Yellow
    Remove-Item "$gClientPath\node_modules" -Recurse -Force
    Write-Host "✓ Xóa xong node_modules" -ForegroundColor Green
}

# 2. Xóa build/development
if (Test-Path "$gClientPath\build\development") {
    Write-Host "Xóa build/development..." -ForegroundColor Yellow
    Remove-Item "$gClientPath\build\development" -Recurse -Force
    Write-Host "✓ Xóa xong build/development" -ForegroundColor Green
}

# 3. Xóa build/testing
if (Test-Path "$gClientPath\build\testing") {
    Write-Host "Xóa build/testing..." -ForegroundColor Yellow
    Remove-Item "$gClientPath\build\testing" -Recurse -Force
    Write-Host "✓ Xóa xong build/testing" -ForegroundColor Green
}

# 4. Xóa .git folder
if (Test-Path "$gClientPath\.git") {
    Write-Host "Xóa .git..." -ForegroundColor Yellow
    Remove-Item "$gClientPath\.git" -Recurse -Force
    Write-Host "✓ Xóa xong .git" -ForegroundColor Green
}

# 5. Xóa lock files
Write-Host "Xóa lock files..." -ForegroundColor Yellow
Remove-Item "$gClientPath\package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item "$gClientPath\yarn.lock" -Force -ErrorAction SilentlyContinue
Write-Host "✓ Xóa xong lock files" -ForegroundColor Green

# 6. Xóa .cache / .sass-cache
if (Test-Path "$gClientPath\.cache") {
    Write-Host "Xóa .cache..." -ForegroundColor Yellow
    Remove-Item "$gClientPath\.cache" -Recurse -Force
    Write-Host "✓ Xóa xong .cache" -ForegroundColor Green
}

if (Test-Path "$gClientPath\.sass-cache") {
    Write-Host "Xóa .sass-cache..." -ForegroundColor Yellow
    Remove-Item "$gClientPath\.sass-cache" -Recurse -Force
    Write-Host "✓ Xóa xong .sass-cache" -ForegroundColor Green
}

Write-Host "=== Cleanup Hoàn Tất ===" -ForegroundColor Green
Write-Host "Space thoát ra: ~1-2GB" -ForegroundColor Cyan
```

**Chạy script:**
```powershell
# PowerShell (chạy as Admin)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
C:\Projects\cleanup.ps1
```

### 4.3 Cleanup Script (Bash - Linux/Mac)

**File:** `~/Projects/cleanup.sh`

```bash
#!/bin/bash

# Cleanup script cho gClient
gClient_path="$HOME/Projects/gClient"
gclient_build_path="$HOME/Projects/gPortal/gclient-build"

echo "=== Cleanup gClient ===" 

# 1. Xóa node_modules
if [ -d "$gClient_path/node_modules" ]; then
    echo "Xóa node_modules..."
    rm -rf "$gClient_path/node_modules"
    echo "✓ Xóa xong node_modules"
fi

# 2. Xóa build/development
if [ -d "$gClient_path/build/development" ]; then
    echo "Xóa build/development..."
    rm -rf "$gClient_path/build/development"
    echo "✓ Xóa xong build/development"
fi

# 3. Xóa build/testing
if [ -d "$gClient_path/build/testing" ]; then
    echo "Xóa build/testing..."
    rm -rf "$gClient_path/build/testing"
    echo "✓ Xóa xong build/testing"
fi

# 4. Xóa .git
if [ -d "$gClient_path/.git" ]; then
    echo "Xóa .git..."
    rm -rf "$gClient_path/.git"
    echo "✓ Xóa xong .git"
fi

# 5. Xóa lock files
echo "Xóa lock files..."
rm -f "$gClient_path/package-lock.json"
rm -f "$gClient_path/yarn.lock"
echo "✓ Xóa xong lock files"

# 6. Xóa caches
rm -rf "$gClient_path/.cache" 2>/dev/null
rm -rf "$gClient_path/.sass-cache" 2>/dev/null
echo "✓ Xóa xong caches"

echo "=== Cleanup Hoàn Tất ==="
echo "Giải phóng ~1-2GB disk space"

# Kiểm tra gclient-build tồn tại
if [ -d "$gclient_build_path" ]; then
    echo ""
    echo "✓ gclient-build tồn tại, ready để deploy"
    du -sh "$gclient_build_path"
else
    echo ""
    echo "❌ gclient-build KHÔNG tồn tại! Copy từ build/production chưa?"
fi
```

**Chạy script:**
```bash
chmod +x ~/Projects/cleanup.sh
~/Projects/cleanup.sh
```

### 4.4 Cleanup Manual (Nếu Không Dùng Script)

Nếu lười viết script, làm manual:

```
1. Mở File Explorer → gClient folder
2. Xóa folder:
   - node_modules/
   - build/development/
   - build/testing/
   - .git/
   - .sencha/ (tùy chọn)
3. Xóa file:
   - package-lock.json
   - yarn.lock
```

**Dùng 7-Zip hoặc WinRAR kiểm tra:**
- Right-click gClient → Properties
- Xem disk space trước/sau cleanup

---

## Giai Đoạn 5: Kiểm Tra Trước Deploy

### 5.1 Verify Files Tồn Tại

```bash
# PowerShell
Test-Path "C:\Projects\gPortal\gclient-build\app.js"
Test-Path "C:\Projects\gPortal\gclient-build\resources\css\app.css"
Test-Path "C:\Projects\gPortal\Pages\SinhVien.aspx"

# Output: True = OK
```

### 5.2 Build gPortal

```bash
# Visual Studio
# Ctrl + Shift + B (Build Solution)
# Hoặc: Build → Build Solution
```

### 5.3 Test Local

```bash
# Visual Studio
# F5 (Debug) hoặc Ctrl + F5 (Run without Debug)

# Mở browser:
http://localhost:xxxx/Pages/SinhVien.aspx

# Kiểm tra:
1. Trang load OK (không 404)
2. ExtJS UI hiển thị
3. F12 → Network → app.js load OK (200)
4. F12 → Console → Không có error
5. Click nút, gọi API WCF → data hiển thị
```

---

## Giai Đoạn 6: Deploy Lên Server

### 6.1 Publish gPortal

**Cách 1: Visual Studio Publish**
```
1. Right-click gPortal project
2. Publish...
3. Chọn target (IIS, Azure, etc)
4. Publish
```

**Cách 2: Manual Deploy**
```bash
# Zip gPortal folder
gPortal.zip (tất cả files)
  ├── Pages/
  ├── gclient-build/      ← Quan trọng!
  ├── bin/
  ├── obj/
  ├── web.config
  └── ...

# Upload lên server, extract
# IIS sẽ serve gclient-build/app.js + WCF API
```

### 6.2 Verify Production

```
1. Mở: http://production-server.com/Pages/SinhVien.aspx
2. Kiểm tra app.js load OK
3. UI render
4. API call → data show
```

---

## Folder Structure Cuối Cùng

```
gPortal/ (trên server production)
├── Pages/
│   ├── SinhVien.aspx           ← Entry point
│   └── SinhVien.aspx.cs
├── gclient-build/              ← Bundled ExtJS
│   ├── app.js                  ← 500KB-1MB (bundled)
│   ├── bootstrap.js
│   └── resources/
│       └── css/, images/
├── Services/
│   └── SinhVienService.svc     ← WCF service
├── bin/
│   └── (DLLs)
├── web.config
└── ...

Total size: ~20-30MB (vs 500MB+ nếu không cleanup)
```

---

## Size So Sánh

| Folder | Trước Cleanup | Sau Cleanup | Tiết Kiệm |
|--------|---------------|------------|----------|
| gClient/node_modules | ~600MB | 0MB | 600MB |
| gClient/build/dev + test | ~200MB | 0MB | 200MB |
| gClient/.git | ~50MB | 0MB | 50MB |
| gClient tổng | ~1GB+ | ~100MB | ~900MB |
| gPortal/gclient-build | ~10MB | ~10MB | 0MB |
| **Tổng gPortal** | ~50MB | **~30MB** | **~20MB** |

---

## Checklist Trước Deploy

- [ ] Build production: `sencha app build production`
- [ ] Copy vào gclient-build/: `xcopy ...` hoặc script
- [ ] Tạo SinhVien.aspx & .aspx.cs
- [ ] Config web.config (nếu cần)
- [ ] Run cleanup script
- [ ] Kiểm tra app.js tồn tại
- [ ] Test local (F5)
- [ ] Verify:
  - [ ] URL .aspx load OK
  - [ ] app.js load OK (DevTools)
  - [ ] ExtJS UI render
  - [ ] API call thành công
- [ ] Publish / Deploy lên server
- [ ] Test production URL

---

## Troubleshooting

| Lỗi | Nguyên Nhân | Fix |
|-----|-----------|-----|
| 404 SinhVien.aspx | File .aspx sai path | Kiểm tra file tồn tại trong Pages/ |
| app.js not found | Copy production thất bại | Copy lại, verify app.js tồn tại |
| ExtJS blank page | app.js không load | F12 Network, check 404/500 |
| CORS error | WCF config | Config webHttpBinding + allowCrossDomainScriptAccess |
| API 404 | URL WCF sai | Verify WCF service URL |

---

## Ghi Chú

✅ **Cách 2 phù hợp khi:**
- Code ExtJS ổn định
- Muốn optimize performance
- Deploy production

❌ **Cách 2 không phù hợp khi:**
- Còn dev ExtJS (phải rebuild mỗi lần)
- Cần hot-reload (Cách 1 tốt hơn)

**Nếu còn dev:** Dùng Cách 1 (symlink), khi release dùng Cách 2 (build)

---

## Tài Liệu Tham Khảo

- Sencha Cmd Build: https://docs.sencha.com/cmd/guides/advanced_cmd/build.html
- ExtJS Modern: https://docs.sencha.com/extjs/
- ASP.NET Page: https://docs.microsoft.com/en-us/aspnet/web-forms/
