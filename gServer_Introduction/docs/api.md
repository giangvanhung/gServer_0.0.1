# API Reference

## Base URL

| Service | Base URL |
|---|---|
| LayerService | `http://localhost:52106/LayerService.svc/` |
| LayerStyleService | `http://localhost:52106/LayerStyle.svc/` |

Response format luôn là **JSON**. Hầu hết endpoint trả `ServiceResult<T>`:

```json
{ "Success": true, "Message": "...", "Data": { ... } }
```

---

## LayerService — Layer CRUD

### <span class="badge badge-get">GET</span> `/layers`

Lấy danh sách tất cả layer.

**Response:**
```json
{
  "Success": true,
  "Data": [
    {
      "Id": 1, "Name": "Điểm dân cư", "LayerType": "point",
      "IsVisible": true, "Opacity": 1.0, "MinZoom": 0, "MaxZoom": 22
    }
  ]
}
```

---

### <span class="badge badge-post">POST</span> `/layers`

Tạo layer mới.

**Body:**
```json
{
  "Name": "Điểm dân cư",
  "Source": "local",
  "Description": "Mô tả tùy chọn",
  "LayerType": "point",
  "IsVisible": true,
  "Opacity": 1.0,
  "MinZoom": 0,
  "MaxZoom": 22
}
```

**Response:** `ServiceResult<LayerSaveDto>` với `Data.Id` là Id vừa tạo.

---

### <span class="badge badge-put">PUT</span> `/layers/{Id}`

Cập nhật layer. Body giống POST (có thêm `Id`).

---

### <span class="badge badge-delete">DELETE</span> `/layers/{Id}`

Xóa layer và tất cả feature liên quan (cascade).

**Response:**
```json
{ "Success": true, "Message": "Xóa lớp bản đồ thành công!", "Data": 1 }
```

---

## LayerService — Feature CRUD

### <span class="badge badge-get">GET</span> `/layers/{layerId}/features`

Lấy danh sách feature của layer — **chỉ properties, không có geometry**.

**Response:**
```json
{
  "Success": true,
  "Data": [
    { "Id": 10, "LayerId": 1, "Properties": "{\"ten\":\"Hà Nội\"}" }
  ]
}
```

---

### <span class="badge badge-post">POST</span> `/layers/{layerId}/features`

Thêm 1 feature vào layer.

**Body:**
```json
{
  "GeomWkt": "POINT(105.8342 21.0278)",
  "Properties": "{\"ten\": \"Hà Nội\", \"dan_so\": 8000000}"
}
```

---

### <span class="badge badge-put">PUT</span> `/features/{id}`

Cập nhật geometry và properties của feature.

**Body:**
```json
{
  "GeomWkt": "POINT(105.8342 21.0278)",
  "Properties": "{\"ten\": \"Hà Nội cập nhật\"}"
}
```

---

### <span class="badge badge-delete">DELETE</span> `/features/{id}`

Xóa feature.

---

### <span class="badge badge-get">GET</span> `/features/{id}`

Lấy feature đầy đủ (geometry WKT + properties).

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Id": 10, "LayerId": 1,
    "GeomWkt": "POINT(105.8342 21.0278)",
    "Properties": "{\"ten\":\"Hà Nội\"}"
  }
}
```

---

### <span class="badge badge-get">GET</span> `/features/{featureId}/geometry`

Lấy chỉ WKT geometry của feature (nhẹ hơn GET đầy đủ).

**Response:**
```json
{ "Id": 10, "GeomWkt": "POINT(105.8342 21.0278)" }
```

---

## LayerService — Thao tác nâng cao

### <span class="badge badge-post">POST</span> `/layers/{layerId}/features-batch`

Lấy geometry của nhiều feature cùng lúc theo danh sách ID.
Trả thêm `BoundingBox` để FE zoom vừa khít vùng dữ liệu.

**Body:**
```json
{ "featureIds": [1, 2, 3, 4] }
```

**Response:**
```json
{
  "Features": [
    { "Id": 1, "GeomWkt": "POINT(105.0 21.0)", "Properties": "{...}" }
  ],
  "BoundingBox": {
    "MinX": 104.5, "MinY": 20.8,
    "MaxX": 106.0, "MaxY": 21.5
  }
}
```

---

### <span class="badge badge-post">POST</span> `/layers/{layerId}/features/import`

Import hàng loạt `FeatureCollection` vào layer (từ file GeoJSON, dữ liệu cũ…).

**Body:**
```json
{
  "Features": [
    { "GeomWkt": "POINT(105.0 21.0)", "Properties": "{\"name\":\"A\"}" },
    { "GeomWkt": "POINT(106.0 22.0)", "Properties": "{\"name\":\"B\"}" }
  ]
}
```

---

### <span class="badge badge-post">POST</span> `/identify`

Tìm tất cả feature giao với điểm lon/lat (buffer 5m). Dùng Spatial Index.

**Body:**
```json
{ "lon": 105.8342, "lat": 21.0278 }
```

**Response:**
```json
{
  "Success": true,
  "Data": [
    { "Id": 10, "LayerId": 1, "GeomWkt": "POINT(105.8342 21.0278)", "Properties": "{...}" }
  ]
}
```

---

## LayerStyleService

| Method | Endpoint | Mô tả |
|---|---|---|
| <span class="badge badge-get">GET</span> | `/layerstyles` | Lấy tất cả style |
| <span class="badge badge-get">GET</span> | `/layerstyles/{id}` | Lấy style theo Id |
| <span class="badge badge-get">GET</span> | `/layers/{layerId}/style` | Lấy style của layer |
| <span class="badge badge-post">POST</span> | `/layerstyles` | Tạo style mới |
| <span class="badge badge-put">PUT</span> | `/layerstyles/{id}` | Cập nhật style |
| <span class="badge badge-delete">DELETE</span> | `/layerstyles/{id}` | Xóa style theo Id |
| <span class="badge badge-delete">DELETE</span> | `/layers/{layerId}/style` | Xóa style của layer |

**Body POST/PUT:**
```json
{
  "LayerId": 1,
  "FillColor": "#3399CC",
  "StrokeColor": "#FFFFFF",
  "StrokeWidth": 1.5,
  "IconUrl": null
}
```

**Response GET `/layers/{layerId}/style`:**
```json
{
  "Success": true,
  "Data": {
    "Id": 3, "LayerId": 1,
    "FillColor": "#FF5722", "StrokeColor": "#FFFFFF",
    "StrokeWidth": 2.0, "IconUrl": null
  }
}
```

---

## Mã lỗi

| HTTP | Tình huống | `Success` | `Message` |
|---|---|---|---|
| 200 | Thành công | `true` | Thông báo success |
| 200 | Lỗi nghiệp vụ | `false` | Lý do cụ thể (ví dụ: "Tên layer đã tồn tại") |
| 200 | Id không hợp lệ | `false` | `"Id không hợp lệ!"` |
| 200 | Lỗi hệ thống | `false` | `"Lỗi hệ thống: ..."` |

!!! note "HTTP status luôn là 200"
    WCF `webHttpBinding` trả 200 cho mọi response. Lỗi nghiệp vụ được phân biệt
    qua `Success: false` trong body JSON, không phải HTTP 4xx/5xx.
