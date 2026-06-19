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
    LC->>OL: new ol.Map({ target, layers, view })
    LC->>OL: new ol.source.Vector() + addLayer

    E->>LC: getLayers (painted event)
    LC->>WCF: GET /LayerService.svc/layers
    WCF-->>LC: [{Id, Name, LayerType...}]
    LC->>E: Tạo Grid cho mỗi layer
    Note over E: Grid painted → featureStore.load()
    E->>WCF: GET /layers/{id}/features
    WCF-->>E: [{Id, Properties, checked:false}]
```

## Luồng bật feature lên bản đồ

```mermaid
flowchart TD
    A[Người dùng tick checkbox] --> B{record.get Geom\ncó sẵn?}
    B -->|Có| C[drawWktOnMap ngay\nkhông tốn API]
    B -->|Không| D[Thêm vào globalPendingQueue]
    D --> E[clearTimeout + setTimeout 400ms]
    E --> F{Hết 400ms\nqueue có mấy ID?}
    F -->|1 ID| G[GET /features/id/geometry]
    F -->|≥2 ID| H[POST /layers/id/features-batch]
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
    B --> C[vectorSource.removeFeatureById]
    C --> D[Xóa khỏi globalPendingQueue\nnếu đang đợi]
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
    U->>G: Nhập thông tin, nhấn lưu
    G->>S: store.sync()
    S->>WCF: POST /layers (create) hoặc PUT /layers/{id}
    WCF-->>S: {Success:true, Data:{Id:...}}
    S->>G: store.load() — refresh Grid
```

## Tối ưu hiệu năng

| Vấn đề | Giải pháp |
|---|---|
| N request khi tick nhanh | Debounce 400ms + gom batch |
| Gọi API lại khi tick cùng feature | Cache `Geom` vào record, check trước |
| Re-render khi cập nhật cache | `record.set('Geom', wkt, {silent: true})` |
| Bản đồ không vừa vùng mới | `zoomToBoundingBox` sau mỗi batch |
