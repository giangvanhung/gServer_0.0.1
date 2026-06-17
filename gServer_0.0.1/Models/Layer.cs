using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace gServer_0._0._1.Models
{
    public class Layer
    {
        public int Id { get; set; } 
        public string Name { get; set; }
        public string Source { get; set; }
        public string Description { get; set; }
        public string LayerType { get; set; } = "Vector";
        public bool IsVisible { get; set; } = true;
        public double Opacity { get; set; } = 1.0;
        public int MinScale { get; set; } = 0;
        public int MaxScale { get; set; } = 100000000;
        public FeatureCollection Data { get; set; } = new FeatureCollection();
        public Envelope Extent => Data?.BoundingBox;
    }
}