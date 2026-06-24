# gServer / gClient — Project Knowledge Base

> Cung cấp ngữ cảnh đầy đủ cho AI hoặc developer mới khi làm việc với dự án này.

---

## 1. Tổng quan dự án

**gServer/gClient** là một ứng dụng **WebGIS** cho phép quản lý, hiển thị và chỉnh sửa dữ liệu không gian địa lý trên bản đồ.

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **Frontend** | ExtJS 8 Modern + OpenLayers 10 | SPA WebGIS, vẽ/hiển thị bản đồ |
| **Backend** | .NET Framework 4.5.1, WCF REST | REST API tại `LayerService.svc` |
| **Database** | SQL Server (2016+) | Lưu dữ liệu không gian, kiểu `GEOMETRY`, SRID 4326 |
| **Build** | Sencha Cmd | Dev port 1962, prod build → `/build` |

**Dev URLs:**
- Frontend: `http://localhost:1962`
- Backend: `http://localhost:52106/LayerService.svc`

---

## 2. Cấu trúc thư mục

```
gServer_0.0.1/                         ← Solution root
├── gClient_ExtJS/
│   └── g-client/
│       ├── app.json                    ← Sencha config (toolkit: modern)
│       ├── index.html                  ← Entry HTML (OL CDN, popup CSS)
│       └── app/desktop/src/
│           ├── Application.js          ← App entry, apiHost config
│           ├── controller/
│           │   ├── LayerController.js  ← Controller trang "Layers"
│           │   └── MapController.js    ← Controller trang "Map" (đơn giản)
│           ├── store/
│           │   └── LayerStore.js
│           └── view/
│               ├── main/               ← Shell: MainView + CenterView (card layout)
│               ├── home/               ← Trang chủ
│               ├── map/                ← MapPanel (trang bản đồ đơn giản)
│               ├── LAYERS/
│               │   └── LayerPanel.js   ← Trang "Layers" (map-DPHCC + layers-DPHCC)
│               ├── Features/
│               │   ├── FeatureStore.js
│               │   └── FeatureModel.js
│               ├── EditLayer/
│               │   ├── LayerView.js              ← Trang "Edit Layers" (split panel)
│               │   └── EditLayerController.js    ← Controller với draw + CRUD
│               ├── FeatureCRUD/
│               │   └── FeatureCRUDPanel.js       ← Modal CRUD Feature (WKT + Properties)
│               └── LayerCRUD/
│                   └── LayerCRUDPanel.js         ← Modal CRUD Layer metadata
│
└── gServer_0.0.1/                     ← .NET WCF backend
    ├── IServices/ILayerService.cs     ← WCF contract (endpoints)
    ├── Services/LayerService.cs       ← Implementation
    ├── Bussines/LayerBLL.cs           ← Business logic / validation
    ├── Repositories/LayerRepository.cs ← ADO.NET SQL queries
    ├── Models/                        ← C# POCOs
    └── Web.config                     ← DB connection string, log4net
```

---

## 3. Frontend — ExtJS 8 Modern

### 3.1 Quy tắc quan trọng (Modern vs Classic)

| ĐÚNG — Modern toolkit | SAI — Classic (không dùng) |
|---|---|
| `Ext.Panel` với `floated:true, modal:true` | `Ext.window.Window` |
| `Ext.field.Text` / `xtype:'textfield'` | `Ext.form.field.Text` |
| `Ext.field.TextArea` / `xtype:'textareafield'` | `Ext.form.field.TextArea` |
| `Ext.grid.Grid` | `Ext.grid.Panel` |
| `Ext.toast({ message, timeout })` | — |
| `panel.getComponent(0)` | `panel.down('.cls')` (kém tin cậy hơn) |

**File không dùng nữa:**
- `EditLayer/LayerViewController.js` — thay bằng `EditLayerController.js`
- `EditLayer/FeatureFormView.js` — dùng `Ext.form.Panel` (Classic), bỏ

---

### 3.2 Navigation / Routing

Menu (`resources/desktop/menu.json`) → xtype mapping:

```json
{ "text": "Home",        "xtype": "homeview",      "leaf": true },
{ "text": "Edit Layers", "xtype": "LayerView",      "leaf": true },
{ "text": "Map",         "xtype": "mapPanel",       "leaf": true },
{ "text": "Layers",      "xtype": "mapLayerDPHCC",  "leaf": true }
```

