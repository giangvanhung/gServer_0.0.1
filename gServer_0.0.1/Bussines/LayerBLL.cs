using gServer_0._0._1.Helper;
using gServer_0._0._1.Models;
using gServer_0._0._1.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace gServer_0._0._1.Bussines
{
    public class LayerBLL
    {
        private readonly LayerRepository _layerRepository;

        public LayerBLL()
        {
            _layerRepository = new LayerRepository();
        }

        /// <summary>
        /// 1. READ ALL: Lấy danh sách toàn bộ các Layer (Phiên bản DTO rút gọn an toàn)
        /// </summary>
        public async Task<ServiceResult<List<LayerListDto>>> GetLayersAsync()
        {
            try
            {
                // Gọi thẳng xuống Repository để lấy danh sách dữ liệu thô và map sang DTO
                return await _layerRepository.GetLayersAsync();
            }
            catch (Exception ex)
            {
                LogHelper.LogError("[LayerBLL.GetLayersAsync] Lỗi khi xử lý nghiệp vụ lấy danh sách Layer", ex);
                throw; // Ném ngược exception lên tầng Service ghi nhận tiếp
            }
        }

        /// <summary>
        /// 2. CREATE: Kiểm tra ràng buộc và tạo cấu hình Layer mới
        /// </summary>
        public async Task<ServiceResult<LayerSaveDto>> CreateLayerAsync(LayerSaveDto dto)
        {
            var result = new ServiceResult<LayerSaveDto>();

            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                result.Success = false;
                result.Message = "Dữ liệu hoặc tên Layer không được để trống!";
                return result;
            }

            // Kiểm tra trùng tên thông qua Repository
            var isExist = await _layerRepository.CheckNameExist(dto.Name, 0);
            if (isExist)
            {
                result.Success = false;
                result.Message = "Tên Layer đã tồn tại trên hệ thống!";
                return result;
            }

            try
            {
                // Mapping thủ công từ DTO sang Entity trước khi đẩy xuống Repository
                var layer = new Layer()
                {
                    Name = dto.Name,
                    Source = dto.Source,
                    Description = dto.Description,
                    LayerType = dto.LayerType?.ToUpper() ?? "POINT",
                    IsVisible = dto.IsVisible,
                    Opacity = dto.Opacity,
                    MinZoom = dto.MinZoom,
                    MaxZoom = dto.MaxZoom
                };

                int newId = await _layerRepository.InsertAsync(layer);
                dto.Id = newId;

                LogHelper.LogInfo($"[BLL] Tạo thành công Layer: {dto.Name} (Id: {newId})");
                result.Success = true;
                result.Data = dto;
                result.Message = "Tạo lớp bản đồ mới thành công!";
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerBLL.CreateLayerAsync] Lỗi khi tạo Layer {dto.Name}", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống khi lưu Database: " + ex.Message;
            }

            return result;
        }

        /// <summary>
        /// 3. UPDATE: Kiểm tra logic và cập nhật thông tin cấu hình Layer
        /// </summary>
        public async Task<ServiceResult<int>> UpdateLayerAsync(LayerSaveDto dto)
        {
            var result = new ServiceResult<int>();

            if (dto == null || dto.Id <= 0 || string.IsNullOrWhiteSpace(dto.Name))
            {
                result.Success = false;
                result.Message = "Thông tin cập nhật không hợp lệ (Id hoặc Tên trống)!";
                return result;
            }

            // Kiểm tra xem tên mới có bị trùng với Layer KHÁC trên hệ thống hay không (Ngoại trừ chính nó)
            var isExist = await _layerRepository.CheckNameExist(dto.Name, dto.Id);
            if (isExist)
            {
                result.Success = false;
                result.Message = "Tên Layer mới bị trùng với một lớp bản đồ khác!";
                return result;
            }

            try
            {
                var layer = new Layer()
                {
                    Id = dto.Id,
                    Name = dto.Name,
                    Source = dto.Source,
                    Description = dto.Description,
                    LayerType = dto.LayerType?.ToUpper() ?? "POINT",
                    IsVisible = dto.IsVisible,
                    Opacity = dto.Opacity,
                    MinZoom = dto.MinZoom,
                    MaxZoom = dto.MaxZoom
                };

                int affectedRows = await _layerRepository.UpdateAsync(layer);

                if (affectedRows > 0)
                {
                    LogHelper.LogInfo($"[BLL] Cập nhật thành công Layer ID: {dto.Id}");
                    result.Success = true;
                    result.Data = dto.Id;
                    result.Message = "Cập nhật thông tin lớp bản đồ thành công!";
                }
                else
                {
                    result.Success = false;
                    result.Message = "Không tìm thấy lớp bản đồ cần cập nhật trong hệ thống.";
                }
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerBLL.UpdateLayerAsync] Lỗi khi cập nhật Layer ID {dto.Id}", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống khi cập nhật Database: " + ex.Message;
            }

            return result;
        }

        /// <summary>
        /// 4. DELETE: Xóa lớp bản đồ dựa trên Id
        /// </summary>
        public async Task<ServiceResult<int>> DeleteLayerAsync(int id)
        {
            var result = new ServiceResult<int>();

            if (id <= 0)
            {
                result.Success = false;
                result.Message = "Mã Layer không hợp lệ.";
                return result;
            }

            try
            {
                // [Mở rộng nghiệp vụ]: Bạn có thể kiểm tra xem Layer này còn chứa dữ liệu Features ngầm không.
                // Nếu còn, bắt buộc phải xóa sạch Features trước hoặc chặn không cho xóa Layer.

                int affectedRows = await _layerRepository.DeleteAsync(id);

                if (affectedRows > 0)
                {
                    LogHelper.LogInfo($"[BLL] Xóa thành công Layer ID: {id}");
                    result.Success = true;
                    result.Data = id;
                    result.Message = "Xóa lớp bản đồ khỏi hệ thống thành công!";
                }
                else
                {
                    result.Success = false;
                    result.Message = "Lớp bản đồ không tồn tại hoặc đã bị xóa trước đó.";
                }
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerBLL.DeleteLayerAsync] Lỗi khi xóa Layer ID {id}", ex);
                result.Success = false;
                result.Message = "Lỗi hệ thống: Không thể xóa cấu hình lớp do ràng buộc dữ liệu.";
            }

            return result;
        }

        /// <summary>
        /// 5. IMPORT FEATURES: Đổ dữ liệu không gian vật lý vào Layer cụ thể
        /// </summary>
        public async Task<ServiceResult<bool>> ImportFeaturesAsync(int layerId, FeatureCollection features)
        {
            var result = new ServiceResult<bool>();

            try
            {
                // Thực hiện chèn hàng loạt (Bulk Insert) thông qua Repository
                bool isSuccess = await _layerRepository.BulkInsertFeaturesAsync(layerId, features);

                if (isSuccess)
                {
                    LogHelper.LogInfo($"[BLL] Nạp thành công {features.Features.Count} features vào Layer ID: {layerId}");
                    result.Success = true;
                    result.Data = true;
                    result.Message = $"Nạp thành công {features.Features.Count} đối tượng không gian vào bản đồ!";
                }
                else
                {
                    result.Success = false;
                    result.Message = "Quá trình lưu trữ dữ liệu không gian gặp sự cố.";
                }
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerBLL.ImportFeaturesAsync] Lỗi khi nạp danh sách Feature cho Layer ID {layerId}", ex);
                result.Success = false;
                result.Message = "Lỗi xử lý hình học: " + ex.Message;
            }

            return result;
        }

        public async Task<FeatureInfoCollection> GetInfoFeaturesByLayerIdAsync(int layerId)
        {
            return await _layerRepository.GetInfoFeaturesByLayerIdAsync(layerId);
        }

        public async Task<Feature> GetFeaturesGeometryAsync(int featuresId)
        {
            return await _layerRepository.GetFeatureGeometryAsync(featuresId);
        }
        public async Task<FeatureCollection> GetFeaturesByListIdsAsync(FeatureBatchRequest request)
        {
            //if (featureIds == null || !featureIds.Any())
            //    return new FeatureCollection();

            //// Chuyển đổi List<string> sang List<int>
            //List<int> intFeatureIds = featureIds
            //    .Select(id => int.Parse(id))
            //    .ToList();

            return await _layerRepository.GetFeaturesByListIdsAsync(request);
        }
        
    }
}