using gServer_0._0._1.Helper;
using gServer_0._0._1.Models;
using gServer_0._0._1.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace gServer_0._0._1.Bussines
{
    public class LayerStyleBLL
    {
        private readonly LayerStyleRepository _layerStyleRepository;

        public LayerStyleBLL()
        {
            _layerStyleRepository = new LayerStyleRepository();
        }

        /// <summary>
        /// 1. READ ALL: Lấy danh sách toàn bộ Layer Styles
        /// </summary>
        public async Task<ServiceResult<List<LayerStyle>>> GetAllLayerStylesAsync()
        {
            try
            {
                var result = new ServiceResult<List<LayerStyle>>();
                var data = await _layerStyleRepository.GetAllAsync();
                
                result.Success = true;
                result.Message = "Lấy danh sách Layer Styles thành công!";
                result.Data = data;
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.GetAllLayerStylesAsync] Lỗi khi lấy danh sách Layer Styles", ex);
                throw;
            }
        }

        /// <summary>
        /// 2. READ BY ID: Lấy Layer Style theo Id
        /// </summary>
        public async Task<ServiceResult<LayerStyle>> GetLayerStyleByIdAsync(int id)
        {
            var result = new ServiceResult<LayerStyle>();
            
            if (id <= 0)
            {
                result.Success = false;
                result.Message = "Id Layer Style không hợp lệ!";
                return result;
            }

            try
            {
                var data = await _layerStyleRepository.GetByIdAsync(id);
                
                if (data == null)
                {
                    result.Success = false;
                    result.Message = $"Không tìm thấy Layer Style với Id {id}!";
                    return result;
                }

                result.Success = true;
                result.Message = "Lấy Layer Style thành công!";
                result.Data = data;
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.GetLayerStyleByIdAsync] Lỗi khi lấy Layer Style", ex);
                throw;
            }
        }

        /// <summary>
        /// 3. READ BY LAYER ID: Lấy Layer Style theo Layer ID
        /// </summary>
        public async Task<ServiceResult<LayerStyle>> GetLayerStyleByLayerIdAsync(int layerId)
        {
            var result = new ServiceResult<LayerStyle>();
            
            if (layerId <= 0)
            {
                result.Success = false;
                result.Message = "Id Layer không hợp lệ!";
                return result;
            }

            try
            {
                var data = await _layerStyleRepository.GetByLayerIdAsync(layerId);
                
                if (data == null)
                {
                    result.Success = false;
                    result.Message = $"Không tìm thấy Layer Style cho Layer {layerId}!";
                    return result;
                }

                result.Success = true;
                result.Message = "Lấy Layer Style thành công!";
                result.Data = data;
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.GetLayerStyleByLayerIdAsync] Lỗi khi lấy Layer Style", ex);
                throw;
            }
        }

        /// <summary>
        /// 4. CREATE: Tạo mới Layer Style
        /// </summary>
        public async Task<ServiceResult<LayerStyle>> CreateLayerStyleAsync(LayerStyle layerStyle)
        {
            var result = new ServiceResult<LayerStyle>();

            if (layerStyle == null)
            {
                result.Success = false;
                result.Message = "Dữ liệu Layer Style không được để trống!";
                return result;
            }

            if (layerStyle.LayerId <= 0)
            {
                result.Success = false;
                result.Message = "Layer Id không hợp lệ!";
                return result;
            }

            // Kiểm tra Layer đã tồn tại không
            var isLayerExists = await _layerStyleRepository.CheckLayerExist(layerStyle.LayerId);
            if (!isLayerExists)
            {
                result.Success = false;
                result.Message = $"Layer với Id {layerStyle.LayerId} không tồn tại!";
                return result;
            }

            // Kiểm tra xem Layer đã có Style chưa
            var styleExists = await _layerStyleRepository.CheckStyleExistByLayerId(layerStyle.LayerId);
            if (styleExists)
            {
                result.Success = false;
                result.Message = $"Layer này đã có Layer Style, hãy cập nhật thay vì tạo mới!";
                return result;
            }

            try
            {
                var newId = await _layerStyleRepository.InsertAsync(layerStyle);
                
                if (newId > 0)
                {
                    layerStyle.Id = newId;
                    result.Success = true;
                    result.Message = "Tạo Layer Style thành công!";
                    result.Data = layerStyle;
                }
                else
                {
                    result.Success = false;
                    result.Message = "Không thể tạo Layer Style!";
                }
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.CreateLayerStyleAsync] Lỗi hệ thống khi tạo Layer Style", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống: " + ex.Message;
                return result;
            }
        }

        /// <summary>
        /// 5. UPDATE: Cập nhật Layer Style
        /// </summary>
        public async Task<ServiceResult<int>> UpdateLayerStyleAsync(LayerStyle layerStyle)
        {
            var result = new ServiceResult<int>();

            if (layerStyle == null || layerStyle.Id <= 0)
            {
                result.Success = false;
                result.Message = "Dữ liệu hoặc Id Layer Style không hợp lệ!";
                return result;
            }

            if (layerStyle.LayerId <= 0)
            {
                result.Success = false;
                result.Message = "Layer Id không hợp lệ!";
                return result;
            }

            try
            {
                // Kiểm tra Layer Style tồn tại
                var existingStyle = await _layerStyleRepository.GetByIdAsync(layerStyle.Id);
                if (existingStyle == null)
                {
                    result.Success = false;
                    result.Message = $"Không tìm thấy Layer Style với Id {layerStyle.Id}!";
                    return result;
                }

                var rowsAffected = await _layerStyleRepository.UpdateAsync(layerStyle);
                
                if (rowsAffected > 0)
                {
                    result.Success = true;
                    result.Message = "Cập nhật Layer Style thành công!";
                    result.Data = rowsAffected;
                }
                else
                {
                    result.Success = false;
                    result.Message = "Không thể cập nhật Layer Style!";
                }
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.UpdateLayerStyleAsync] Lỗi hệ thống khi cập nhật Layer Style", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống: " + ex.Message;
                return result;
            }
        }

        /// <summary>
        /// 6. DELETE: Xóa Layer Style theo Id
        /// </summary>
        public async Task<ServiceResult<int>> DeleteLayerStyleAsync(int id)
        {
            var result = new ServiceResult<int>();

            if (id <= 0)
            {
                result.Success = false;
                result.Message = "Id Layer Style không hợp lệ!";
                return result;
            }

            try
            {
                var rowsAffected = await _layerStyleRepository.DeleteByIdAsync(id);
                
                if (rowsAffected > 0)
                {
                    result.Success = true;
                    result.Message = "Xóa Layer Style thành công!";
                    result.Data = rowsAffected;
                }
                else
                {
                    result.Success = false;
                    result.Message = "Không tìm thấy Layer Style để xóa!";
                }
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.DeleteLayerStyleAsync] Lỗi hệ thống khi xóa Layer Style", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống: " + ex.Message;
                return result;
            }
        }

        /// <summary>
        /// 7. DELETE: Xóa Layer Style theo Layer Id
        /// </summary>
        public async Task<ServiceResult<int>> DeleteLayerStyleByLayerIdAsync(int layerId)
        {
            var result = new ServiceResult<int>();

            if (layerId <= 0)
            {
                result.Success = false;
                result.Message = "Layer Id không hợp lệ!";
                return result;
            }

            try
            {
                var rowsAffected = await _layerStyleRepository.DeleteByLayerIdAsync(layerId);
                
                if (rowsAffected > 0)
                {
                    result.Success = true;
                    result.Message = "Xóa Layer Style thành công!";
                    result.Data = rowsAffected;
                }
                else
                {
                    result.Success = false;
                    result.Message = "Không tìm thấy Layer Style để xóa!";
                }
                
                return result;
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerStyleBLL.DeleteLayerStyleByLayerIdAsync] Lỗi hệ thống khi xóa Layer Style", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống: " + ex.Message;
                return result;
            }
        }
    }
}
