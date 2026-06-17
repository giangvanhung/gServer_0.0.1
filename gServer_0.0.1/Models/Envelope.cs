using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace gServer_0._0._1.Models
{
    public class Envelope
    {
        public double MinLat { get; set; }
        public double MaxLat { get; set; }
        public double MinLon { get; set; }
        public double MaxLon { get; set; }
        public double CenterLat => (MinLat + MaxLat) / 2;
        public double CenterLon => (MinLon + MaxLon) / 2;
        public bool Contains(double lat, double lon)
        {
            return lat >= MinLat && lat <= MaxLat &&
                   lon >= MinLon && lon <= MaxLon;
        }
        public string ToWktPolygon()
        {
            return $"POLYGON(({MinLon} {MinLat}, {MinLon} {MaxLat}, {MaxLon} {MaxLat}, {MaxLon} {MinLat}, {MinLon} {MinLat}))";
        }
    }
}