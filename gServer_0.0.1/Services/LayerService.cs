using gServer_0._0._1.Bussines;
using gServer_0._0._1.Helper;
using gServer_0._0._1.IServices;
using gServer_0._0._1.Models;
using System;
using System.Collections.Generic;
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
                LogHelper.LogError("[LayerService.GetLayersAsync] Lỗi hệ thống", ex);
                return new ServiceResult<List<LayerListDto>>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<FeatureInfoCollection> GetInfoFeaturesByLayerIdAsync(string layerId)
        {
            if (!int.TryParse(layerId, out int intLayerId))
                return new FeatureInfoCollection();

            try
            {
                return await _layerBLL.GetInfoFeaturesByLayerIdAsync(intLayerId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetInfoFeaturesByLayerIdAsync] LayerId: {layerId}", ex);
                return new FeatureInfoCollection();
            }
        }

        public async Task<Feature> GetFeaturesGeometryAsync(string featureId)
        {
            if (!int.TryParse(featureId, out int intId))
                return null;

            try
            {
                return await _layerBLL.GetFeaturesGeometryAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetFeaturesGeometryAsync] FeatureId: {featureId}", ex);
                return null;
            }
        }

        public async Task<Feature> GetFeaturesAsync(string id)
        {
            if (!int.TryParse(id, out int intId))
                return null;

            try
            {
                return await _layerBLL.GetFeatureByIdAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetFeaturesAsync] Id: {id}", ex);
                return null;
            }
        }

        public async Task<FeatureCollection> IdentifyAsync(IdentifyRequest request)
        {
            try
            {
                return await _layerBLL.IdentifyFeaturesAsync(request);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerService.IdentifyAsync] Lỗi hệ thống", ex);
                return new FeatureCollection();
            }
        }

        public async Task<FeatureCollection> GetFeaturesBatchAsync(string layerId, FeatureBatchRequest request)
        {
            try
            {
                return await _layerBLL.GetFeaturesByListIdsAsync(request);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.GetFeaturesBatchAsync] LayerId: {layerId}", ex);
                return new FeatureCollection();
            }
        }

        public async Task<ServiceResult<LayerSaveDto>> CreateLayerAsync(LayerSaveDto layer)
        {
            try
            {
                return await _layerBLL.CreateLayerAsync(layer);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerService.CreateLayerAsync] Lỗi hệ thống cấp Service", ex);
                return new ServiceResult<LayerSaveDto>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<int>> UpdateLayerAsync(string Id, LayerSaveDto layer)
        {
            try
            {
                if (!int.TryParse(Id, out int intId))
                {
                    return new ServiceResult<int>
                    {
                        Success = false,
                        Message = "Id không hợp lệ!"
                    };
                }

                layer.Id = intId;
                return await _layerBLL.UpdateLayerAsync(layer);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.UpdateLayerAsync] Id: {Id}", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<int>> DeleteLayerAsync(string Id)
        {
            try
            {
                if (!int.TryParse(Id, out int intId))
                {
                    return new ServiceResult<int>
                    {
                        Success = false,
                        Message = "Id không hợp lệ!"
                    };
                }

                return await _layerBLL.DeleteLayerAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.DeleteLayerAsync] Id: {Id}", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<bool>> ImportFeaturesAsync(string layerId, FeatureCollection features)
        {
            try
            {
                if (!int.TryParse(layerId, out int intLayerId))
                {
                    return new ServiceResult<bool>
                    {
                        Success = false,
                        Message = "Layer Id không hợp lệ!"
                    };
                }

                return await _layerBLL.ImportFeaturesAsync(intLayerId, features);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.ImportFeaturesAsync] LayerId: {layerId}", ex);
                return new ServiceResult<bool>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<int>> AddFeatureAsync(string layerId, FeatureRequest feature)
        {
            try
            {
                if (!int.TryParse(layerId, out int intLayerId))
                {
                    return new ServiceResult<int>
                    {
                        Success = false,
                        Message = "Layer Id không hợp lệ!"
                    };
                }

                return await _layerBLL.AddFeatureAsync(intLayerId, feature);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.AddFeatureAsync] LayerId: {layerId}", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<int>> UpdateFeatureAsync(string id, FeatureRequest feature)
        {
            try
            {
                if (!int.TryParse(id, out int intId))
                {
                    return new ServiceResult<int>
                    {
                        Success = false,
                        Message = "Id không hợp lệ!"
                    };
                }

                return await _layerBLL.UpdateFeatureAsync(intId, feature);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.UpdateFeatureAsync] Id: {id}", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        public async Task<ServiceResult<int>> DeleteFeatureAsync(string id)
        {
            try
            {
                if (!int.TryParse(id, out int intId))
                {
                    return new ServiceResult<int>
                    {
                        Success = false,
                        Message = "Id không hợp lệ!"
                    };
                }

                return await _layerBLL.DeleteFeatureAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerService.DeleteFeatureAsync] Id: {id}", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }
    }
}
