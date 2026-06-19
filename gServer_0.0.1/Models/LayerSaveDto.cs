using System;
using System.Runtime.Serialization;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class LayerSaveDto
    {
        [DataMember]
        public int Id { get; set; }
        [DataMember]
        public string Name { get; set; }
        [DataMember]
        public string Source { get; set; }
        [DataMember]
        public string Description { get; set; }
        [DataMember]
        public string LayerType { get; set; } = "POINT";
        [DataMember]
        public bool IsVisible { get; set; } = true;
        [DataMember]
        public double Opacity { get; set; } = 1.0;
        [DataMember]
        public int MinZoom { get; set; } = 0;
        [DataMember]
        public int MaxZoom { get; set; } = 22;
    }
}