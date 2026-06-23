# Kế hoạch & Phân tích — Giai đoạn 2 (gServer WCF + ExtJS + OpenLayers)

> Tài liệu này phân tích **mục tiêu (task)**, **hiện trạng code**, **khoảng trống (gap)** và **kế hoạch hành động** để hoàn thành Giai đoạn 2.
> Nguồn task: Google Sheet `RoadMap_HocTap_GIS`.
> Hạn dự kiến: **26/06/2026**. Trạng thái: **Đang tiến hành**.
> Cập nhật: 23/06/2026.

---

## 1. Mục tiêu (Definition of Done)

Theo bảng task, Giai đoạn 2 được coi là **hoàn thành** khi:

1. Xây dựng **một service bằng WCF Service Application** cung cấp dữ liệu không gian (spatial) dạng **JSON**.
2. Dùng **ExtJS** nhận dữ liệu từ service và **hiển thị lớp dữ liệu trên OpenLayers**.
3. **Thuyết trình được**: bài toán đặt ra là gì → giải pháp công nghệ chi tiết **CSDL → Backend → Frontend**.

**Bối cảnh lớn:** đây là bước luyện tập đúng stack công nghệ cũ của công ty (**WCF .NET 4.5.1 + ExtJS Classic/Modern**) trước khi vào làm. Vì vậy mục tiêu thật sự không chỉ là "chạy được", mà là **tự giải thích và tự debug được** từng tầng.

---

## 2. Bản đồ năng lực hiện tại (tự chấm trong Sheet)

| Kỹ năng | Điểm | Mức | Ý nghĩa cho GĐ2 |
| --- | :-: | --- | --- |
| WCF Service Application | 10 | 🟢 Tốt | Nền tảng đã vững |
| Kiến trúc 4 lớp + ServiceResult\<T\> | 9 | 🟢 Tốt | Mạnh |
| C# / .NET 4.5.1 (async, LINQ) | 7.5 | 🟢 Tốt | Lưu ý: **không dùng ValueTuple** |
| SQL Server Spatial | 5–6 | 🟠 Cơ bản | **Cần luyện** STAsGeoJSON/STIntersects/Spatial Index |
| OpenLayers cơ bản | 10 | 🟢 Tốt | init map sau `afterrender` |
| WMS / WMTS / WFS | 3–4 | 🔴 Yếu | **Điểm yếu nhất** — axis-order WMS 1.3.0 |
| Interaction & Styling (popup) | 4 | 🟠 Cơ bản | Liên quan trực tiếp `/identify` |
| Layer Panel (TOC) | 8 | 🟢 Tốt | Đã làm tốt |
| ExtJS Modern 8 | 0 | 🔴 Yếu | Ngoài phạm vi GĐ2, để GĐ sau |

➡️ **Trọng tâm cần kéo điểm trong GĐ2: WMS/WMTS, Interaction/Popup, SQL Spatial.**

---

## 3. Hiện trạng code (đối chiếu mục tiêu)

### 3.1 Backend — `gServer_0.0.1/` (WCF .NET 4.5.1)

Kiến trúc 4 tầng rõ ràng: `Repository → BLL → Service (.svc) → WCF Endpoint`, response bọc trong `ServiceResult<T>`, ghi log bằng `log4net`, xử lý hình học bằng **NetTopologySuite**.

**Các endpoint đã có** (`IServices/ILayerService.cs`):

| Endpoint | Method | Trạng thái |
| --- | :-: | --- |
| `/layers` | GET | ✅ Hoạt động |
| `/layers/{layerId}/features` | GET | ✅ |
| `/features/{featureId}/geometry` | GET | ✅ |
| `/features/{id}` | GET | ⚠️ **Stub** — trả về `Feature` rỗng |
| `/identify` | POST | ⚠️ **Stub** — trả về collection rỗng |
| `/layers/{layerId}/features-batch` | POST | ✅ |
| `/layers` | POST (Create) | ✅ |
| `/layers/{Id}` | PUT (Update) | ✅ |
| `/layers/{Id}` | DELETE | ✅ |
| `/layers/{layerId}/features/import` | POST | ✅ |

> ⚠️ **Quan trọng:** `IdentifyAsync` và `GetFeaturesAsync` đang là **hàm rỗng** (`Services/LayerService.cs:168-178`). Trớ trêu là `/identify` chính là tính năng **click-to-popup** mà Sheet đang chấm yếu (4/10). Đây là gap rõ nhất cần đóng.

### 3.2 Frontend — `gClient_ExtJS/g-client/` (ExtJS 8 + OpenLayers)

- MVC: `controller/LayerController.js`, `controller/MapController.js`.
- Store/Model: `store/LayerStore.js`, `model/LayerModel.js`.
- View: `MapPanel.js`, `LayerPanel.js` (TOC), cụm `EditLayer/` (Layer/Feature form đang sửa).
- Đang có thay đổi chưa commit ở: `Application.js`, `LayerController.js`, `EditLayer/*` (xem `git status`).

### 3.3 Tài liệu — `gServer_Introduction/` (MkDocs)

