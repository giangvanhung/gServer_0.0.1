# API Reference

**Base URL:** `http://localhost:52106/LayerService.svc`  
**Format:** JSON (request & response)  
**Headers:** `Content-Type: application/json`, `Accept: application/json`

!!! warning "HTTP status luôn là 200"
    Server luôn trả `200 OK` kể cả khi nghiệp vụ thất bại. Kiểm tra `result.Success` trong body.

---

## Data Models

=== "ServiceResult"
    ```json
    {
      "Success": true,
      "Message": "Tạo thành công",
      "Data": { }
    }
    ```

=== "Layer"
    ```json
    {
      "Id": 1,
      "Name": "Ranh giới tỉnh",
      "Source": "shapefile.shp",
      "Description": "Ranh giới hành chính cấp tỉnh",
      "LayerType": "POLYGON",
      "IsVisible": true,
      "Opacity": 1.0,
      "MinZoom": 0,
      "MaxZoom": 22
    }
    ```

=== "Feature"
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

=== "FeatureCollection"
    ```json
    {
      "Type": "FeatureCollection",
      "Features": [ ],
      "BoundingBox": {
        "MinLon": 105.80, "MinLat": 21.00,
        "MaxLon": 105.90, "MaxLat": 21.10
      }
    }
    ```

---

## Layer Endpoints

### `GET /layers`
Lấy danh sách tất cả layer.

**Response:** `ServiceResult<LayerListDto[]>`
```json
{
  "Success": true,
  "Data": [
    { "Id": 1, "Name": "Ranh giới tỉnh", "LayerType": "POLYGON", "IsVisible": true },
    { "Id": 2, "Name": "Trường học",     "LayerType": "POINT",   "IsVisible": true }
  ]
}
```

---

### `POST /layers`
Tạo layer mới.

**Body:**
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

### `PUT /layers/{Id}`
Cập nhật thông tin layer.

**Body:** Tương tự POST, thêm `Id`.  
**Response:** `ServiceResult<int>` — `Data` là Id vừa cập nhật.

---

### `DELETE /layers/{Id}`
Xóa layer và **tất cả features** thuộc layer đó (ON DELETE CASCADE).

**Response:** `ServiceResult<int>`

---

## Feature Endpoints

### `GET /layers/{layerId}/features`
Lấy danh sách features của layer — **chỉ Id + Properties, không có GeomWkt**.

Dùng để render bảng thuộc tính (attribute table) — không cần vẽ lên bản đồ.

**Response:** `FeatureInfoCollection`
```json
{
  "Type": "FeatureInfoCollection",
  "Features": [
    { "Id": "1", "GeomWkt": null, "Properties": { "ten": "BV Bạch Mai" } }
  ]
}
```

---

### `POST /layers/{layerId}/features`
Thêm feature mới vào layer.

**Body:**
```json
{
  "Id": "0",
  "GeomWkt": "POINT (105.845 21.028)",
  "Properties": "{\"ten\":\"BV Bạch Mai\",\"loai\":\"bệnh viện\"}"
}
```

!!! note "Properties format"
    FE gửi `Properties` dưới dạng **JSON string**, không phải object.

**Response:** `ServiceResult<int>` — `Data` là Id feature mới.

---

### `PUT /features/{id}`
Cập nhật feature (geometry + properties).

**Body:** Tương tự POST.  
**Response:** `ServiceResult<int>`

---

### `DELETE /features/{id}`
Xóa feature.

**Response:** `ServiceResult<int>`

---

### `GET /features/{id}`
Lấy đầy đủ thông tin feature (GeomWkt + Properties).

**Response:**
```json
{
  "Id": "42",
  "GeomWkt": "POINT (105.845 21.028)",
  "Properties": { "ten": "BV Bạch Mai" }
}
```

---

### `GET /features/{featureId}/geometry`
Lấy **chỉ geometry** của feature (không có Properties).

Dùng khi cần vẽ nhanh lên bản đồ mà không cần thuộc tính.

**Response:**
```json
{
  "Id": "42",
  "GeomWkt": "POLYGON ((105.80 21.00, ...))",
  "Properties": {}
}
```

---

### `POST /layers/{layerId}/features-batch`
Lấy geometry của **nhiều features** theo danh sách ID — kèm BoundingBox.

Dùng khi tick nhiều features cùng lúc (debounce batch).

**Body:**
```json
{ "featureIds": [1, 2, 3, 15, 22] }
```

**Response:** `FeatureCollection` với `BoundingBox` bao toàn bộ nhóm.

---

### `POST /identify`
Truy vấn không gian: tìm features **giao** với điểm click trên bản đồ.

Tìm trên **tất cả layers** cùng lúc, trong bán kính ~5m.

**Body:**
```json
{ "lon": 105.845, "lat": 21.028 }
```

**Response:** `FeatureCollection`
```json
{
  "Features": [
    { "Id": "5", "GeomWkt": "POLYGON (...)", "Properties": { "ten": "Khu vực A" } }
  ]
}
```

---

### `POST /layers/{layerId}/features/import`
Bulk import nhiều features cùng lúc (từ file shapefile đã parse).

**Body:** `FeatureCollection`
```json
{
  "Features": [
    { "GeomWkt": "POINT (105.8 21.0)", "Properties": { "ten": "..." } },
    { "GeomWkt": "POINT (105.9 21.1)", "Properties": { "ten": "..." } }
  ]
}
```

**Response:** `ServiceResult<bool>` — `Data: true` nếu thành công.

---

## Bảng tóm tắt

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/layers` | Danh sách layer |
| POST | `/layers` | Tạo layer |
| PUT | `/layers/{Id}` | Sửa layer |
| DELETE | `/layers/{Id}` | Xóa layer |
| GET | `/layers/{id}/features` | Features của layer (không Geom) |
| POST | `/layers/{id}/features` | Thêm feature |
| PUT | `/features/{id}` | Sửa feature |
| DELETE | `/features/{id}` | Xóa feature |
| GET | `/features/{id}` | Feature đầy đủ |
| GET | `/features/{id}/geometry` | Chỉ Geom |
| POST | `/layers/{id}/features-batch` | Batch theo ID list |
| POST | `/identify` | Spatial query tại điểm click |
| POST | `/layers/{id}/features/import` | Bulk import |
