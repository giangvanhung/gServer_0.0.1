using gServer_0._0._1.Models;
using System.Collections.Generic;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Threading.Tasks;

namespace gServer_0._0._1.IServices
{
    [ServiceContract]
    public interface ILayerService
    {
        [OperationContract]
        [WebGet(UriTemplate = "Layers", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<List<LayerListDto>>> GetLayersAsync();

        [OperationContract]
        [WebGet(UriTemplate = "/layers/{layerId}/features", ResponseFormat = WebMessageFormat.Json)]
        Task<FeatureCollection> GetFeaturesByLayerIdAsync(string layerId);

        [OperationContract]
        [WebGet(UriTemplate = "/features/{featureId}/geometry", ResponseFormat = WebMessageFormat.Json)]
        Task<Feature> GetFeaturesAsync(string featureId);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/layers/{layerId}/features-batch", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Task<FeatureCollection> GetFeaturesBatchAsync(string layerId, FeatureBatchRequest request);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "Layers", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<LayerSaveDto>> CreateLayerAsync(LayerSaveDto layer);

        [OperationContract]
        [WebInvoke(Method = "PUT", UriTemplate = "Layers/{Id}", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<int>> UpdateLayerAsync(string Id, LayerSaveDto layer);

        [OperationContract]
        [WebInvoke(Method = "DELETE", UriTemplate = "Layers/{Id}", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<int>> DeleteLayerAsync(string Id);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "Layers/{layerId}/Features", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<bool>> ImportFeaturesAsync(string layerId, FeatureCollection features);
    }
}