`MainViewController` bắt `selectionchange` → `redirectTo(xtype)` → `centerview.add({xtype})` → `centerview.setActiveItem(...)`.

`CenterView` dùng `layout: 'card'` — mỗi trang là một card.

---

### 3.3 Application.js

```javascript
controllers: ['MapController', 'LayerController'],
config: {
    apiHost: 'http://localhost:52106'  // đổi khi deploy
}
// Gọi ở bất kỳ đâu: gClient.app.getApiHost()
```

---

### 3.4 Hai bản đồ — Kiến trúc quan trọng

Có **2 map OpenLayers độc lập**, mỗi cái do một controller riêng quản lý:

| Map | DOM id | Controller | Trang |
|---|---|---|---|
| Map chính | `#map-DPHCC` | `LayerController` | Trang "Layers" |
| Map Edit | `#edit-layer-map` | `EditLayerController` | Trang "Edit Layers" |

**Quy tắc:** Không bao giờ để một controller truy cập map của controller kia. Khi `FeatureCRUDPanel` cần vẽ lại (redraw), nó gọi callback được inject từ bên ngoài — không hard-code controller.

---

### 3.5 LayerController — Trang "Layers"

**File:** `controller/LayerController.js`
**Alias:** được khai báo trong `Application.js` controllers
**Trigger:** `control` lắng nghe `panel[cls=map-DPHCC-cls]` và `panel[cls=layers-DPHCC-cls]`

**State instance:**
```javascript
mapPanelRef           // Ext Panel chứa OL map (map-DPHCC)
layerFeatureIds       // { layerId: [featureId, ...] }
layerToggleState      // { layerId: bool }
highlightedFeatureId
layerStores           // { layerId: FeatureStore }
featureCRUDPanel      // singleton FeatureCRUDPanel
layerCRUDPanel        // singleton LayerCRUDPanel
currentDrawLayerId / currentDrawLayerName
layerList             // cache layers cho draw toolbar dropdown
```

**Luồng chính:**
1. `getLayers()` → GET /layers → build UI grid cho mỗi layer (4 nút: eye / feature / edit / trash)
2. Eye → `toggleLayerOnMap()` → POST /features-batch → `drawWktOnMap()`
3. Row tap → `onFeatureRowTap()` → GET /features/{id}/geometry → popup + zoom
4. Click bản đồ rỗng → `identifyAtCoordinate()` → POST /identify → popup
5. Feature button → `openFeatureCRUD()` → `FeatureCRUDPanel.loadLayer()`
6. Edit/Trash → `openLayerCRUD()` / `onLayerDeleteClick()`
7. Draw toolbar → `startDraw(mapPanel, type, onDrawEnd?)` → `drawend` → WKT → `openFeatureCRUDWithWkt()`

**`startDraw(mapPanel, type, onDrawEnd?)`:**
- Tham số `onDrawEnd` là optional callback `(wkt) => void`
- Nếu có: gọi `onDrawEnd(wkt)` thay vì mở FeatureCRUDPanel (dùng cho "Vẽ lại")
- Nếu không có: mở `openFeatureCRUDWithWkt()` như bình thường

**`startDrawForUpdate(drawType, onWktReady)`:**
- Gọi `startDraw(mapPanel, drawType, onWktReady)`
- Dùng khi `FeatureCRUDPanel` cần vẽ lại geometry của feature đang sửa

---

### 3.6 EditLayerController — Trang "Edit Layers"

**File:** `view/EditLayer/EditLayerController.js`
**Alias:** `controller.editlayervc`
**View:** `LayerView.js` (xtype: `LayerView`)

Trang chia đôi: **trái = grid layers**, **phải = OL map `#edit-layer-map`**

**State instance (trên `me`):**
```javascript
olMap             // ol.Map instance
vectorSource      // ol.source.Vector (features đã lưu)
drawSource        // ol.source.Vector (preview khi vẽ)
drawInteraction   // ol.interaction.Draw hiện tại
drawButtons       // { type: { el, base, active, disabled } }
finishBtn         // DOM button "✔ Hoàn thành" — reference lưu trên me
activeDrawType    // 'Point' | 'LineString' | 'Polygon' | null
currentLayerId / currentLayerName / currentLayerRecord
featureCRUDPanel / layerCRUDPanel  // singletons
```

