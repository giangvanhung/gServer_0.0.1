# gServer / gClient — Project Knowledge Base

> Dùng file này để cung cấp ngữ cảnh cho AI (Claude, ChatGPT, Copilot…) khi hỏi về dự án.

---

## 1. Tổng quan kiến trúc

| Thành phần | Công nghệ | Mô tả |
|---|---|---|
| **Frontend** | ExtJS 8 Modern + OpenLayers 10 | SPA WebGIS chạy trên trình duyệt |
| **Backend** | .NET Framework 4.x, WCF REST | Web service tại `LayerService.svc` |
| **Database** | SQL Server | Dữ liệu không gian, GEOMETRY type |
| **Build tool** | Sencha Cmd + webpack-dev-server | Dev port 1962, prod build ra `/build` |

**Dev URLs:**
- Frontend: `http://localhost:1962`
- Backend: `http://localhost:52106/LayerService.svc`

---

## 2. Cấu trúc thư mục

```
gServer_0.0.1/               ← Solution root
├── gClient_ExtJS/
│   └── g-client/            ← ExtJS SPA
│       ├── app.json          ← Sencha app config (framework: ext, toolkit: modern)
│       ├── index.html        ← Entry HTML (OL CDN, popup CSS)
│       └── app/desktop/src/
│           ├── Application.js          ← App entry, apiHost config
│           ├── controller/
│           │   └── LayerController.js  ← Map page controller
│           ├── store/
│           │   └── LayerStore.js       ← REST proxy store for layers
│           └── view/
│               ├── main/               ← Shell: MainView, CenterView (card layout)
│               ├── home/               ← Home page
│               ├── map/                ← MapPanel (placeholder xtype)
│               ├── LAYERS/             ← "Layers" page (LayerPanel.js)
│               ├── Features/           ← FeatureStore, FeatureModel
│               ├── EditLayer/          ← "Edit Layers" page
│               │   ├── LayerView.js          ← Split panel (layers list + OL map)
│               │   ├── EditLayerController.js ← Controller with draw + CRUD
│               │   └── LayerViewController.js ← OLD, không dùng nữa
│               ├── FeatureCRUD/
│               │   └── FeatureCRUDPanel.js   ← Modal CRUD cho Feature
│               └── LayerCRUD/
│                   └── LayerCRUDPanel.js     ← Modal CRUD cho Layer
│
└── gServer_0.0.1/           ← .NET WCF backend
    ├── IServices/
    │   └── ILayerService.cs  ← Interface WCF contract
    ├── Services/
    │   └── LayerService.cs   ← Implementation
    ├── Bussines/
    │   └── LayerBLL.cs       ← Business logic / validation
    ├── Repositories/
    │   └── LayerRepository.cs ← SQL queries (ADO.NET / Dapper)
    ├── Models/               ← C# POCOs
    └── Create_Tables.sql     ← Schema: LAYERS, FEATURES, LAYERSTYLE
```

---

## 3. Frontend — ExtJS 8 Modern

### 3.1 Quy tắc quan trọng

| ĐÚNG (Modern toolkit) | SAI (Classic toolkit — không dùng) |
|---|---|
| `Ext.Panel` với `floated: true, modal: true` | `Ext.window.Window` |
| `Ext.field.Text` / `xtype: 'textfield'` | `Ext.form.field.Text` |
| `Ext.field.TextArea` / `xtype: 'textareafield'` | `Ext.form.field.TextArea` |
| `Ext.field.Select` / `xtype: 'selectfield'` | `Ext.form.field.ComboBox` |
| `Ext.field.Checkbox` → `getChecked()` / `setChecked()` | `getValue()` trả bool không đáng tin |
| `Ext.grid.Grid` | `Ext.grid.Panel` |
| `Ext.Toast` hoặc `Ext.toast({message, timeout})` | — |

### 3.2 Navigation / Routing

Menu → xtype mapping (`resources/desktop/menu.json`):

```json
{ "text": "Home",        "xtype": "homeview",      "leaf": true },
{ "text": "Edit Layers", "xtype": "LayerView",      "leaf": true },
{ "text": "Map",         "xtype": "mapPanel",       "leaf": true },
{ "text": "Layers",      "xtype": "mapLayerDPHCC",  "leaf": true }
```

