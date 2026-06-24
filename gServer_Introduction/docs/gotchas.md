# Kỹ thuật & Gotchas

Tập hợp các vấn đề đã gặp, cách fix, và quy tắc cần nhớ khi phát triển dự án.

---

## ExtJS Modern Toolkit

### `Ext.window.Window` không tồn tại

!!! danger "Classic only"
    `Ext.window.Window` chỉ tồn tại trong **Classic toolkit**. Dùng nó trong Modern sẽ báo lỗi ngay lập tức.

**Fix:**
```javascript
// SAI
Ext.create('Ext.window.Window', { title: '...', items: [...] })

// ĐÚNG — Modern
Ext.create('Ext.Panel', {
    floated: true,
    modal: true,
    centered: true,
    closeAction: 'hide',
    title: '...',
    items: [...]
})
```

---

### `Ext.Toast` vs `Ext.toast`

```javascript
// SAI — Ext.Toast (chữ hoa T) là Class, không phải hàm
Ext.Toast({ message: '...' })

// ĐÚNG
Ext.toast({ message: '...', timeout: 2500 })
```

---

### `panel.down('.cls')` vs `getComponent(index)`

Trong ExtJS 8 Modern, `down('.cls')` có thể không tin cậy với container đơn giản.

```javascript
// Kém tin cậy
var keyFld = row.down('.crud-key-field');

// Tin cậy hơn — dùng index
var keyFld = row.getComponent(0);
var valFld = row.getComponent(1);
```

---

### `Ext.field.Checkbox.getChecked()` vs `getValue()`

```javascript
// getValue() có thể trả về string 'on'/'off' hoặc bool tùy ExtJS version
// Dùng getChecked() để chắc chắn
var isChecked = checkField.getChecked();  // luôn trả boolean
```

---

## OpenLayers

### drawend + singleclick conflict (Point)

Khi vẽ Point, OL fire **cả 2** event `drawend` và `singleclick` trên cùng 1 click.  
Nếu không xử lý, `singleclick` sẽ trigger Identify ngay sau khi vẽ xong.

```javascript
// Trong drawend handler:
panel.drawJustEnded = true;
setTimeout(function() { panel.drawJustEnded = false; }, 350);

// Trong singleclick handler:
if (panel.activeDrawType || panel.drawJustEnded) {
    panel.drawJustEnded = false;
    return;
}
```

---

### LineString/Polygon không tự kết thúc

Point kết thúc bằng 1 click. LineString/Polygon **cần double-click** hoặc gọi `finishDrawing()`.

```javascript
// Thêm nút ✔ Hoàn thành trong toolbar
finishBtn.onclick = function() {
    if (me.drawInteraction) {
        me.drawInteraction.finishDrawing();  // trigger drawend
    }
};

// Hiện khi vẽ Line/Polygon, ẩn khi vẽ Point
me.finishBtn.style.display = (type === 'Point') ? 'none' : 'inline-block';
```

---

### `finishBtn` lưu trên controller, không phải panel

!!! warning "Lỗi scope thường gặp"
    `mapPanel.finishBtn` — sai, vì `mapPanel` không available trong `startDraw()`/`stopDraw()`.

```javascript
// SAI
mapPanel.finishBtn = finishBtn;
if (mapPanel.finishBtn) { ... }

// ĐÚNG — lưu trên me (controller instance)
me.finishBtn = finishBtn;
if (me.finishBtn) { ... }
```

---

### Tọa độ EPSG:4326 vs EPSG:3857

OSM tile layer dùng **EPSG:3857** (Web Mercator, đơn vị mét).  
Dữ liệu WKT của project dùng **EPSG:4326** (WGS84, đơn vị độ).

OL tự convert nếu truyền đúng options:

```javascript
// Đọc WKT EPSG:4326 → feature dùng projection của map (3857)
new ol.format.WKT().readFeature(wkt, {
    dataProjection: 'EPSG:4326',           // WKT lon/lat
    featureProjection: map.getView().getProjection()  // map coord (3857)
})

// Ghi feature từ map projection → WKT EPSG:4326
new ol.format.WKT().writeFeature(feature, {
    dataProjection: 'EPSG:4326',
    featureProjection: map.getView().getProjection()
})
```