**Luồng vẽ feature mới:**
1. Grid load → GET /layers
2. Chọn row → `activateDrawForLayer()` → nút vẽ sáng
3. Click ◉/╱/▣ → `startDraw(type)` → cursor crosshair
4. **LineString/Polygon:** hiện nút `✔ Hoàn thành` → user click → `drawInteraction.finishDrawing()` → `drawend`
5. **Point:** single click → `drawend` tự động
6. `drawend` → WKT → `openFeatureCRUDWithWkt()` → FeatureCRUDPanel mở

**`startDraw(type, onDrawEnd?)`:**
- Tham số `onDrawEnd` optional — cùng pattern với `LayerController`
- Sau khi `me.stopDraw()`, gọi `onDrawEnd(wkt)` nếu có, hoặc `openFeatureCRUDWithWkt()` nếu không

**`startDrawForUpdate(drawType, onWktReady)`:**
- Gọi `this.startDraw(drawType, onWktReady)`
- Toast "Vẽ hình học mới..."

**Toolbar vẽ quan trọng:**
- `me.finishBtn` — DOM button, `display:none` lúc bình thường, `display:inline-block` khi vẽ LineString/Polygon
- `me.drawButtons` — map `{ 'Point': {el, base, active, disabled}, ... }`

---

### 3.7 FeatureCRUDPanel

**File:** `view/FeatureCRUD/FeatureCRUDPanel.js`
**Xtype:** `featurecrudpanel` | **Controller alias:** `featurecrudvc`
**Pattern:** Singleton — tạo 1 lần, đổi context bằng `loadLayer()`

**API của ViewController:**
```javascript
vc.loadLayer(layerId, layerName, apiHost, onAfterChange, onRequestRedraw)
// onAfterChange(action, featureId, data, layerId) — 'add'|'update'|'delete'
// onRequestRedraw(drawType, callback) — được inject từ controller cha
//   drawType: 'Point'|'LineString'|'Polygon'
//   callback(wkt) — được gọi sau khi vẽ xong
```

**Redraw flow (Vẽ lại geometry):**
1. User chọn feature đang sửa → click nút "Vẽ lại: ◉/╱/▣"
2. `onRedrawClick(btn)` → lấy `btn.drawType` → gọi `view.onRequestRedraw(drawType, cb)`
3. Panel tự `hide()`
4. Controller cha vẽ trên map → `drawend` → `cb(wkt)` được gọi
5. Panel tự `show()`, `geomField.setValue(wkt)`
6. User nhấn "Lưu" → PUT /features/{id}

**Layout:** `hbox` — trái: grid features, phải: form (WKT + dynamic properties)

**Thu thập properties:**
```javascript
propsContainer.getItems().each(function(row) {
    var k = row.getComponent(0).getValue().trim();
    var v = row.getComponent(1).getValue();
    if (k) properties[k] = v;
});
```

**State trên `view`:**
```javascript
view.currentLayerId
view.currentApiHost
view.editingFeatureId   // null = thêm mới, có giá trị = đang sửa
view.onAfterChange      // callback → notify controller cha
view.onRequestRedraw    // callback → delegate vẽ map về controller cha
```

---

### 3.8 LayerCRUDPanel

**File:** `view/LayerCRUD/LayerCRUDPanel.js`
**Xtype:** `layercrudpanel` | **Controller alias:** `layercrudvc`

```javascript
vc.loadLayer(layerData, apiHost, onAfterChangeCb)
// layerData = null → thêm mới; layerData = {...} → sửa
```

Fields: Tên, Mô tả, Loại hình học (POINT/LINESTRING/POLYGON), Hiển thị mặc định, Độ mờ

---

### 3.9 OpenLayers 10 — Tích hợp

Load từ CDN trong `index.html`:
```html
<link href="https://cdn.jsdelivr.net/npm/ol@v10.1.0/ol.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/ol@v10.1.0/dist/ol.js"></script>
```

**Pattern draw + extract WKT:**
```javascript
var interaction = new ol.interaction.Draw({ source: drawSource, type: type });
interaction.on('drawend', function(e) {
    var wkt = new ol.format.WKT().writeFeature(e.feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: map.getView().getProjection()
    });
    // wkt = "LINESTRING (105.8 21.0, 105.9 21.1)"
});
```

**Kết thúc vẽ:**
- **Point:** single click → `drawend` tự fire
- **LineString/Polygon:** cần **double-click** hoặc gọi `drawInteraction.finishDrawing()` để trigger `drawend`

