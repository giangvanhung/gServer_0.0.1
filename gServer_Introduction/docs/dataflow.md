# Luồng dữ liệu

## Luồng khởi tạo bản đồ

```mermaid
sequenceDiagram
    participant B as Trình duyệt
    participant E as ExtJS App
    participant LC as LayerController
    participant OL as OpenLayers
    participant WCF as gServer WCF

    B->>E: Load index.html
    E->>LC: initOpenLayersMap (painted event)
    LC->>OL: new ol.Map + ol.source.Vector

    E->>LC: getLayers (painted event)
    LC->>WCF: GET /LayerService.svc/layers
    WCF-->>LC: [{Id, Name, LayerType, IsVisible...}]
    LC->>E: Tạo FeatureGrid cho mỗi layer

    Note over E: Grid painted → featureStore.load()
    E->>WCF: GET /LayerService.svc/layers/{id}/features
    WCF-->>E: [{Id, Properties, checked:false}]
```

## Luồng bật feature lên bản đồ

```mermaid
flowchart TD
    A[Người dùng tick checkbox] --> B{record.get Geom\ncó sẵn trong cache?}
    B -->|Có| C[drawWktOnMap ngay\nkhông tốn API call]
    B -->|Không| D[Thêm vào globalPendingQueue]
    D --> E[clearTimeout + setTimeout 400ms]
    E --> F{Hết 400ms\nqueue có bao nhiêu ID?}
    F -->|1 ID| G[GET /features/id/geometry]
    F -->|2+ ID| H[POST /layers/id/features-batch]
    G --> I[drawWktOnMap]
    H --> J[drawWktOnMap × N\n+ zoomToBoundingBox]
    C --> K[Hiển thị trên bản đồ]
    I --> K
    J --> K
```

## Luồng tắt feature

```mermaid
flowchart LR
    A[Bỏ tick checkbox] --> B[isTicked = false]
    B --> C[vectorSource.removeFeature by ID]
    C --> D[Xóa khỏi globalPendingQueue\nnếu đang chờ batch]
    D --> E[Feature biến mất khỏi bản đồ]
```

## Luồng CRUD Layer

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant G as LayerGrid
    participant S as LayerStore
    participant WCF as gServer

    U->>G: Click nút Thêm
    G->>S: store.insert(0, newRecord)
    G->>G: plugin.startEdit(newRecord)
    U->>G: Nhập thông tin, nhấn Lưu
    G->>S: store.sync()
    S->>WCF: POST /layers (tạo mới)
    WCF-->>S: {Success:true, Data:{Id:5, Name:...}}
    S->>G: store.load() — refresh Grid

    U->>G: Double click dòng → sửa
    G->>S: store.sync()
    S->>WCF: PUT /layers/5
    WCF-->>S: {Success:true}

    U->>G: Click nút Xóa
    G->>WCF: DELETE /layers/5
    WCF-->>G: {Success:true}
    G->>S: store.load()
```

## Luồng Import Feature

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant G as FeatureGrid
    participant WCF as gServer

    U->>G: Chọn file GeoJSON / paste WKT
    G->>WCF: POST /layers/{id}/features/import\n{Features:[{GeomWkt, Properties}...]}
    WCF-->>G: {Success:true, Data:true, Message:"Import X features thành công"}
    G->>G: featureStore.load() — refresh
```

## Luồng Identify

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant OL as OpenLayers
    participant LC as LayerController
    participant WCF as gServer

    U->>OL: Click lên bản đồ
    OL->>LC: map click event (pixel)
    LC->>OL: map.getCoordinateFromPixel → [lon, lat]
    LC->>WCF: POST /LayerService.svc/identify\n{lon: 105.83, lat: 21.02}
    WCF-->>LC: FeatureCollection (features giao vùng buffer 5m)
    LC->>OL: drawWktOnMap cho từng feature
    LC->>LC: Hiển thị popup thông tin
```

## Tối ưu hiệu năng

| Vấn đề | Giải pháp |
|---|---|
| N request khi tick nhanh | Debounce 400ms + gom batch |
| Gọi API lại khi tick cùng feature | Cache `Geom` vào Ext record |
| Re-render khi cập nhật cache | `record.set('Geom', wkt, {silent: true})` |
| Bản đồ không vừa vùng mới | `zoomToBoundingBox` sau mỗi batch response |
| Identify chậm trên bảng lớn | Spatial Index `GEOMETRY_AUTO_GRID` |
