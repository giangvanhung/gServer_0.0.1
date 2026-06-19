using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace gServer_0._0._1.Models
{
    public class Feature
    {
        public string Id { get; set; }
        public string GeomWkt { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new Dictionary<string, object>();
    }
}