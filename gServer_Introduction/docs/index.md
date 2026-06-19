# Hệ thống WebGIS — gClient & gServer

## Giới thiệu

Dự án xây dựng một hệ thống **WebGIS** hoàn chỉnh cho phép quản lý và hiển thị dữ liệu không gian địa lý trên nền web, gồm hai thành phần chính:

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **gClient** | ExtJS 8 + OpenLayers | Giao diện người dùng, hiển thị bản đồ |
| **gServer** | WCF .NET 4.5.1 | Cung cấp dịch vụ dữ liệu qua HTTP/JSON |
| **Database** | SQL Server + Spatial | Lưu trữ dữ liệu lớp bản đồ và hình học |

## Mục tiêu dự án

- Xây dựng service WCF cung cấp dữ liệu GIS (layers, features, geometry)
- Frontend ExtJS nhận dữ liệu và điều khiển hiển thị lớp bản đồ
- OpenLayers render hình học WKT lên bản đồ tương tác
- Hỗ trợ 3 loại đối tượng: **POINT**, **LINE**, **POLYGON**

## Yêu cầu hệ thống

- .NET Framework 4.5.1
- SQL Server 2014+ (hỗ trợ kiểu `GEOMETRY`)
- Node.js (chạy dev server Sencha)
- Trình duyệt hiện đại (Chrome, Edge)
