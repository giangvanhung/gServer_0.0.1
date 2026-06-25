using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class FeatureRequest
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string GeomWkt { get; set; }

        [DataMember]
        public string Properties { get; set; }
    }
}