using System.Collections.Generic;
using System.Runtime.Serialization;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class FeatureBatchRequest
    {
        [DataMember(Name = "featureIds")] // Đảm bảo khớp chính xác chữ f viết thường của Ext JS
        public List<int> FeatureIds { get; set; }
    }
}