`MainViewController` lắng nghe `selectionchange` trên menu → `redirectTo(xtype)` → route → `centerview.add({ xtype })` → `centerview.setActiveItem(xtype)`.

`CenterView` dùng `layout: 'card'`, mỗi trang là một card.

### 3.3 Application entry

`Application.js`:
```javascript
controllers: ['MapController', 'LayerController'],
config: {
    apiHost: 'http://localhost:52106'   // ← đổi đây khi deploy
}
// Gọi: gClient.app.getApiHost()
```

### 3.4 LayerController (trang "Layers" — xtype: mapLayerDPHCC)

**File:** `controller/LayerController.js`  
**Trigger:** `control` lắng nghe `panel[cls=map-DPHCC-cls]` và `panel[cls=layers-DPHCC-cls]`

**State instance:**
```javascript
mapPanelRef         // Ext panel chứa OL map
layerFeatureIds     // { layerId: [featureId, ...] }  — tracking feature trên map
layerToggleState    // { layerId: bool }               — layer đang hiện/ẩn
highlightedFeatureId
layerStores         // { layerId: FeatureStore }       — để reload sau CRUD
featureCRUDPanel    // singleton FeatureCRUDPanel
layerCRUDPanel      // singleton LayerCRUDPanel
currentDrawLayerId / currentDrawLayerName
layerList           // cache layers cho draw toolbar dropdown
```

**Luồng chính:**
1. `getLayers()` → GET /layers → tạo `Ext.grid.Grid` cho mỗi layer (4 tools: eye / pencil / edit / trash)
2. Eye tool → `toggleLayerOnMap()` → POST /features-batch → `drawWktOnMap()`
3. Row tap → `onFeatureRowTap()` → GET /features/{id}/geometry → popup + zoom
4. Click map rỗng → `identifyAtCoordinate()` → POST /identify → popup
5. Pencil tool → `openFeatureCRUD()` → `FeatureCRUDPanel.loadLayer()`
6. Edit/Trash tool → `openLayerCRUD()` / `onLayerDeleteClick()`
7. Draw toolbar → `startDraw(type)` → `ol.interaction.Draw` → `drawend` → WKT → `openFeatureCRUDWithWkt()`

### 3.5 EditLayerController (trang "Edit Layers" — xtype: LayerView)

**File:** `view/EditLayer/EditLayerController.js`  
**Alias:** `controller.editlayervc`

Trang chia đôi: **trái = grid layers**, **phải = OL map vẽ**.

**Luồng vẽ feature:**
1. Grid load → GET /layers → hiện danh sách
2. Chọn row layer → `setCurrentLayer()` → kích hoạt nút vẽ (grayed → blue)
3. Click ◉/╱/▣ → `startDraw(type)` → cursor crosshair
4. Vẽ xong (`drawend`) → `ol.format.WKT().writeFeature()` → chuỗi WKT text
5. `openFeatureCRUDWithWkt()` → `FeatureCRUDPanel` mở, WKT tự điền vào form
6. User nhập properties → Lưu → POST hoặc PUT API

**Toolbar actions:** Thêm Layer / Sửa / Xóa / Quản lý Feature / Tải lại

### 3.6 FeatureCRUDPanel

**File:** `view/FeatureCRUD/FeatureCRUDPanel.js`  
**Xtype:** `featurecrudpanel` | **Controller alias:** `featurecrudvc`  
**Pattern:** Singleton — tạo 1 lần, gọi `loadLayer()` để đổi context

**API:**
```javascript
vc.loadLayer(layerId, layerName, apiHost, onAfterChangeCb)
// onAfterChangeCb(action, featureId, data, layerId)
// action: 'add' | 'update' | 'delete'
```

**Layout:** `hbox` — trái: grid features (Id + Properties), phải: form (WKT textarea + dynamic key-value rows)

**Cách thu thập properties:**
```javascript
propsContainer.getItems().each(function(row) {
    var k = row.down('.crud-key-field').getValue().trim();
    var v = row.down('.crud-val-field').getValue();
    if (k) properties[k] = v;
});
```

