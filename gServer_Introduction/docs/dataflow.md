# Luồng dữ liệu

## 1. Khởi tạo ứng dụng

```mermaid
sequenceDiagram
    participant B as Browser
    participant EXT as ExtJS App
    participant LC as LayerController
    participant OL as OpenLayers
    participant API as gServer

    B->>EXT: Load index.html
    EXT->>EXT: Application.launch() → add MainView
    Note over EXT: Menu load → user chọn "Layers"
    EXT->>LC: painted event (panel cls=map-DPHCC-cls)
    LC->>OL: new ol.Map({ target: 'map-DPHCC' })
    LC->>OL: addLayer(vectorLayer), addLayer(drawLayer)
    LC->>LC: createPopupOverlay(), createDrawToolbar()

    EXT->>LC: painted event (panel cls=layers-DPHCC-cls)
    LC->>API: GET /layers
    API-->>LC: [{Id, Name, LayerType, IsVisible}]
    LC->>EXT: Build Grid + toolbar cho mỗi layer
    Note over EXT: Grid painted → featureStore.load()
    EXT->>API: GET /layers/{id}/features
    API-->>EXT: [{Id, Properties}] (không có Geom)
    EXT->>EXT: Render bảng thuộc tính
```

---

## 2. Bật feature lên bản đồ (Debounce + Batch)

```mermaid
flowchart TD
    A["User tick checkbox feature"] --> B{Geom\ncó sẵn cache?}
    B -->|Có| C["drawWktOnMap ngay\nkhông tốn API"]
    B -->|Không| D["globalPendingQueue.push(featureId)"]
    D --> E["clearTimeout + setTimeout 400ms"]
    E --> F{Hết 400ms\nqueue.length?}
    F -->|"= 1"| G["GET /features/{id}/geometry"]
    F -->|"≥ 2"| H["POST /layers/{id}/features-batch\n{featureIds: [...]}"]
    G --> I["drawWktOnMap(wkt, id)\ncache Geom vào store record"]
    H --> J["Mỗi feature:\ndrawWktOnMap(wkt, id)"]
    H --> K["zoomToBoundingBox(BoundingBox)"]
    C --> L["Feature hiện trên bản đồ"]
    I --> L
    J --> L
```

---

## 3. Click bản đồ — Identify

```mermaid
sequenceDiagram
    participant U as User
    participant OL as OpenLayers
    participant LC as LayerController
    participant API as gServer

    U->>OL: Click vào bản đồ
    OL->>LC: singleclick event { coordinate }
    LC->>LC: Kiểm tra activeDrawType / drawJustEnded
    alt Đang vẽ hoặc vừa vẽ xong
        LC->>LC: Bỏ qua
    else Click feature có sẵn trên vectorSource
        LC->>LC: forEachFeatureAtPixel() → tìm olFeature
        LC->>LC: showOlPopup(center, title, properties)
        LC->>LC: applyHighlightStyle(featureId)
        LC->>LC: highlightGridRow(featureId)
    else Click vùng trống
        LC->>LC: toLonLat(coordinate)
        LC->>API: POST /identify { lon, lat }
        API-->>LC: FeatureCollection
        LC->>LC: showOlPopup() + highlight
    end
```

---

## 4. Thêm Feature mới bằng vẽ (trang Edit Layers)

```mermaid
sequenceDiagram
    participant U as User
    participant ELC as EditLayerController
    participant OL as OpenLayers
    participant FCP as FeatureCRUDPanel
    participant API as gServer

    U->>ELC: Chọn layer từ grid
    ELC->>ELC: currentLayerId = layerId
    ELC->>ELC: activateDrawForLayer() → nút vẽ sáng

    U->>ELC: Click ╱ Đường (LineString)
    ELC->>OL: startDraw('LineString')
    OL->>OL: ol.interaction.Draw add vào map
    ELC->>ELC: finishBtn.display = 'inline-block'

    U->>OL: Click nhiều điểm trên bản đồ
    U->>ELC: Click ✔ Hoàn thành
    ELC->>OL: drawInteraction.finishDrawing()
    OL->>ELC: drawend event { feature }
    ELC->>ELC: writeFeature() → WKT
    ELC->>ELC: stopDraw()

    ELC->>FCP: openFeatureCRUDWithWkt(layerId, name, wkt)
    FCP->>FCP: geomField.setValue(wkt)
    FCP->>FCP: show()

    U->>FCP: Nhập properties → click Lưu
    FCP->>API: POST /layers/{id}/features { GeomWkt, Properties }
    API-->>FCP: { Success: true, Data: newId }
    FCP->>FCP: Ext.toast('Thêm thành công!')
    FCP->>FCP: loadFeatures() + clearForm()
```

---

## 5. Sửa Geometry Feature (Vẽ lại)

```mermaid
sequenceDiagram
    participant U as User
    participant FCP as FeatureCRUDPanel
    participant LC as LayerController
    participant OL as OpenLayers
    participant API as gServer

    U->>FCP: Chọn feature trong grid → form load
    FCP->>API: GET /features/{id}
    API-->>FCP: { GeomWkt, Properties }
    FCP->>FCP: geomField.setValue(wkt)

    U->>FCP: Click "Vẽ lại: ▣ Vùng"
    FCP->>FCP: view.hide()
    FCP->>LC: view.onRequestRedraw('Polygon', callback)
    LC->>LC: startDrawForUpdate('Polygon', callback)
    LC->>OL: startDraw(mapPanel, 'Polygon', callback)

    U->>OL: Vẽ polygon + click ✔ Hoàn thành
    OL->>LC: drawend { feature }
    LC->>LC: wkt = writeFeature()
    LC->>LC: stopDraw()
    LC->>FCP: callback(wkt)

    FCP->>FCP: geomField.setValue(wkt)
    FCP->>FCP: view.show()

    U->>FCP: Click Lưu
    FCP->>API: PUT /features/{id} { GeomWkt: newWkt, Properties }
    API-->>FCP: { Success: true }
    FCP->>LC: onAfterChange('update', id, { geomWkt }, layerId)
    LC->>OL: drawWktOnMap(newWkt, id) ← cập nhật hình trên map
```

---

## 6. CRUD Layer

```mermaid
sequenceDiagram
    participant U as User
    participant LCP as LayerCRUDPanel
    participant API as gServer
    participant LC as LayerController

    U->>LC: Click nút Thêm Layer
    LC->>LCP: openLayerCRUD(null)
    LCP->>LCP: clearForm(), show()

    U->>LCP: Nhập Tên, Loại, Opacity → Lưu
    LCP->>API: POST /layers { Name, LayerType, ... }
    API-->>LCP: { Success: true, Data: { Id: 5, ... } }
    LCP->>LCP: Ext.toast('Tạo layer thành công!')
    LCP->>LC: onAfterChange callback
    LC->>LC: refreshLayers() → getLayers() → rebuild UI
```

---

## 7. Tối ưu hiệu năng

| Vấn đề | Giải pháp |
|---|---|
| N request khi tick nhanh nhiều feature | Debounce 400ms + gom thành 1 batch request |
| Gọi API lại cho feature đã có Geom | Cache `Geom` vào store record (`silent: true`), check trước khi request |
| Re-render grid khi set cache | `record.set('Geom', wkt, { silent: true })` — không trigger update event |
| Map không vừa vùng mới | `zoomToBoundingBox(BoundingBox)` sau mỗi batch |
| Point draw kích hoạt singleclick | Flag `drawJustEnded = true`, clear sau 350ms |
| IIS Express port bị giữ | Kill process: `Stop-Process -Name iisexpress -Force` |
