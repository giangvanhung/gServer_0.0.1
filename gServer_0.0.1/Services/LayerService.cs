using gServer_0._0._1.Bussines;
using gServer_0._0._1.Helper;
using gServer_0._0._1.IServices;
using gServer_0._0._1.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel.Web;
using System.Threading.Tasks;

namespace gServer_0._0._1.Services
{
    public class LayerService : ILayerService
    {
        private readonly LayerBLL _layerBLL = new LayerBLL();
        public async Task<ServiceResult<List<LayerListDto>>> GetLayersAsync()
        {
            try
            {
                return await _layerBLL.GetLayersAsync();
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerService.GetLayersAsync] Lỗi khi lấy danh sách Layer", ex);
                return new ServiceResult<List<LayerListDto>>();
            }
        }
        public async Task<ServiceResult<LayerSaveDto>> CreateLayerAsync(LayerSaveDto dto)
        {
            try
            {
                var result = await _layerBLL.CreateLayerAsync(dto);
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerService.CreateLayerAsync] Lỗi hệ thống cấp Service", ex);
                return new ServiceResult<LayerSaveDto> { Success = false, Message = "Lỗi hệ thống: " + ex.Message };
            }
        }
        public async Task<ServiceResult<int>> UpdateLayerAsync(string id, LayerSaveDto dto)
        {
            
            try
            {
                if (int.TryParse(id, out int intId))
                {
                    dto.Id = intId;
                    var result = await _layerBLL.UpdateLayerAsync(dto);
                    return result;
                }
                else
                {
                    // Xử lý lỗi nếu Id truyền lên không phải là số hợp lệ
                    throw new WebFaultException<string>("Id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
                }
                
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.UpdateLayerAsync] Lỗi khi update layer Id: {id}", ex);
                return new ServiceResult<int> { Success = false, Message = "Lỗi hệ thống: " + ex.Message };
            }
        }
        public async Task<ServiceResult<int>> DeleteLayerAsync(string id)
        {
            try
            {
                if (int.TryParse(id, out int intId))
                {
                    var result = await _layerBLL.DeleteLayerAsync(intId);
                    return result;
                }
                else
                {
                    // Xử lý lỗi nếu Id truyền lên không phải là số hợp lệ
                    throw new WebFaultException<string>("Id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
                }
                
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.DeleteLayerAsync] Lỗi khi xóa layer Id: {id}", ex);
                return new ServiceResult<int> { Success = false, Message = "Lỗi hệ thống: " + ex.Message };
            }
        }
        public async Task<ServiceResult<bool>> ImportFeaturesAsync(string layerId, FeatureCollection features)
        {
            var result = new ServiceResult<bool>();
            try
            {
                if (int.TryParse(layerId, out int intlayerId))
                {
                    if (features == null || features.Features == null || features.Features.Count == 0)
                    {
                        result.Success = false;
                        result.Message = "Bộ dữ liệu không gian truyền vào trống trơn!";
                        return result;
                    }

                    var importStatus = await _layerBLL.ImportFeaturesAsync(intlayerId, features);
                    return importStatus;
                }
                else
                {
                    // Xử lý lỗi nếu Id truyền lên không phải là số hợp lệ
                    throw new WebFaultException<string>("Id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
                }
                
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.ImportFeaturesAsync] Lỗi nghiêm trọng khi nạp dữ liệu không gian cho layer {layerId}", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống: " + ex.Message;
                return result;
            }
        }
        public async Task<FeatureInfoCollection> GetInfoFeaturesByLayerIdAsync(string layerId)
        {
            try
            {
                if (int.TryParse(layerId, out int intlayerId))
                {
                    return await _layerBLL.GetInfoFeaturesByLayerIdAsync(intlayerId);
                }
                throw new WebFaultException<string>("Id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetInfoFeaturesByLayerIdAsync] LayerId: {layerId}", ex);
                return new FeatureInfoCollection(); // trả collection rỗng thay vì crash
            }
        }
        public async Task<Feature> GetFeaturesGeometryAsync(string featuresId)
        {
            try
            {
                if (int.TryParse(featuresId, out int intfeaturesId))
                {
                    return await _layerBLL.GetFeaturesGeometryAsync(intfeaturesId);
                }
                throw new WebFaultException<string>("Id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetFeaturesByLayerIdAsync] LayerId: {featuresId}", ex);
                return new Feature(); // trả collection rỗng thay vì crash
            }
        }

        public async Task<FeatureCollection> GetFeaturesBatchAsync(string layerId, FeatureBatchRequest request)
        {
            if (!int.TryParse(layerId, out int intLayerId))
            {
                throw new WebFaultException<string>($"{intLayerId} không hợp lệ", System.Net.HttpStatusCode.BadRequest);
            }

            if (request == null || request.FeatureIds == null || !request.FeatureIds.Any())
            {
                return new FeatureCollection(); // Trả về rỗng nếu không có ID nào gửi lên
            }

            // Gọi đến hàm xử lý Query Helper gom cụm Id bạn vừa viết xong lúc nãy
            return await _layerBLL.GetFeaturesByListIdsAsync(request);
        }

        public async Task<Feature> GetFeaturesAsync(string id)
        {
            try
            {
                if (int.TryParse(id, out int intId))
                {
                    var feature = await _layerBLL.GetFeatureByIdAsync(intId);
                    return feature ?? new Feature();
                }
                throw new WebFaultException<string>("Id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetFeaturesAsync] FeatureId: {id}", ex);
                return new Feature();
            }
        }

        public async Task<FeatureCollection> IdentifyAsync(IdentifyRequest request)
        {
            try
            {
                if (request == null)
                    return new FeatureCollection();

                return await _layerBLL.IdentifyFeaturesAsync(request);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.IdentifyAsync] lon={request?.lon} lat={request?.lat}", ex);
                return new FeatureCollection();
            }
        }

        public async Task<ServiceResult<int>> AddFeatureAsync(string layerId, FeatureRequest feature)
        {
            try
            {
                LogHelper.LogInfo($"[AddFeature] Request: {JsonConvert.SerializeObject(feature)}");
                LogHelper.LogInfo($"[AddFeature] Properties: {(feature?.Properties == null ? "NULL" : feature.Properties.ToString())}");
                if (!int.TryParse(layerId, out int intLayerId))
                    throw new WebFaultException<string>("layerId không hợp lệ", System.Net.HttpStatusCode.BadRequest);
                return await _layerBLL.AddFeatureAsync(intLayerId, feature);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.AddFeatureAsync] layerId={layerId}", ex);
                return new ServiceResult<int> { Success = false, Message = "Lỗi hệ thống: " + ex.Message };
            }
        }

        public async Task<ServiceResult<int>> UpdateFeatureAsync(string id, FeatureRequest feature)
        {
            try
            {
                if (!int.TryParse(id, out int intId))
                    throw new WebFaultException<string>("id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
                return await _layerBLL.UpdateFeatureAsync(intId, feature);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.UpdateFeatureAsync] id={id}", ex);
                return new ServiceResult<int> { Success = false, Message = "Lỗi hệ thống: " + ex.Message };
            }
        }

        public async Task<ServiceResult<int>> DeleteFeatureAsync(string id)
        {
            try
            {
                if (!int.TryParse(id, out int intId))
                    throw new WebFaultException<string>("id không hợp lệ", System.Net.HttpStatusCode.BadRequest);
                return await _layerBLL.DeleteFeatureAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.DeleteFeatureAsync] id={id}", ex);
                return new ServiceResult<int> { Success = false, Message = "Lỗi hệ thống: " + ex.Message };
            }
        }
    }
}