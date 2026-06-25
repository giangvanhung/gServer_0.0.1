using gServer_0._0._1.Models;
using System.Collections.Generic;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Threading.Tasks;

namespace gServer_0._0._1.IServices
{
    [ServiceContract]
    public interface ILayerStyleService
    {
        [OperationContract]
        [WebGet(UriTemplate = "layerstyles", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<List<LayerStyle>>> GetAllLayerStylesAsync();

        [OperationContract]
        [WebGet(UriTemplate = "layerstyles/{id}", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<LayerStyle>> GetLayerStyleByIdAsync(string id);

        [OperationContract]
        [WebGet(UriTemplate = "layers/{layerId}/style", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<LayerStyle>> GetLayerStyleByLayerIdAsync(string layerId);

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "layerstyles", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<LayerStyle>> CreateLayerStyleAsync(LayerStyle layerStyle);

        [OperationContract]
        [WebInvoke(Method = "PUT", UriTemplate = "layerstyles/{id}", RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<int>> UpdateLayerStyleAsync(string id, LayerStyle layerStyle);

        [OperationContract]
        [WebInvoke(Method = "DELETE", UriTemplate = "layerstyles/{id}", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<int>> DeleteLayerStyleAsync(string id);

        [OperationContract]
        [WebInvoke(Method = "DELETE", UriTemplate = "layers/{layerId}/style", ResponseFormat = WebMessageFormat.Json)]
        Task<ServiceResult<int>> DeleteLayerStyleByLayerIdAsync(string layerId);
    }
}
