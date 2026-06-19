using System;
using System.Runtime.Serialization;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class LayerListDto
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string Name { get; set; }

        [DataMember]
        public string LayerType { get; set; } // point, line, polygon

        [DataMember]
        public bool IsVisible { get; set; }
    }
}