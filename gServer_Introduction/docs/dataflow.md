# Luồng dữ liệu

## 1. Khởi tạo bản đồ

```mermaid
sequenceDiagram
    participant B  as Trình duyệt
    participant E  as ExtJS App
    participant LC as LayerController
    participant OL as OpenLayers
    participant WCF as gServer

    B->>E: Load index.html
    E->>LC: initOpenLayersMap (painted — MapPanel)
    LC->>OL: new ol.Map + ol.source.Vector + ol.layer.Vector

    E->>LC: getLayers (painted — LayerPanel)
    LC->>WCF: GET /LayerService.svc/layers
    WCF-->>LC: [{Id, Name, LayerType, IsVisible...}]
    LC->>E: Tạo Ext.grid.Grid + FeatureStore cho mỗi layer

    Note over E: Grid painted → FeatureStore.load()
    E->>WCF: GET /LayerService.svc/layers/{id}/features
    WCF-->>E: [{Id, Properties}]  ← chỉ metadata, không geometry
```

---

## 2. Bật layer (eye toggle)

```mermaid
flowchart TD
    A["Click Eye ON"] --> B{"layerFeaturesCache\ncó dữ liệu?"}
    B -->|Có cache| C["fetchAndCacheLayerStyle(layerId)"]
    B -->|Không có| D["layerLoading guard\nGET /features\nPOST /features-batch"]
    D --> E["Lưu vào layerFeaturesCache"]
    E --> C
    C --> F{"layerStyles cache?"}
    F -->|Đã có| G["_drawFromCache(layerId, style)"]
    F -->|Chưa có| H["GET /layers/id/style\n→ cache layerStyles"]
    H --> G
    G --> I["Vẽ từng feature\nbỏ qua hiddenFeatureIds"]
    I --> J["zoomToBoundingBox"]
```

---

## 3. Tắt layer (eye toggle)

```mermaid
flowchart LR
    A["Click Eye OFF"] --> B["clearLayerFromMap(layerId)"]
    B --> C["vectorSource.removeFeature × N\n(lọc theo layerFeatureIds)"]
    C --> D["layerFeatureIds[layerId] = []"]
    D --> E["layerToggleState[layerId] = false"]
    E --> F["Feature biến mất — cache vẫn còn\n(bật lại sẽ dùng cache)"]
```

---

## 4. Bật/tắt feature riêng lẻ (checkbox)

```mermaid
flowchart TD
    A["Click checkbox feature"] --> B{"record.get('checked')?"}

    B -->|false — tắt| C["hiddenFeatureIds[lid][fid] = true"]
    C --> D["vectorSource.removeFeature(olFeature)"]
    D --> E["Xóa khỏi layerFeatureIds"]
    E --> F["Đóng panel nếu đang mở cho feature này"]

    B -->|true — bật| G["delete hiddenFeatureIds[lid][fid]"]
    G --> H["fetchAndCacheLayerStyle(layerId)"]
    H --> I{"record.get('Geom')\ncó trong store?"}
    I -->|Có| J["drawWktOnMap(geom, fid, style)"]
    I -->|Không| K["fetchGeomAndDraw\nGET /features/id/geometry"]
    K --> J
    J --> L["Zoom đến feature"]
```

---

## 5. Click row feature (itemtap)

```mermaid
flowchart TD
    A["itemtap — click row"] --> B{"_checkboxJustChanged?\n(150ms flag)"}
    B -->|true| Z["Bỏ qua — do checkbox gây ra"]
    B -->|false| C{"Feature đang\ncó trên map?"}
    C -->|Có| D["vectorSource.removeFeature\nXóa khỏi layerFeatureIds"]
    D --> E{"currentPanelFeatureId\n=== featureId?"}
    E -->|Đúng| F["hideFeaturePanel()"]
    E -->|Không| G["(không làm gì)"]
    C -->|Không có| H{"currentPanelFeatureId\n=== featureId?"}
    H -->|Đúng| I["hideFeaturePanel() — toggle đóng"]
    H -->|Khác| J["showFeaturePanel(title, props, fid)"]
    J --> K["fetchGeomAndZoom\nZoom đến feature trên map"]
```

---

## 6. Luồng CRUD Layer

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant G as LayerGrid (EditLayer)
    participant WCF as gServer

    U->>G: Click nút Thêm Layer
    G->>G: Mở LayerCRUDPanel (floated modal)
    U->>G: Nhập thông tin → Lưu
    G->>WCF: POST /layers
    WCF-->>G: {Success:true, Data:{Id:5, Name:...}}
    G->>G: store.load() — refresh Grid

    U->>G: Click Edit Layer
    G->>G: Mở LayerCRUDPanel (điền sẵn data)
    U->>G: Sửa → Lưu
    G->>WCF: PUT /layers/5
    WCF-->>G: {Success:true}

    U->>G: Click Xóa Layer
    G->>WCF: DELETE /layers/5
    WCF-->>G: {Success:true}
    Note over WCF: Cascade xóa FEATURES + LAYERSTYLE
```

---

## 7. Luồng CRUD Feature

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant F as FeatureGrid
    participant D as DrawInteraction
    participant WCF as gServer

    U->>F: Click vẽ feature mới
    F->>D: startDraw(layerType)
    Note over D: ol.interaction.Draw active

    alt Point
        U->>D: Click 1 điểm → drawend ngay
    else LineString / Polygon
        U->>D: Click nhiều điểm
        U->>F: Click Finish Button
        F->>D: finishDrawing()
        Note over D: Nếu < 2 điểm → drawabort\n→ Toast thông báo
    end

    D-->>F: drawend event — GeomWkt
    F->>F: Mở FeatureCRUDPanel (điền GeomWkt)
    U->>F: Nhập Properties → Lưu
    F->>WCF: POST /layers/{id}/features
    WCF-->>F: {Success:true, Data:{Id:...}}
    F->>F: store.load() — refresh Grid
```

---

## 8. Luồng Edit Style

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant LC as LayerController
    participant SP as LayerStyleCRUDPanel
    participant WCF as gServer

    U->>LC: Click Edit Style (layer)
    LC->>LC: Kiểm tra layerStyles[layerId] cache
    alt Cache đã có
        LC->>SP: loadStyle(layerItem, host, cb, cachedStyle)
        Note over SP: Điền form từ cache\nKhông gọi API
    else Chưa cache
        LC->>SP: loadStyle(layerItem, host, cb, undefined)
        SP->>WCF: GET /layers/{id}/style
        WCF-->>SP: {Success:true, Data:{...}}
    end
    SP->>U: Hiện modal với form màu sắc

    U->>SP: Chỉnh màu → Lưu
    SP->>WCF: POST hoặc PUT /layerstyles
    WCF-->>SP: {Success:true}
    SP->>LC: onAfterChange(payload)
    LC->>LC: delete layerStyles[layerId]  ← invalidate cache
    LC->>WCF: GET /layers/{id}/style      ← re-fetch
    LC->>LC: applyLayerStyle(layerId)     ← re-render tất cả feature
```