### 3.7 LayerCRUDPanel

**File:** `view/LayerCRUD/LayerCRUDPanel.js`  
**Xtype:** `layercrudpanel` | **Controller alias:** `layercrudvc`

**API:**
```javascript
vc.loadLayer(layerData, apiHost, onAfterChangeCb)
// layerData = null → thêm mới; layerData = { Id, Name, LayerType, ... } → sửa
```

**Fields:** Tên, Mô tả, Loại hình học (select: POINT/LINESTRING/POLYGON), Hiển thị mặc định, Độ mờ

### 3.8 OpenLayers 10 integration

OL được load từ CDN trong `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.1.0/ol.css">
<script src="https://cdn.jsdelivr.net/npm/ol@v10.1.0/dist/ol.js"></script>
```

**Map targets (DOM id):**
- Trang Layers: `map-DPHCC`
- Trang Edit Layers: `edit-layer-map`

**Pattern draw + extract WKT:**
```javascript
var interaction = new ol.interaction.Draw({ source: drawSource, type: 'Point' });
interaction.on('drawend', function(e) {
    var wkt = new ol.format.WKT().writeFeature(e.feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: map.getView().getProjection()
    });
    // wkt = "POINT (105.845 21.028)"  ← text thuần, không phải ảnh
});
```

**Draw modes:** `Point` | `LineString` | `Polygon`

**Vấn đề singleclick sau Point draw:** Sau khi drawend, OL vẫn fire singleclick. Fix bằng flag `drawJustEnded = true` → clear sau 350ms.

---

## 4. Backend — .NET WCF REST

### 4.1 Tất cả Endpoints

**Base URL:** `http://localhost:52106/LayerService.svc`

| Method | URL | Body | Response | Mô tả |
|---|---|---|---|---|
| GET | `/layers` | — | `ServiceResult<LayerListDto[]>` | Danh sách layer |
| POST | `/layers` | `LayerSaveDto` | `ServiceResult<LayerSaveDto>` | Tạo layer mới |
| PUT | `/layers/{Id}` | `LayerSaveDto` | `ServiceResult<int>` | Cập nhật layer |
| DELETE | `/layers/{Id}` | — | `ServiceResult<int>` | Xóa layer + features |
| GET | `/layers/{layerId}/features` | — | `FeatureInfoCollection` | Danh sách features (chỉ Id + Properties, không Geom) |
| POST | `/layers/{layerId}/features` | `Feature` | `ServiceResult<int>` | Thêm feature mới |
| PUT | `/features/{id}` | `Feature` | `ServiceResult<int>` | Sửa feature |
| DELETE | `/features/{id}` | — | `ServiceResult<int>` | Xóa feature |
| GET | `/features/{id}` | — | `Feature` | Feature đầy đủ (Geom + Properties) |
| GET | `/features/{featureId}/geometry` | — | `Feature` | Chỉ lấy Geom (không Properties) |
| POST | `/layers/{layerId}/features-batch` | `{featureIds:[1,2,3]}` | `FeatureCollection` + BoundingBox | Nhiều features theo ID |
| POST | `/identify` | `{lon, lat}` | `FeatureCollection` | Tìm features tại tọa độ click |
| POST | `/layers/{layerId}/features/import` | `FeatureCollection` | `ServiceResult<bool>` | Bulk import |

**Headers bắt buộc:** `Content-Type: application/json`, `Accept: application/json`

**Lưu ý:** Server luôn trả HTTP 200. FE phải kiểm tra `result.Success` trong body.

### 4.2 Models C#

```csharp
// ServiceResult<T> — wrapper cho mọi response
{ bool Success, string Message, T Data }

// Feature — đơn vị dữ liệu không gian
{ string Id, string GeomWkt, Dictionary<string,object> Properties }

// LayerListDto — dùng GET /layers
{ int Id, string Name, string LayerType, bool IsVisible }

// LayerSaveDto — dùng POST/PUT /layers
{ int Id, string Name, string Source, string Description,
  string LayerType, bool IsVisible, float Opacity, int MinZoom, int MaxZoom }

// FeatureCollection
{ string Type, Feature[] Features, BoundingBox BoundingBox }

// IdentifyRequest
{ double lon, double lat }
```

