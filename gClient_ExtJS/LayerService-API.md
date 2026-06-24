# LayerService API

**Base URL:** `http://localhost:52106/LayerService.svc`  
**Format:** JSON (request & response)  
**Headers bắt buộc:** `Content-Type: application/json`, `Accept: application/json`

---

## Data Models

### LayerListDto
```json
{
  "Id": 1,
  "Name": "Trường đại học",
  "LayerType": "POINT",
  "IsVisible": true
}
```

### LayerSaveDto
```json
{
  "Id": 0,
  "Name": "Tên layer",
  "Source": "shapefile.shp",
  "Description": "Mô tả",
  "LayerType": "POINT",
  "IsVisible": true,
  "Opacity": 1.0,
  "MinZoom": 0,
  "MaxZoom": 22
}
```
> `LayerType` nhận: `"POINT"` | `"LINESTRING"` | `"POLYGON"`

### Feature
```json
{
  "Id": "42",
  "GeomWkt": "POINT (105.8 21.0)",
  "Properties": {
    "ten": "Trường ĐH Bách Khoa",
    "dien_tich": 12500
  }
}
```

### FeatureCollection
```json
{
  "Type": "FeatureCollection",
  "Features": [ /* Feature[] */ ],
  "BoundingBox": {
    "MinLon": 105.80,
    "MaxLon": 105.85,
    "MinLat": 21.00,
    "MaxLat": 21.05,
    "CenterLon": 105.825,
    "CenterLat": 21.025
  }
}
```

### FeatureInfoCollection
Giống `FeatureCollection` nhưng `Feature` chỉ có `Id` và `Properties`, **không có** `GeomWkt`.
```json
{
  "Type": "FeatureInfoCollection",
  "Features": [
    { "Id": "1", "GeomWkt": null, "Properties": { "ten": "..." } }
  ],
  "BoundingBox": null
}
```

### ServiceResult\<T\>
```json
{
  "Success": true,
  "Message": "Tạo lớp bản đồ mới thành công!",
  "Data": { /* T */ }
}
```

---

## Endpoints

### 1. Lấy danh sách Layer

```
GET /layers
```

**Response:** `ServiceResult<LayerListDto[]>`

```json
{
  "Success": true,
  "Message": null,
  "Data": [
    { "Id": 8, "Name": "Sân bóng nhân tạo", "LayerType": "POINT", "IsVisible": true },
    { "Id": 1, "Name": "Ranh giới hành chính", "LayerType": "POLYGON", "IsVisible": true }
  ]
}
```

---

### 2. Tạo Layer mới

```
POST /layers
```

**Body:** `LayerSaveDto` (không cần `Id`)

```json
{
  "Name": "Bệnh viện",
  "Description": "Lớp điểm bệnh viện",
  "LayerType": "POINT",
  "IsVisible": true,
  "Opacity": 1.0,
  "MinZoom": 0,
  "MaxZoom": 22
}
```

**Response:** `ServiceResult<LayerSaveDto>` — `Data.Id` là ID mới sinh ra.

---

### 3. Cập nhật Layer

```
PUT /layers/{Id}
```

**Body:** `LayerSaveDto` (có hoặc không cần `Id` trong body — server lấy từ URL)

**Response:** `ServiceResult<int>` — `Data` là `Id` vừa cập nhật.

---

### 4. Xóa Layer

```
DELETE /layers/{Id}
```

**Response:** `ServiceResult<int>` — `Data` là `Id` vừa xóa.

---

### 5. Import Features vào Layer

```
POST /layers/{layerId}/features/import
```

**Body:** `FeatureCollection` — danh sách Feature với `GeomWkt` và `Properties`.

```json
{
  "Features": [
    {
      "GeomWkt": "POINT (105.845 21.028)",
      "Properties": { "ten": "BV Bạch Mai", "loai": "bệnh viện" }
    }
  ]
}
```

**Response:** `ServiceResult<bool>` — `Data: true` nếu thành công.

---