---

## Kiến trúc hai bản đồ

### FeatureCRUDPanel không được hard-code controller

Panel có thể được mở từ:
1. `LayerController` (trang Layers, map `#map-DPHCC`)
2. `EditLayerController` (trang Edit Layers, map `#edit-layer-map`)

Nếu hard-code một controller, draw sẽ sai bản đồ.

**Pattern đúng — inject callback:**
```javascript
// Controller mở panel sẽ inject draw function
vc.loadLayer(layerId, layerName, apiHost,
    onAfterChange,
    function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }  // onRequestRedraw
);

// Panel chỉ gọi callback, không biết controller nào
view.onRequestRedraw(drawType, function(wkt) {
    geomField.setValue(wkt);
    view.show();
});
```

---

## IIS Express

### Port 52106 bị giữ — Cannot create file

Lỗi: `Failed to register URL "http://localhost:52106/"... Cannot create a file when that file already exists. (0x800700b7)`

**Nguyên nhân:** IIS Express process cũ chưa die, hoặc port đang được HTTP.sys giữ.

**Fix:**
```powershell
Stop-Process -Name "iisexpress" -Force -ErrorAction SilentlyContinue
```

**Thêm vào đầu `run-server.ps1`:**
```powershell
Stop-Process -Name "iisexpress" -Force -ErrorAction SilentlyContinue
# ... rồi start IIS Express
```

---

## SQL Server / Database

### LayerType case

Code mới dùng `'POLYGON'` (chữ HOA). Dữ liệu cũ trong DB có thể là `'polygon'` (thường).

SQL Server string comparison mặc định case-insensitive với collation `SQL_Latin1_General_CP1_CI_AS` — nên query không bị lỗi, nhưng nên chuẩn hóa khi INSERT.

---

### Spatial Index — bounding box giới hạn

```sql
BOUNDING_BOX = (100, 8, 110, 24)  -- Việt Nam
```

Query với tọa độ ngoài vùng này không dùng được index → có thể chậm.  
Nếu cần mở rộng, rebuild index với bbox lớn hơn.

---

### Properties JSON — 2 format từ WCF

WCF có thể serialize `Dictionary<string, object>` thành 2 format khác nhau tùy cấu hình:

```json
// Format 1: Object (thường)
{ "ten": "BV Bạch Mai", "loai": "bệnh viện" }

// Format 2: Array (khi WCF dùng DataContractJsonSerializer)
[{ "Key": "ten", "Value": "BV Bạch Mai" }, { "Key": "loai", "Value": "bệnh viện" }]
```

**FE xử lý cả 2:**
```javascript
if (Array.isArray(properties)) {
    properties.forEach(function(item) { /* item.Key, item.Value */ });
} else if (typeof properties === 'object') {
    Object.keys(properties).forEach(function(k) { /* k, properties[k] */ });
}
```

---

## Quick Debug Checklist

| Triệu chứng | Kiểm tra |
|---|---|
| Map không render | `panel.map` có tồn tại không? `updateSize()` đã gọi chưa? |
| WKT sai tọa độ | Check `dataProjection` vs `featureProjection` trong `readFeature` |
| Feature vẽ xong không mở form | `openFeatureCRUDWithWkt()` có bị comment không? `currentDrawLayerId` có giá trị không? |
| Redraw không hoạt động | `view.onRequestRedraw` có được set khi gọi `loadLayer()`? |
| `finishBtn` không hiện | `me.finishBtn` được set chưa? Toolbar đã `appendChild` chưa? |
| IIS Express không start | Port 52106 đang bị giữ — kill iisexpress |
| Properties hiển thị rỗng | Check format Array vs Object từ server |
| Grid không load | `featureStore.load()` có gọi sau `painted`? proxy URL đúng không? |
