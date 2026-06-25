using gServer_0._0._1.Bussines;
using gServer_0._0._1.Helper;
using gServer_0._0._1.IServices;
using gServer_0._0._1.Models;
using System;
using System.Collections.Generic;
using System.ServiceModel.Web;
using System.Threading.Tasks;

namespace gServer_0._0._1.Services
{
    public class LayerStyleService : ILayerStyleService
    {
        private readonly LayerStyleBLL _layerStyleBLL = new LayerStyleBLL();

        /// <summary>
        /// 1. GET ALL: Lấy tất cả Layer Styles
        /// </summary>
        public async Task<ServiceResult<List<LayerStyle>>> GetAllLayerStylesAsync()
        {
            try
            {
                return await _layerStyleBLL.GetAllLayerStylesAsync();
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.GetAllLayerStylesAsync] Lỗi khi lấy danh sách Layer Styles", ex);
                return new ServiceResult<List<LayerStyle>>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        /// <summary>
        /// 2. GET BY ID: Lấy Layer Style theo Id
        /// </summary>
        public async Task<ServiceResult<LayerStyle>> GetLayerStyleByIdAsync(string id)
        {
            try
            {
                if (!int.TryParse(id, out int intId))
                {
                    return new ServiceResult<LayerStyle>
                    {
                        Success = false,
                        Message = "Id không hợp lệ!"
                    };
                }

                return await _layerStyleBLL.GetLayerStyleByIdAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.GetLayerStyleByIdAsync] Lỗi khi lấy Layer Style", ex);
                return new ServiceResult<LayerStyle>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        /// <summary>
        /// 3. GET BY LAYER ID: Lấy Layer Style theo Layer ID
        /// </summary>
        public async Task<ServiceResult<LayerStyle>> GetLayerStyleByLayerIdAsync(string layerId)
        {
            try
            {
                if (!int.TryParse(layerId, out int intLayerId))
                {
                    return new ServiceResult<LayerStyle>
                    {
                        Success = false,
                        Message = "Layer Id không hợp lệ!"
                    };
                }

                return await _layerStyleBLL.GetLayerStyleByLayerIdAsync(intLayerId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.GetLayerStyleByLayerIdAsync] Lỗi khi lấy Layer Style", ex);
                return new ServiceResult<LayerStyle>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        /// <summary>
        /// 4. CREATE: Tạo mới Layer Style
        /// </summary>
        public async Task<ServiceResult<LayerStyle>> CreateLayerStyleAsync(LayerStyle layerStyle)
        {
            try
            {
                return await _layerStyleBLL.CreateLayerStyleAsync(layerStyle);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.CreateLayerStyleAsync] Lỗi hệ thống cấp Service", ex);
                return new ServiceResult<LayerStyle>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        /// <summary>
        /// 5. UPDATE: Cập nhật Layer Style
        /// </summary>
        public async Task<ServiceResult<int>> UpdateLayerStyleAsync(string id, LayerStyle layerStyle)
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

                layerStyle.Id = intId;
                var result = await _layerStyleBLL.UpdateLayerStyleAsync(layerStyle);
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.UpdateLayerStyleAsync] Lỗi hệ thống cấp Service", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        /// <summary>
        /// 6. DELETE: Xóa Layer Style theo Id
        /// </summary>
        public async Task<ServiceResult<int>> DeleteLayerStyleAsync(string id)
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

                return await _layerStyleBLL.DeleteLayerStyleAsync(intId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.DeleteLayerStyleAsync] Lỗi khi xóa Layer Style", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }

        /// <summary>
        /// 7. DELETE BY LAYER ID: Xóa Layer Style theo Layer ID
        /// </summary>
        public async Task<ServiceResult<int>> DeleteLayerStyleByLayerIdAsync(string layerId)
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

                return await _layerStyleBLL.DeleteLayerStyleByLayerIdAsync(intLayerId);
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleService.DeleteLayerStyleByLayerIdAsync] Lỗi khi xóa Layer Style", ex);
                return new ServiceResult<int>
                {
                    Success = false,
                    Message = "Lỗi hệ thống: " + ex.Message
                };
            }
        }
    }
}