**WKT → render lên map:**
```javascript
var fmt  = new ol.format.WKT();
var feat = fmt.readFeature(wktString, {
    dataProjection: 'EPSG:4326',
    featureProjection: map.getView().getProjection()
});
feat.setId(featureId);
vectorSource.addFeature(feat);
```

---

## 4. Backend — .NET WCF REST

### 4.1 Tất cả Endpoints

**Base URL:** `http://localhost:52106/LayerService.svc`

| Method | Path | Body / Params | Response | Mô tả |
|---|---|---|---|---|
| GET | `/layers` | — | `ServiceResult<LayerListDto[]>` | Danh sách layer |
| POST | `/layers` | `LayerSaveDto` | `ServiceResult<LayerSaveDto>` | Tạo layer |
| PUT | `/layers/{Id}` | `LayerSaveDto` | `ServiceResult<int>` | Sửa layer |
| DELETE | `/layers/{Id}` | — | `ServiceResult<int>` | Xóa layer + features |
| GET | `/layers/{layerId}/features` | — | `FeatureInfoCollection` | Danh sách features (Id + Properties, không Geom) |
| POST | `/layers/{layerId}/features` | `FeatureRequest` | `ServiceResult<int>` | Thêm feature |
| PUT | `/features/{id}` | `FeatureRequest` | `ServiceResult<int>` | Sửa feature |
| DELETE | `/features/{id}` | — | `ServiceResult<int>` | Xóa feature |
| GET | `/features/{id}` | — | `Feature` | Feature đầy đủ (Geom + Properties) |
| GET | `/features/{id}/geometry` | — | `Feature` | Chỉ Geom (không Properties) |
| POST | `/layers/{layerId}/features-batch` | `{featureIds:[1,2,3]}` | `FeatureCollection` | Nhiều features theo ID |
| POST | `/identify` | `{lon, lat}` | `FeatureCollection` | Features tại tọa độ click |
| POST | `/layers/{layerId}/features/import` | `FeatureCollection` | `ServiceResult<bool>` | Bulk import |

**Lưu ý quan trọng:** Server luôn trả HTTP 200. FE phải kiểm tra `result.Success` trong body JSON.

---

### 4.2 Models C#

```csharp
// Wrapper chung cho mọi API response
ServiceResult<T> { bool Success, string Message, T Data }

// Feature đầy đủ
Feature { string Id, string GeomWkt, Dictionary<string,object> Properties }

// Request thêm/sửa feature
FeatureRequest { string Id, string GeomWkt, string Properties }  // Properties = JSON string

// Layer list (GET /layers)
LayerListDto { int Id, string Name, string LayerType, bool IsVisible }

// Layer save (POST/PUT /layers)
LayerSaveDto { int Id, string Name, string Source, string Description,
               string LayerType, bool IsVisible, float Opacity, int MinZoom, int MaxZoom }

// Collection
FeatureCollection { string Type, List<Feature> Features, BoundingBox BoundingBox }
FeatureInfoCollection { List<FeatureInfo> Features }

// Spatial query
IdentifyRequest { double lon, double lat }
FeatureBatchRequest { List<int> FeatureIds }
BoundingBox { double MinLon, MinLat, MaxLon, MaxLat }
```

---

### 4.3 Database Schema

```sql
LAYERS (
    Id          INT IDENTITY PRIMARY KEY,
    Name        NVARCHAR(150) NOT NULL UNIQUE,
    Source      VARCHAR(200),
    Description NVARCHAR(200),
    LayerType   VARCHAR(10),    -- 'POINT' | 'LINESTRING' | 'POLYGON'
    IsVisible   BIT DEFAULT 1,
    Opacity     FLOAT DEFAULT 1.0,
    MinZoom     INT DEFAULT 0,
    MaxZoom     INT DEFAULT 22
)

FEATURES (
    Id          INT IDENTITY PRIMARY KEY,
    LayerId     INT FOREIGN KEY → LAYERS(Id) ON DELETE CASCADE,
    Geom        GEOMETRY NOT NULL,       -- SQL Server spatial, SRID 4326
    Properties  NVARCHAR(MAX)            -- JSON: {"key":"value",...}
)
-- Spatial index: BOUNDING_BOX = (100, 8, 110, 24)  ← phủ toàn Việt Nam

LAYERSTYLE (
    Id          INT IDENTITY PRIMARY KEY,
    LayerId     INT FOREIGN KEY → LAYERS(Id) ON DELETE CASCADE,
    FillColor   CHAR(10) DEFAULT '#3399CC',
    StrokeColor CHAR(10) DEFAULT '#FFFFFF',
    StrokeWidth FLOAT DEFAULT 1.5,
    IconUrl     VARCHAR(200)
)
```

