using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace gServer_0._0._1.Models
{
    public class FeatureInfoCollection
    {
        public string Type => "FeatureInfoCollection";
        public List<Feature> Features { get; set; } = new List<Feature>();
        public Envelope BoundingBox { get; set; }
    }
}