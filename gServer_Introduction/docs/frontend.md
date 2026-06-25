# Frontend — gClient

## Tổng quan

gClient là ứng dụng **ExtJS 8** chạy qua webpack dev server (Sencha Cmd), giao tiếp với gServer qua `Ext.Ajax.request` và hiển thị bản đồ bằng **OpenLayers**.

## Sơ đồ thành phần

```mermaid
graph TD
    APP[Application.js<br/>getApiHost] --> LC[LayerController.js<br/>Ext.app.Controller]
    LC --> MP[MapPanel<br/>cls=map-DPHCC-cls]
    LC --> LP[LayerPanel<br/>cls=layers-DPHCC-cls]
    LP --> LG[Ext.grid.Grid<br/>per layer]
    LG --> FS[FeatureStore<br/>REST proxy]
    LC --> OL[ol.Map<br/>VectorSource]
    LC -->|drawWktOnMap| OL
    LC -->|zoomToBoundingBox| OL
```

## LayerController — Trung tâm điều phối

| Phương thức | Kích hoạt | Vai trò |
|---|---|---|
| `initOpenLayersMap` | `painted` trên MapPanel | Khởi tạo `ol.Map`, `ol.source.Vector` |
| `getLayers` | `painted` trên LayerPanel | Gọi GET `/layers`, tạo Grid cho từng layer |
| `handleFeatureToggle` | `checkchange` trên CheckColumn | Điều phối: cache / single / batch |
| `sendSingleGeometryRequest` | 1 feature đang chờ | GET `/features/{id}/geometry` |
| `sendBatchGeometryRequest` | ≥2 features đang chờ | POST `/layers/{id}/features-batch` |
| `drawWktOnMap` | Sau khi có WKT | Parse WKT → `ol.Feature` → render |
| `zoomToBoundingBox` | Sau batch response | Zoom map vừa khít vùng dữ liệu mới |

## Cơ chế Debounce + Batch

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant C as LayerController
    participant Q as globalPendingQueue
    participant S as gServer

    U->>C: Tick feature A (layer 1)
    C->>Q: push A vào queue[layer1]
    C->>C: clearTimeout + setTimeout 400ms

    U->>C: Tick feature B (layer 1) trong 400ms
    C->>Q: push B vào queue[layer1]
    C->>C: reset timer 400ms

    Note over C: Hết 400ms...

    C->>Q: đọc queue[layer1] = [A, B]
    C->>S: POST /layers/1/features-batch {featureIds:[A,B]}
    S-->>C: {Features:[...], BoundingBox:{...}}
    C->>C: drawWktOnMap cho từng feature
    C->>C: zoomToBoundingBox
```

## Render lên bản đồ (drawWktOnMap)

```
WKT string (từ API)
       ↓
ol.format.WKT().readFeature(wkt, {
    dataProjection: 'EPSG:4326',
    featureProjection: map.getView().getProjection()
})
       ↓
Gán ol.style.Style (fill, stroke, circle)
       ↓
vectorSource.addFeature(olFeature)
       ↓
OpenLayers tự render lên canvas
```

## Quản lý style động

Màu sắc lấy từ `LayerStyle` (API `/layers/{id}/style`), fallback về `#1890ff`:

| Loại | Style |
|---|---|
| `POLYGON` | `ol.style.Fill` + `ol.style.Stroke` |
| `LINESTRING` | Chỉ `ol.style.Stroke` |
| `POINT` | `ol.style.Circle` với fill + viền trắng |

## Cấu trúc thư mục

```
gClient_ExtJS/
└── g-client/
    ├── app/
    │   ├── Application.js          ← Cấu hình apiHost
    │   ├── controller/
    │   │   └── LayerController.js  ← Toàn bộ logic
    │   ├── view/
    │   │   ├── map/MapPanel.js
    │   │   └── EditLayer/
    │   │       ├── LayerGrid.js    ← Grid quản lý Layer
    │   │       └── FeatureGrid.js  ← Grid per-layer
    │   ├── store/
    │   │   ├── LayerStore.js
    │   │   └── FeatureStore.js
    │   └── model/
    │       ├── LayerModel.js
    │       └── FeatureModel.js
    ├── index.html
    └── app.json                    ← Sencha Cmd config
```

## Khởi động

```powershell
# PowerShell
.\run-client.ps1          # webpack-dev-server port 1962
```

```bash
# Bash (WSL)
./run-client.sh
```

Mở trình duyệt: `http://localhost:1962`
