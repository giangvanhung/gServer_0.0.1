using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class IdentifyRequest
    {
        [DataMember(Name = "lon")] 
        public double lon { get; set; }
        [DataMember(Name = "lat")]
        public double lat { get; set; }
    }
}