### 4.3 Database Schema (SQL Server)

```sql
LAYERS (
    Id          INT IDENTITY PK,
    Name        NVARCHAR(150) NOT NULL,
    Source      VARCHAR(200),
    Description NVARCHAR(200),
    LayerType   VARCHAR(10)  -- 'POINT' | 'LINESTRING' | 'POLYGON'
    IsVisible   BIT DEFAULT 1,
    Opacity     FLOAT DEFAULT 1.0,
    MinZoom     INT DEFAULT 0,
    MaxZoom     INT DEFAULT 22
)

FEATURES (
    Id          INT IDENTITY PK,
    LayerId     INT FK → LAYERS(Id) ON DELETE CASCADE,
    Geom        GEOMETRY NOT NULL,         -- SQL Server spatial type
    Properties  NVARCHAR(MAX)              -- JSON: {"key":"value",...}
)
-- Spatial index: BOUNDING_BOX = (100, 8, 110, 24)  ← phủ Việt Nam

LAYERSTYLE (
    Id          INT IDENTITY PK,
    LayerId     INT FK → LAYERS(Id) ON DELETE CASCADE,
    FillColor   CHAR(10) DEFAULT '#3399CC',
    StrokeColor CHAR(10) DEFAULT '#FFFFFF',
    StrokeWidth FLOAT DEFAULT 1.5,
    IconUrl     VARCHAR(200)
)
```

**WKT → DB:** `geometry::STGeomFromText(@GeomWkt, 4326)`  
**DB → WKT:** `Geom.STAsText()`  
**SRID:** 4326 (WGS84 lat/lon)

### 4.4 Layer BLL / Repository pattern

```
Controller (ILayerService) → BLL (LayerBLL) → Repository (LayerRepository) → SQL Server
```

- `LayerBLL.cs`: validation, business rules (kiểm tra tên trùng, parse ID…)
- `LayerRepository.cs`: ADO.NET / SQL thuần, async methods
- Properties được serialize/deserialize bằng `Newtonsoft.Json`:
  ```csharp
  JsonConvert.SerializeObject(properties)         // lưu
  JsonConvert.DeserializeObject<Dictionary<string,object>>(json)  // đọc
  ```

---

## 5. Dữ liệu hình học — Nguyên tắc WKT

Mọi geometry giao tiếp dưới dạng **chuỗi text WKT** (Well-Known Text), không phải ảnh hay binary.

```
POINT (105.845 21.028)
LINESTRING (105.8 21.0, 105.9 21.1)
POLYGON ((105.80 21.00, 105.85 21.00, 105.85 21.05, 105.80 21.05, 105.80 21.00))
```

Thứ tự tọa độ: **longitude (X) trước, latitude (Y) sau** (theo chuẩn OGC WKT + GeoJSON).

---

## 6. Luồng tương tác điển hình

### Thêm Feature mới bằng vẽ trên bản đồ

```
1. Vào trang "Edit Layers" (menu)
2. Chọn layer từ danh sách bên trái → nút vẽ sáng lên
3. Click ◉/╱/▣ → cursor crosshair
4. Vẽ trên bản đồ (click = điểm, click nhiều điểm + double-click = đường/vùng)
5. drawend → WKT tự động điền vào FeatureCRUDPanel
6. Nhập key-value properties → Lưu
7. POST /layers/{layerId}/features → { Id, GeomWkt, Properties }
```

### Xem Feature trên bản đồ (trang Layers)

```
1. Vào trang "Layers"
2. Eye icon trên layer grid → load tất cả features lên map (batch)
3. Click feature trên map → popup properties + highlight grid row
4. Click row trong grid → zoom to + popup
5. Click map rỗng → POST /identify → popup nearest feature
```

---

## 7. Patterns & Anti-patterns thường gặp

### Tạo modal panel (Modern toolkit)
```javascript
// ĐÚNG
Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel')
// Panel có: floated: true, modal: true, centered: true, closeAction: 'hide'

// SAI — Classic only
Ext.create('Ext.window.Window', { ... })
```

