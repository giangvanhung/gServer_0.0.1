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
            var globalEnv = new GeoAPI.Geometries.Envelope();

            foreach (var feature in Features)
            {
                // Sửa: feature.GeomWkt là string
                if (feature.GeomWkt == null || string.IsNullOrWhiteSpace(feature.GeomWkt)) continue;

                try
                {
                    var geom = reader.Read(feature.GeomWkt);
                    globalEnv.ExpandToInclude(geom.EnvelopeInternal);
                }
                catch (Exception)
                {
                    continue;
                }
            }

            if (globalEnv.IsNull) return;

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