# Module: EditLayerController

**File:** `app/desktop/src/view/EditLayer/EditLayerController.js`  
**Alias:** `controller.editlayervc`  
**View:** `EditLayer/LayerView.js` (`xtype: LayerView`)  
**Trang:** "Edit Layers" trong menu

---

## Layout trang

```
┌─────────────────────────────────────────────────────────────┐
│  Trang Edit Layers (hbox layout)                            │
│                                                             │
│  ┌──────────────────┐ │ ┌─────────────────────────────────┐ │
│  │ Panel trái (flex4)│ │ │ Panel phải (flex8)              │ │
│  │                  │ │ │                                  │ │
│  │ [Thêm][Sửa][Xóa] │ │ │   OpenLayers Map                │ │
│  │ [Feature][Reload] │ │ │   #edit-layer-map               │ │
│  │                  │ │ │                                  │ │
│  │ Grid layers:     │ │ │   [Layer: Ranh giới tỉnh]       │ │
│  │ - Ranh giới tỉnh │ │ │   [◉ Điểm][╱ Đường][▣ Vùng]   │ │
│  │ - Trường học     │ │ │   [✔ Hoàn thành][✖ Dừng]       │ │
│  │                  │ │ │                                  │ │
│  └──────────────────┘ │ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## State

```javascript
// Layer context
currentLayerId     // layer đang được chọn (kích hoạt vẽ)
currentLayerName
currentLayerRecord // raw data object để edit/delete

// OpenLayers
olMap              // ol.Map instance (edit-layer-map)
vectorSource       // ol.source.Vector (features đã render)
drawSource         // ol.source.Vector (preview khi vẽ — dashed blue)
drawInteraction    // ol.interaction.Draw hiện tại
drawButtons        // { 'Point': {el, base, active, disabled}, ... }
finishBtn          // DOM button ✔ Hoàn thành (ref trên me)
activeDrawType     // 'Point' | 'LineString' | 'Polygon' | null
drawJustEnded      // flag ngăn singleclick sau Point draw

// Panels
featureCRUDPanel   // singleton FeatureCRUDPanel
layerCRUDPanel     // singleton LayerCRUDPanel
```

---

## Lifecycle — Map Init

```javascript
onMapPainted: function(mapPanel) {
    if (mapPanel.olMap) { mapPanel.olMap.updateSize(); return; }  // guard

    var olMap = new ol.Map({
        target: 'edit-layer-map',
        layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
        view: new ol.View({ center: ol.proj.fromLonLat([105.8342, 21.0278]), zoom: 13 })
    });

    mapPanel.olMap = olMap;
    me.olMap = olMap;              // lưu ref trên controller

    me.vectorSource = new ol.source.Vector();
    me.drawSource   = new ol.source.Vector();
    olMap.addLayer(new ol.layer.Vector({ source: me.vectorSource }));
    olMap.addLayer(new ol.layer.Vector({
        source: me.drawSource,
        style: /* dashed blue preview */
    }));

    me.createDrawToolbar();
}
```

---

## Draw Toolbar

Toolbar HTML nổi góc phải map, được tạo trong `createDrawToolbar()`.

### Thành phần

| Element | Mô tả |
|---|---|
| `span#edit-draw-layer-name` | Hiện tên layer đang chọn |
| `button ◉ Điểm` | Vẽ Point |
| `button ╱ Đường` | Vẽ LineString |
| `button ▣ Vùng` | Vẽ Polygon |
| `button ✔ Hoàn thành` | Kết thúc vẽ (chỉ hiện khi vẽ Line/Polygon) |
| `button ✖ Dừng` | Hủy vẽ, bỏ hình học |

### Button states

```javascript
var BASE     = 'border:1px solid #1890ff; background:#fff; color:#1890ff;';
var ACTIVE   = 'border:1px solid #1890ff; background:#1890ff; color:#fff; font-weight:600;';
var DISABLED = 'border:1px solid #d9d9d9; background:#f5f5f5; color:#ccc; cursor:not-allowed;';
```

- Khi không có layer nào được chọn: tất cả nút `DISABLED`
- Khi chọn layer: nút về `BASE`
- Khi đang vẽ loại nào: nút đó `ACTIVE`, các nút kia `BASE`

---

## startDraw(type, onDrawEnd?)

```javascript
startDraw: function(type, onDrawEnd) {
    // Remove interaction cũ nếu có
    if (me.drawInteraction) {
        me.olMap.removeInteraction(me.drawInteraction);
    }

    var interaction = new ol.interaction.Draw({ source: me.drawSource, type: type });

    interaction.on('drawend', function(e) {
        var wkt = new ol.format.WKT().writeFeature(e.feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: me.olMap.getView().getProjection()
        });

        me.drawJustEnded = true;
        setTimeout(function() {
            if (me.drawSource) me.drawSource.clear();
            me.drawJustEnded = false;
        }, 350);

        me.stopDraw();

        if (onDrawEnd) {
            onDrawEnd(wkt);                              // update mode (redraw)
        } else if (me.currentLayerId) {
            me.openFeatureCRUDWithWkt(me.currentLayerId, me.currentLayerName, wkt);
        }
    });

    me.olMap.addInteraction(interaction);
    me.drawInteraction = interaction;
    me.activeDrawType  = type;

    // Hiện/ẩn finishBtn
    if (me.finishBtn) {
        me.finishBtn.style.display = (type === 'Point') ? 'none' : 'inline-block';
    }

    me.olMap.getTargetElement().style.cursor = 'crosshair';
}
```

!!! warning "finishBtn lưu trên `me`, không phải `mapPanel`"
    `me.finishBtn` — đây là ref trên controller instance, không phải trên Ext panel.

---

## startDrawForUpdate(drawType, onWktReady)

Dùng khi `FeatureCRUDPanel` cần vẽ lại geometry:

```javascript
startDrawForUpdate: function(drawType, onWktReady) {
    if (!me.olMap) {
        Ext.toast({ message: 'Bản đồ chưa sẵn sàng', timeout: 2000 });
        return;
    }
    Ext.toast({ message: 'Vẽ hình học mới trên bản đồ, nhấn đôi để hoàn thành', timeout: 3000 });
    me.startDraw(drawType, onWktReady);
}
```

---

## Layer Selection → activateDrawForLayer

Khi chọn row trong grid:

```javascript
onLayerSelectionChange: function(grid, selected) {
    if (selected && selected.length > 0) {
        var rec = selected[0];
        me.currentLayerId     = rec.get('Id');
        me.currentLayerName   = rec.get('Name');
        me.currentLayerRecord = rec.getData();
        me.activateDrawForLayer(me.currentLayerId, me.currentLayerName);
    } else {
        me.currentLayerId = null;
        me.deactivateDrawButtons();
        me.stopDraw();
    }
}
```

---

## FeatureCRUD Integration

```javascript
openFeatureCRUD: function(layerId, layerName) {
    if (!me.featureCRUDPanel) {
        me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
    }
    me.featureCRUDPanel.getController().loadLayer(
        layerId, layerName, apiHost,
        null,   // onAfterChange (không cần refresh map ở đây)
        function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }  // onRequestRedraw
    );
}

openFeatureCRUDWithWkt: function(layerId, layerName, wkt) {
    // ... tạo panel nếu chưa có
    vc.loadLayer(layerId, layerName, apiHost,
        null,
        function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }
    );
    var geomField = vc.lookup('geomField');
    if (geomField) geomField.setValue(wkt);
}
```
