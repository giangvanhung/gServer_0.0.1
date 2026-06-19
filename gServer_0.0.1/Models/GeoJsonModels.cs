using System.Collections.Generic;
using System.Runtime.Serialization;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class GeoJsonFeatureCollection
    {
        [DataMember(Name = "type")]
        public string Type { get; set; } = "FeatureCollection";

        [DataMember(Name = "features")]
        public List<GeoJsonFeature> Features { get; set; } = new List<GeoJsonFeature>();
    }

    [DataContract]
    public class GeoJsonFeature
    {
        [DataMember(Name = "type")]
        public string Type { get; set; } = "Feature";

        [DataMember(Name = "geometry")]
        public object Geometry { get; set; }

        [DataMember(Name = "properties")]
        public object Properties { get; set; }
    }
}