# Kiến trúc hệ thống

## Tổng thể — 3 tầng

```mermaid
graph TB
    subgraph CLIENT["🖥️ Browser — gClient (localhost:1962)"]
        direction LR
        EXT["ExtJS 8\nMVC Controller · Grid · Store · Panel"]
        OL["OpenLayers 10\nMap · VectorSource · Draw · WKT"]
        EXT <-->|"drawWktOnMap()\nstartDraw()"| OL
    end

    subgraph SERVER["⚙️ IIS Express — gServer (localhost:52106)"]
        direction TB
        IFC["ILayerService\nWCF Contract"]
        SVC["LayerService\nImplementation"]
        BLL["LayerBLL\nBusiness Logic"]
        REPO["LayerRepository\nADO.NET SQL"]
        IFC --> SVC --> BLL --> REPO
    end

    subgraph DATABASE["🗄️ SQL Server"]
        LAYERS["LAYERS\n(metadata)"]
        FEATURES["FEATURES\n(geometry + properties)"]
        STYLE["LAYERSTYLE\n(render style)"]
        LAYERS --> FEATURES
        LAYERS --> STYLE
    end

    CLIENT -->|"Ext.Ajax.request\nHTTP GET/POST/PUT/DELETE JSON"| SERVER
    SERVER -->|"ADO.NET SqlCommand"| DATABASE
    DATABASE -->|"WKT string, ResultSet"| SERVER
    SERVER -->|"JSON { Success, Data, Message }"| CLIENT
```

---

## Kiến trúc Backend — 4 tầng

```mermaid
graph LR
    A["HTTP Request\nJSON body"] --> B["ILayerService\nWCF contract\n@OperationContract"]
    B --> C["LayerService\n.svc implementation\nparse ID, validate input"]
    C --> D["LayerBLL\nbusiness rules\nkiểm tra tên trùng\nvalidation"]
    D --> E["LayerRepository\nSqlCommand\nSqlDataReader\nasync/await"]
    E --> F[("SQL Server\nLAYERS\nFEATURES\nGEOMETRY")]
    F --> E --> D --> C --> B --> A
```

!!! note "Nguyên tắc phân tầng"
    - **ILayerService**: định nghĩa endpoint URL, method, format — **không có logic**
    - **LayerService**: nhận request, parse input, gọi BLL, bắt exception
    - **LayerBLL**: kiểm tra nghiệp vụ (tên trùng, ID hợp lệ), gọi Repository
    - **LayerRepository**: chỉ biết SQL, không biết HTTP hay business rule

---

## Kiến trúc Frontend — MVC ExtJS

```mermaid
graph TD
    APP["Application.js\ngetApiHost()\ncontrollers: [LayerController]"]

    subgraph PAGES["Các trang (CenterView — card layout)"]
        PG1["Trang Layers\nxtype: mapLayerDPHCC"]
        PG2["Trang Edit Layers\nxtype: LayerView"]
        PG3["Trang Map\nxtype: mapPanel"]
    end

    subgraph CONTROLLERS["Controllers"]
        LC["LayerController\nquản lý trang Layers\n+ map-DPHCC"]
        ELC["EditLayerController\nquản lý trang Edit\n+ edit-layer-map"]
        MC["MapController\nmap đơn giản"]
    end

    subgraph MODALS["Modal Panels (singletons)"]
        FCP["FeatureCRUDPanel\nthêm/sửa/xóa Feature"]
        LCP["LayerCRUDPanel\nthêm/sửa Layer"]
    end

    APP --> CONTROLLERS
    APP --> PAGES
    LC --> FCP
    LC --> LCP
    ELC --> FCP
    ELC --> LCP
```

---

## Hai bản đồ độc lập

!!! warning "Kiến trúc quan trọng"
    Dự án có **2 instance OpenLayers Map riêng biệt**, mỗi cái do một controller độc lập quản lý.

| Map | DOM id | Controller | Trang |
|---|---|---|---|
| Map chính | `#map-DPHCC` | `LayerController` | Trang "Layers" |
| Map Edit | `#edit-layer-map` | `EditLayerController` | Trang "Edit Layers" |

**Quy tắc bắt buộc:** `FeatureCRUDPanel` không hard-code controller nào. Khi cần redraw, nó gọi **callback được inject từ bên ngoài** — controller nào mở panel thì controller đó cung cấp draw function.

```mermaid
graph LR
    LC["LayerController\n(map-DPHCC)"] -->|"onRequestRedraw callback"| FCP["FeatureCRUDPanel"]
    ELC["EditLayerController\n(edit-layer-map)"] -->|"onRequestRedraw callback"| FCP
    FCP -->|"gọi callback(drawType, wktCb)"| LC
    FCP -->|"gọi callback(drawType, wktCb)"| ELC
```

---

## Cấu trúc thư mục đầy đủ

```
gServer_0.0.1/
├── gClient_ExtJS/
│   └── g-client/
│       ├── app.json                         ← Sencha config
│       ├── index.html                       ← Entry (OL CDN, popup CSS)
│       └── app/desktop/src/
│           ├── Application.js               ← App entry, apiHost
│           ├── controller/
│           │   ├── LayerController.js       ← Trang Layers + map-DPHCC
│           │   └── MapController.js         ← Map đơn giản
│           ├── store/LayerStore.js
│           └── view/
│               ├── main/                    ← Shell (MainView, CenterView)
│               ├── home/                    ← Trang chủ
│               ├── map/MapPanel.js
│               ├── LAYERS/LayerPanel.js     ← Trang Layers (cls=map-DPHCC-cls)
│               ├── Features/                ← FeatureStore, FeatureModel
│               ├── EditLayer/
│               │   ├── LayerView.js         ← Trang Edit Layers
│               │   └── EditLayerController.js
│               ├── FeatureCRUD/
│               │   └── FeatureCRUDPanel.js  ← Modal CRUD Feature
│               └── LayerCRUD/
│                   └── LayerCRUDPanel.js    ← Modal CRUD Layer
│
└── gServer_0.0.1/
    ├── IServices/ILayerService.cs           ← WCF contract
    ├── Services/LayerService.cs             ← Implementation
    ├── Bussines/LayerBLL.cs                 ← Business logic
    ├── Repositories/LayerRepository.cs      ← SQL queries
    ├── Models/                              ← C# POCOs
    └── Web.config                           ← DB connection, log4net
```