### 6. Lấy danh sách Features của Layer (chỉ thuộc tính, không có geometry)

```
GET /layers/{layerId}/features
```

**Response:** `FeatureInfoCollection` — mảng Feature chứa `Id` + `Properties`, **không có** `GeomWkt`.

Dùng khi cần hiển thị bảng thuộc tính (attribute table) mà không cần vẽ lên bản đồ.

---

### 7. Lấy Geometry của một Feature

```
GET /features/{featureId}/geometry
```

**Response:** `Feature` — chỉ có `Id` và `GeomWkt`, không có `Properties`.

```json
{
  "Id": "1",
  "GeomWkt": "POLYGON ((105.80207 21.38459, ...))",
  "Properties": {}
}
```

---

### 8. Lấy đầy đủ thông tin một Feature (geometry + thuộc tính)

```
GET /features/{id}
```

**Response:** `Feature` — đầy đủ `Id`, `GeomWkt`, và `Properties`.

```json
{
  "Id": "42",
  "GeomWkt": "POINT (105.845 21.028)",
  "Properties": {
    "ten": "BV Bạch Mai",
    "loai": "bệnh viện"
  }
}
```

---

### 9. Lấy nhiều Features theo danh sách ID (Batch)

```
POST /layers/{layerId}/features-batch
```

**Body:**
```json
{
  "featureIds": [1, 2, 3, 15, 22]
}
```

**Response:** `FeatureCollection` — kèm `BoundingBox` bao toàn bộ nhóm.

Dùng khi cần zoom-to-selection hoặc highlight nhiều đối tượng cùng lúc.

---

### 10. Identify — Truy vấn không gian tại một điểm click

```
POST /identify
```

**Body:**
```json
{
  "lon": 105.845,
  "lat": 21.028
}
```

**Response:** `FeatureCollection` — tất cả Feature thuộc mọi Layer có geometry **giao** với điểm click (buffer ~5m).

```json
{
  "Type": "FeatureCollection",
  "Features": [
    {
      "Id": "42",
      "GeomWkt": "POLYGON (...)",
      "Properties": { "ten": "BV Bạch Mai" }
    }
  ],
  "BoundingBox": null
}
```

> **Lưu ý:** Endpoint này tìm trên **tất cả Layer** cùng lúc. Kết quả trả về cần FE tự phân biệt layer nếu cần.

---

## Luồng tương tác điển hình cho FE

```
1. Khởi động
   GET /layers
   → Render danh sách layer vào panel bên trái

2. Click bật layer
   GET /layers/{id}/features   (lấy thuộc tính để render bảng)
   → song song →
   GET /features/{id}/geometry (lấy WKT cho từng feature, vẽ lên map)

3. Người dùng click vào bản đồ
   POST /identify { lon, lat }
   → Highlight feature trên map + hiện popup thuộc tính

4. Người dùng click vào feature trong bảng
   GET /features/{id}
   → Zoom to + hiện đầy đủ thông tin

5. Chọn nhiều feature (shift-click, lasso)
   POST /layers/{layerId}/features-batch { featureIds: [...] }
   → Zoom to BoundingBox của nhóm + highlight

6. Thêm / sửa / xóa layer
   POST /layers    (tạo mới)
   PUT  /layers/1  (sửa)
   DELETE /layers/1

7. Nạp dữ liệu shapefile đã parse
   POST /layers/{id}/features/import
```

---

## Error Handling

| Trường hợp | HTTP | Body |
|---|---|---|
| Id không phải số | 400 | `"Id không hợp lệ"` |
| Tên layer trùng | 200 | `{ "Success": false, "Message": "Tên Layer đã tồn tại..." }` |
| Lỗi server | 200 | `{ "Success": false, "Message": "Lỗi hệ thống: ..." }` |
| Không tìm thấy | 200 | `{ "Success": false, "Message": "..." }` hoặc object rỗng |

> Server trả về **HTTP 200** ngay cả khi nghiệp vụ thất bại. FE luôn kiểm tra `Success` trong response body.
