# Module: LayerController

**File:** `app/desktop/src/controller/LayerController.js`  
**Type:** `Ext.app.Controller`  
**Phạm vi:** Trang "Layers" (`xtype: mapLayerDPHCC`)

---

## Trách nhiệm

LayerController là controller trung tâm của trang Layers. Nó quản lý:

- Toàn bộ vòng đời của OpenLayers map `#map-DPHCC`
- Danh sách layer và grid feature trong panel trái
- Hiển thị/ẩn feature trên bản đồ (toggle, batch)
- Popup thông tin khi click bản đồ
- Draw toolbar để vẽ feature mới
- Mở FeatureCRUDPanel / LayerCRUDPanel

---

## State

```javascript
mapPanelRef           // Ext.Panel chứa ol.Map
layerFeatureIds       // { layerId: [featureId, ...] }
layerToggleState      // { layerId: bool }
highlightedFeatureId  // ID feature đang highlight (cam)
layerStores           // { layerId: FeatureStore }
featureCRUDPanel      // singleton FeatureCRUDPanel
layerCRUDPanel        // singleton LayerCRUDPanel
currentDrawLayerId    // layer đang active trong draw toolbar
currentDrawLayerName
layerList             // cache layer list cho dropdown
debounceTimer         // setTimeout handle
globalPendingQueue    // { layerId: [{id, coords}] }
```

---

## Lifecycle — Map Init

```javascript
// Trigger: painted event trên panel[cls=map-DPHCC-cls]
initOpenLayersMap: function(panel) {
    if (panel.map) { panel.map.updateSize(); return; }  // guard

    panel.map = new ol.Map({
        target: 'map-DPHCC',
        layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
        view: new ol.View({ center: ol.proj.fromLonLat([105.8342, 21.0278]), zoom: 13 })
    });

    panel.vectorSource = new ol.source.Vector();  // features đã render
    panel.drawSource   = new ol.source.Vector();  // preview khi vẽ (dashed blue)

    me.createPopupOverlay(panel);   // overlay HTML cho popup
    me.createDrawToolbar(panel);    // toolbar nổi góc phải map

    panel.map.on('singleclick', function(evt) { /* identify */ });
}
```

---

## Feature Toggle — Debounce + Batch

```javascript
handleFeatureToggle: function(layerId, record, clickCoords) {
    var featureId = record.getId(),
        isTicked  = record.get('checked');

    // Tắt feature
    if (!isTicked) {
        vectorSource.removeFeature(vectorSource.getFeatureById(featureId));
        return;
    }

    // Bật feature — có cache?
    if (record.get('Geom')) {
        me.drawWktOnMap(record.get('Geom'), featureId);
        return;
    }

    // Chưa có cache → đẩy vào queue, debounce 400ms
    globalPendingQueue[layerId].push({ id: featureId, coords: clickCoords });
    clearTimeout(me.debounceTimer);
    me.debounceTimer = setTimeout(function() {
        // Flush queue: 1 item → single, ≥2 → batch
    }, 400);
}
```

---

## Draw Toolbar

Draw toolbar là HTML thuần nổi góc phải map, tạo trong `createDrawToolbar()`.

**Thành phần:**
- Dropdown chọn layer (`#draw-layer-select`)
- 3 nút: `◉ Điểm` | `╱ Đường` | `▣ Vùng`
- Nút `✔ Hoàn thành` (ẩn, hiện khi vẽ LineString/Polygon)
- Nút `✖ Dừng` (hủy draw hiện tại)

**startDraw(mapPanel, type, onDrawEnd?):**

```javascript
startDraw: function(mapPanel, type, onDrawEnd) {
    var interaction = new ol.interaction.Draw({ source: mapPanel.drawSource, type: type });

    interaction.on('drawend', function(e) {
        var wkt = new ol.format.WKT().writeFeature(e.feature, { dataProjection: 'EPSG:4326', ... });
        mapPanel.drawJustEnded = true;
        setTimeout(function() { mapPanel.drawSource.clear(); mapPanel.drawJustEnded = false; }, 350);
        me.stopDraw(mapPanel);

        if (onDrawEnd) {
            onDrawEnd(wkt);                          // update mode
        } else if (me.currentDrawLayerId) {
            me.openFeatureCRUDWithWkt(..., wkt);     // new feature mode
        }
    });

    mapPanel.map.addInteraction(interaction);
    mapPanel.activeDrawType = type;
    if (mapPanel.finishBtn) {
        mapPanel.finishBtn.style.display = (type === 'Point') ? 'none' : 'inline-block';
    }
}
```

**startDrawForUpdate(drawType, onWktReady):**  
Gọi `startDraw(mapPanel, drawType, onWktReady)` — dùng cho tính năng "Vẽ lại geometry" từ FeatureCRUDPanel.

---

## Popup Overlay

```javascript
createPopupOverlay: function(mapPanel) {
    var container = document.createElement('div');
    container.className = 'ol-popup';
    // ... closer button, content div

    mapPanel.popupOverlay = new ol.Overlay({
        element: container,
        autoPan: { animation: { duration: 250 } }
    });
    mapPanel.map.addOverlay(mapPanel.popupOverlay);
}
```

**showOlPopup(mapPanel, coordinate, title, properties):**  
Render bảng HTML với key-value properties, hiện tại tọa độ đã click.

---

## Highlight Feature

```javascript
applyHighlightStyle: function(mapPanel, featureId) {
    // Reset highlight cũ
    if (me.highlightedFeatureId !== featureId) {
        var prev = vectorSource.getFeatureById(me.highlightedFeatureId);
        if (prev) prev.setStyle(null);  // về style mặc định
    }

    // Apply cam
    var feature = vectorSource.getFeatureById(featureId);
    if (feature) {
        feature.setStyle(new ol.style.Style({
            fill:   new ol.style.Fill({ color: 'rgba(255,140,0,0.45)' }),
            stroke: new ol.style.Stroke({ color: '#ff6600', width: 3 }),
            image:  new ol.style.Circle({ radius: 8, ... })
        }));
        me.highlightedFeatureId = featureId;
    }
}
```

---

## Render WKT lên Map

```javascript
drawWktOnMap: function(wktString, featureId, colorHex) {
    // Xóa feature cũ nếu có
    var old = vectorSource.getFeatureById(featureId);
    if (old) vectorSource.removeFeature(old);

    var olFeat = new ol.format.WKT().readFeature(wktString, {
        dataProjection: 'EPSG:4326',
        featureProjection: map.getView().getProjection()
    });
    olFeat.setId(featureId);
    olFeat.setStyle(new ol.style.Style({
        fill:   new ol.style.Fill({ color: hexToRgba(color, 0.3) }),
        stroke: new ol.style.Stroke({ color, width: 2 }),
        image:  new ol.style.Circle({ radius: 6, fill: ..., stroke: ... })
    }));
    vectorSource.addFeature(olFeat);
    return olFeat;
}
```
