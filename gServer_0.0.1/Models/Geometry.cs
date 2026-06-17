using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace gServer_0._0._1.Models
{
    public class Geometry
    {
        public int Srid { get; set; } = 4326;
        public string Wkt { get; set; }
        public string GeometryType
        {
            get
            {
                if (string.IsNullOrWhiteSpace(Wkt)) return "UNKNOWN";
                int index = Wkt.IndexOf('(');
                return index > 0 ? Wkt.Substring(0, index).Trim().ToUpper() : Wkt.ToUpper();
            }
        }
    }
}