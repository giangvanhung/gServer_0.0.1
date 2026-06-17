using System;
using System.Collections.Generic;
using System.Linq;

namespace gServer_0._0._1.Models
{
    public class FeatureCollection
    {
        public string Type => "FeatureCollection";
        public List<Feature> Features { get; set; } = new List<Feature>();
        public Envelope BoundingBox { get; set; }
        public void CalculateEnvelope()
        {
            if (Features == null || !Features.Any()) return;

            var reader = new NetTopologySuite.IO.WKTReader();

            // 1. Tạo một đối tượng Envelope rỗng của NTS để gom tọa độ
            var globalEnv = new GeoAPI.Geometries.Envelope();

            foreach (var feature in Features)
            {
                if (feature.Geometry == null || string.IsNullOrWhiteSpace(feature.Geometry.Wkt)) continue;

                try
                {
                    var geom = reader.Read(feature.Geometry.Wkt);

                    // 2. Hàm ExpandToInclude sẽ tự động tính toán nới rộng khung bao 
                    // để chứa thêm hình học mới một cách chính xác tuyệt đối
                    globalEnv.ExpandToInclude(geom.EnvelopeInternal);
                }
                catch (Exception)
                {
                    // Phòng trường hợp chuỗi WKT lỗi, không làm sập toàn bộ hệ thống
                    continue;
                }
            }

            // 3. Nếu sau khi duyệt mà không có hình học nào hợp lệ, globalEnv sẽ rỗng
            if (globalEnv.IsNull) return;

            // 4. Gán ngược lại cho class Envelope của bạn
            BoundingBox = new Envelope
            {
                MinLon = globalEnv.MinX,
                MaxLon = globalEnv.MaxX,
                MinLat = globalEnv.MinY,
                MaxLat = globalEnv.MaxY
            };
        }
    }
}