### Lookup trong ViewController
```javascript
// Dùng reference trong view config
{ xtype: 'textfield', reference: 'myField' }

// Trong ViewController
var field = this.lookup('myField');  // trả về component hoặc null
```

### Ajax request chuẩn
```javascript
Ext.Ajax.request({
    url: gClient.app.getApiHost() + '/LayerService.svc/layers',
    method: 'POST',
    jsonData: { Name: 'Test', LayerType: 'POINT', ... },
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
// Tạo 1 lần, đổi context bằng method load
if (!me.featureCRUDPanel) {
    me.featureCRUDPanel = Ext.create('gClient.view.FeatureCRUD.FeatureCRUDPanel');
}
me.featureCRUDPanel.getController().loadLayer(layerId, layerName, apiHost, callback);
```

### Draw → WKT (không bao giờ dùng ảnh)
```javascript
var wkt = new ol.format.WKT().writeFeature(e.feature, {
    dataProjection: 'EPSG:4326',
    featureProjection: map.getView().getProjection()
});
// "POINT (105.845 21.028)" — text thuần gửi thẳng lên server
```

---

## 8. File nhanh — khi cần sửa gì

| Cần làm | Sửa file |
|---|---|
| Thêm menu item | `resources/desktop/menu.json` + tạo view mới |
| Đổi API host | `app/desktop/src/Application.js` → `apiHost` |
| Sửa trang "Edit Layers" (grid + map vẽ) | `EditLayer/LayerView.js` + `EditLayer/EditLayerController.js` |
| Sửa trang "Layers" (map + layer panel) | `controller/LayerController.js` + `LAYERS/LayerPanel.js` |
| Sửa CRUD Feature UI | `FeatureCRUD/FeatureCRUDPanel.js` |
| Sửa CRUD Layer UI | `LayerCRUD/LayerCRUDPanel.js` |
| Thêm API endpoint | `IServices/ILayerService.cs` → `Services/LayerService.cs` → `Bussines/LayerBLL.cs` → `Repositories/LayerRepository.cs` |
| Sửa schema DB | `Create_Tables.sql` (chỉ tham khảo, thay đổi trực tiếp trong SQL Server) |
| Sửa style popup bản đồ | `index.html` → `<style>.ol-popup...` |
| Sửa style vẽ feature trên map | `LayerController.js` → `drawWktOnMap()` hoặc `EditLayerController.js` → `drawSource` style |

---

## 9. Các vấn đề đã biết / Ghi chú kỹ thuật

1. **`Ext.Toast` vs `Ext.toast`**: Trong ExtJS 8 Modern, `Ext.Toast` (viết hoa T) là class, `Ext.toast()` là method helper. Dùng `Ext.toast({ message, timeout })`.

2. **`Ext.window.Window` không tồn tại trong Modern toolkit** — `LayerViewController.js` cũ dùng điều này và bị lỗi. File đó giờ không được dùng nữa; thay bằng `EditLayerController.js`.

3. **`FeatureFormView.js` dùng `Ext.form.Panel`** (Classic) — file còn đó nhưng không được dùng nữa.

4. **Properties JSON trong DB**: Stored dưới dạng `NVARCHAR(MAX)` với cấu trúc `{"key":"value"}`. WCF tự-serialize Dictionary thành JSON array `[{Key,Value}]` trong một số cấu hình — FE xử lý cả 2 format trong `showOlPopup()`.

5. **Spatial Index bounding box**: `(100, 8, 110, 24)` — tọa độ bao phủ Việt Nam. Query ngoài bbox sẽ không dùng index.

6. **Layer type case**: DB có dữ liệu cũ là `'polygon'` (thường) nhưng code mới dùng `'POLYGON'` (hoa). FE check không phân biệt hoa thường nhưng SQL có thể khác.

7. **`drawend` + `singleclick` conflict**: Khi vẽ Point, `drawend` và `singleclick` đều fire trên cùng 1 click. Fix: flag `drawJustEnded = true`, clear sau 350ms.

8. **Tọa độ hà Nội mặc định**: `[105.8342, 21.0278]` (lon, lat) — trung tâm Hà Nội.