**WKT → DB:** `geometry::STGeomFromText(@GeomWkt, 4326)`
**DB → WKT:** `Geom.STAsText()`
**SRID:** 4326 (WGS84 lon/lat)

---

### 4.4 Kiến trúc backend (3-tier)

```
ILayerService (contract/endpoints)
    ↓
LayerService (implementation — validate input, parse id, gọi BLL)
    ↓
LayerBLL (business logic — kiểm tra trùng tên, rule nghiệp vụ)
    ↓
LayerRepository (ADO.NET SQL queries thuần, async)
    ↓
SQL Server
```

**Properties serialization:**
```csharp
// Lưu vào DB
JsonConvert.SerializeObject(properties)

// Đọc từ DB
JsonConvert.DeserializeObject<Dictionary<string,object>>(json)
// Hoặc parse JObject khi cần dynamic
```

---

## 5. Dữ liệu không gian — WKT

Mọi geometry giao tiếp bằng **chuỗi WKT** (Well-Known Text) — không dùng binary hay ảnh.

```
POINT (105.845 21.028)
LINESTRING (105.8 21.0, 105.9 21.1, 105.85 21.05)
POLYGON ((105.80 21.00, 105.85 21.00, 105.85 21.05, 105.80 21.05, 105.80 21.00))
```

**Thứ tự tọa độ:** longitude (X) trước, latitude (Y) sau — theo chuẩn OGC WKT.

**SRID:** Luôn dùng EPSG:4326 (WGS84) cho cả frontend và backend.

---

## 6. Luồng tương tác đầy đủ

### 6.1 Thêm Feature mới bằng vẽ (trang Edit Layers)

```
1. Menu → "Edit Layers" → LayerView (EditLayerController)
2. Grid tự load GET /layers
3. Chọn row layer → nút vẽ sáng lên (disabled → enabled)
4. Click ◉ Điểm / ╱ Đường / ▣ Vùng → startDraw(type)
   - Point: click 1 lần → drawend
   - LineString/Polygon: click nhiều điểm → click "✔ Hoàn thành" → finishDrawing() → drawend
5. drawend → WKT extracted → openFeatureCRUDWithWkt(layerId, name, wkt)
6. FeatureCRUDPanel mở, WKT tự điền vào geomField
7. Nhập key-value properties → Lưu
8. POST /layers/{layerId}/features → { GeomWkt, Properties }
9. onAfterChange('add', ...) → reload store
```

### 6.2 Sửa Geometry Feature (Vẽ lại — trang bất kỳ)

```
1. Mở FeatureCRUDPanel, chọn feature từ grid → form load dữ liệu
2. Click "Vẽ lại: ◉/╱/▣" trong form
3. onRedrawClick(btn) → view.onRequestRedraw(drawType, cb)
4. FeatureCRUDPanel tự hide()
5. Controller cha (LayerController hoặc EditLayerController) gọi startDrawForUpdate()
6. User vẽ trên map → drawend → cb(wkt) được gọi
7. FeatureCRUDPanel show() lại, geomField.setValue(wkt)
8. Click "Lưu" → PUT /features/{id}
9. onAfterChange('update', ...) → drawWktOnMap() cập nhật hình trên map
```

### 6.3 Xem Feature trên bản đồ (trang Layers)

```
1. Menu → "Layers" → LayerPanel (LayerController)
2. Eye icon → toggleLayerOnMap() → POST /features-batch → drawWktOnMap() từng feature
3. Click feature trên map → popup properties + highlight grid row
4. Click row trong grid → zoom to + popup
5. Click map rỗng → POST /identify → popup feature gần nhất
```

---

## 7. Patterns & Gotchas

### Ajax request chuẩn
```javascript
Ext.Ajax.request({
    url: gClient.app.getApiHost() + '/LayerService.svc/...',
    method: 'POST',
    jsonData: { ... },
    success: function(response) {
        var result = Ext.decode(response.responseText);
        if (result.Success) { ... }
        else Ext.toast({ message: result.Message, timeout: 3000 });
    },
    failure: function() {
        Ext.toast({ message: 'Lỗi kết nối', timeout: 3000 });
    }
});
```

### Singleton panel pattern
```javascript
if (!me.featureCRUDPanel) {
    me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
}
me.featureCRUDPanel.getController().loadLayer(layerId, layerName, apiHost, cb, redrawCb);
```

