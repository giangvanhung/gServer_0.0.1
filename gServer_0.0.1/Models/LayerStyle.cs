using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace gServer_0._0._1.Models
{
    public class LayerStyle
    {
        public int Id { get; set; }
        public int LayerId { get; set; }
        public string FillColor { get; set; } = "#3399CC";   // Màu nền (cho vùng Polygon)
        public string StrokeColor { get; set; } = "#FFFFFF"; // Màu đường viền (cho Line/Polygon)
        public double StrokeWidth { get; set; } = 1.5;       // Độ rộng nét vẽ
        public string IconUrl { get; set; }
    }
}