Đã có `architecture.md`, `backend.md`, `frontend.md`, `database.md`, `dataflow.md`, `problem.md` → **nền tảng tốt cho phần thuyết trình.**

---

## 4. Khoảng trống cần đóng (Gap Analysis)

| # | Gap | Mức độ | Vì sao quan trọng |
| :-: | --- | :-: | --- |
| G1 | `IdentifyAsync` còn rỗng | 🔴 Cao | DoD yêu cầu tương tác bản đồ; là tính năng popup đang yếu |
| G2 | `GetFeaturesAsync` còn rỗng | 🟠 TB | Endpoint REST chuẩn `/features/{id}` chưa trả dữ liệu |
| G3 | OpenLayers WMS/WMTS + axis-order BBOX (WMS 1.3.0) | 🔴 Cao | Điểm yếu nhất (3/10); dễ gây lệch bản đồ |
| G4 | Popup click/hover + Style Fill/Stroke/Circle | 🟠 TB | Điểm 4/10; gắn với G1 |
| G5 | SQL Spatial: STIntersects + Spatial Index | 🟠 TB | Cần cho `/identify` nhanh & đúng |
| G6 | Dọn thay đổi đang dở ở `EditLayer/*` và commit | 🟢 Thấp | Tránh nợ kỹ thuật trước demo |
| G7 | Slide thuyết trình CSDL→Backend→Frontend | 🔴 Cao | Là một phần bắt buộc của DoD |

---

## 5. Kế hoạch hành động (đến 26/06/2026)

### Bước 1 — Đóng gap backend (G1, G2, G5)
- [ ] Hiện thực `IdentifyAsync`: nhận `IdentifyRequest` (điểm/bbox + layer), dùng **`STIntersects`** lọc feature giao với vùng click, trả `FeatureCollection` (GeoJSON/WKT).
- [ ] Hiện thực `GetFeaturesAsync(id)`: trả 1 feature thật từ repository.
- [ ] Tạo **Spatial Index** trên cột geometry; kiểm tra query trước/sau bằng thời gian chạy.
- [ ] Test mỗi endpoint bằng trình duyệt/Postman, xác nhận JSON đúng.

### Bước 2 — Đóng gap frontend (G3, G4)
- [ ] Thêm lớp WMS/WMTS từ gServer; xử lý **axis-order WMS 1.3.0** (lon/lat vs lat/lon) để bản đồ không lệch.
- [ ] Sự kiện **click → gọi `/identify` → Popup Overlay** hiển thị thuộc tính.
- [ ] Style `Fill / Stroke / Circle` cho vector layer; phân biệt trạng thái chọn (Select interaction).
- [ ] Đảm bảo init map **sau `afterrender`** (tránh bản đồ trắng).

### Bước 3 — Dọn dẹp & Git (G6)
- [ ] Hoàn thiện hoặc revert phần `EditLayer/*` đang dở.
- [ ] Commit message rõ ràng theo từng tính năng (Identify, WMS, Popup…).

### Bước 4 — Thuyết trình (G7)
- [ ] Cập nhật MkDocs: sơ đồ luồng **click → WCF `/identify` → SQL `STIntersects` → JSON → OpenLayers popup**.
- [ ] Chuẩn bị demo trực tiếp: bật/tắt layer (TOC) → click feature → popup.
- [ ] Slide 3 tầng: **CSDL (geometry, index) → Backend (WCF, 4 lớp, ServiceResult) → Frontend (ExtJS Store → OL layer)**.

---

## 6. Checklist nghiệm thu Giai đoạn 2

- [ ] WCF service trả JSON dữ liệu không gian, không lỗi CORS.
- [ ] ExtJS load danh sách layer và hiển thị lên OpenLayers.
- [ ] TOC bật/tắt layer hoạt động.
- [ ] Click feature hiện popup thuộc tính (Identify chạy thật).
- [ ] Bản đồ đúng vị trí (axis-order xử lý xong).
- [ ] Không còn endpoint stub trong phạm vi demo.
- [ ] Code đã commit sạch, README/MkDocs cập nhật.
- [ ] Slide + demo thuyết trình sẵn sàng.

---

## 7. Tham chiếu nhanh

- **Backend:** `gServer_0.0.1/IServices/ILayerService.cs`, `Services/LayerService.cs`, `Bussines/LayerBLL.cs`, `Repositories/LayerRepository.cs`
- **Frontend:** `gClient_ExtJS/g-client/app/desktop/src/`
- **Tài liệu:** `gServer_Introduction/docs/`
- **Chạy thử:** xem `README.md` (gServer F5 → gClient `npm start` → MkDocs `mkdocs serve`)
- **Lưu ý .NET 4.5.1:** không dùng `ValueTuple`; dùng `async/await` + class DTO thay thế.

---

> Sau khi xong GĐ2, cập nhật điểm trong Sheet `RoadMap_HocTap_GIS` (cột "Điểm tự chấm" nền vàng) và chuyển sang **Giai đoạn 3 (eKMap + .NET Core + Angular + Mapbox)**.