### Inject redraw callback (không hard-code controller)
```javascript
// Trong LayerController hoặc EditLayerController:
me.featureCRUDPanel.getController().loadLayer(
    layerId, layerName, apiHost,
    function(action, fid, data, lId) { me.onFeatureCRUDChange(action, fid, data, lId); },
    function(drawType, cb) { me.startDrawForUpdate(drawType, cb); }  // ← redraw hook
);
```

### finishBtn — kết thúc LineString/Polygon
```javascript
// Lưu ref trên me (không phải mapPanel)
me.finishBtn = finishBtn;

// Trong startDraw:
if (me.finishBtn) {
    me.finishBtn.style.display = (type === 'Point') ? 'none' : 'inline-block';
}

// Trong stopDraw:
if (me.finishBtn) {
    me.finishBtn.style.display = 'none';
}

// onclick:
if (me.drawInteraction) {
    me.drawInteraction.finishDrawing(); // triggers drawend
}
```

### drawend + singleclick conflict (Point)
```javascript
// Sau drawend, OL vẫn fire singleclick trên cùng click đó
mapPanel.drawJustEnded = true;
setTimeout(function() { mapPanel.drawJustEnded = false; }, 350);
// Trong singleclick handler: if (panel.drawJustEnded) return;
```

### Properties format — 2 format từ server
```javascript
// Server có thể trả Array [{Key,Value}] hoặc Object {key:value}
// FE xử lý cả 2 trong showOlPopup() và loadFeatureIntoForm()
if (Array.isArray(properties)) {
    properties.forEach(function(item) { /* item.Key, item.Value */ });
} else {
    Object.keys(properties).forEach(function(k) { /* k, properties[k] */ });
}
```

---

## 8. Vấn đề đã biết

| # | Vấn đề | Giải thích |
|---|---|---|
| 1 | `Ext.Toast` vs `Ext.toast` | `Ext.Toast` = class, `Ext.toast({...})` = helper. Dùng lowercase `Ext.toast`. |
| 2 | `Ext.window.Window` không tồn tại | Modern toolkit không có Window. Dùng `Ext.Panel` floated + modal. |
| 3 | `LayerViewController.js` không dùng | File cũ, alias sai, không match view. Bỏ qua. |
| 4 | LineString/Polygon cần double-click hoặc finishBtn | Point kết thúc tự động, các loại kia phải explicit finish. |
| 5 | Two-map architecture | 2 OL map độc lập. Không để controller này truy cập map của controller kia. |
| 6 | Properties JSON trả về 2 format | Tùy cấu hình WCF serializer, có thể là Array hoặc Object. |
| 7 | Spatial index bbox | `(100, 8, 110, 24)` — phủ Việt Nam. Query ngoài bbox không dùng index. |
| 8 | LayerType case | Code mới dùng `'POLYGON'` (hoa). Dữ liệu cũ có thể `'polygon'` (thường). |
| 9 | IIS Express port conflict | Port 52106 có thể bị giữ khi process cũ chưa die. Kill bằng `Stop-Process -Name iisexpress`. |

---

## 9. Quick Reference — Khi cần sửa gì

| Cần làm | File cần sửa |
|---|---|
| Thêm menu item | `resources/desktop/menu.json` + tạo view mới |
| Đổi API host | `Application.js` → `apiHost` |
| Sửa trang Edit Layers (grid + map vẽ) | `EditLayer/LayerView.js` + `EditLayer/EditLayerController.js` |
| Sửa trang Layers (map + layer panel) | `controller/LayerController.js` + `LAYERS/LayerPanel.js` |
| Sửa CRUD Feature UI | `FeatureCRUD/FeatureCRUDPanel.js` |
| Sửa CRUD Layer UI | `LayerCRUD/LayerCRUDPanel.js` |
| Thêm API endpoint | `ILayerService.cs` → `LayerService.cs` → `LayerBLL.cs` → `LayerRepository.cs` |
| Sửa schema DB | Thực hiện migration trực tiếp trong SQL Server |
| Sửa style popup bản đồ | `index.html` → `.ol-popup` CSS |
| Sửa style render feature | `LayerController.drawWktOnMap()` hoặc `EditLayerController` drawSource style |
| Sửa tọa độ trung tâm mặc định | `[105.8342, 21.0278]` (Hà Nội) trong cả 2 controller |
