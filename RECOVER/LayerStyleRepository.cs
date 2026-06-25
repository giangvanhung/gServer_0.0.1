using gServer_0._0._1.Helper;
using gServer_0._0._1.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace gServer_0._0._1.Repositories
{
    public class LayerStyleRepository
    {
        private readonly QueryHelper _queryHelper;

        public LayerStyleRepository()
        {
            _queryHelper = new QueryHelper();
        }

        /// <summary>
        /// 1. CHECK EXIST: Kiểm tra Layer có tồn tại không
        /// </summary>
        public async Task<bool> CheckLayerExist(int layerId)
        {
            string sql = "SELECT COUNT(1) FROM LAYERS WHERE Id = @LayerId";
            
            var parameters = new Dictionary<string, object>
            {
                { "@LayerId", layerId }
            };

            object result = await _queryHelper.ExecuteScalarAsync(sql, parameters);
            return Convert.ToInt32(result) > 0;
        }

        /// <summary>
        /// 2. CHECK EXIST: Kiểm tra Layer đã có Style chưa
        /// </summary>
        public async Task<bool> CheckStyleExistByLayerId(int layerId)
        {
            string sql = "SELECT COUNT(1) FROM LAYERSTYLE WHERE LayerId = @LayerId";
            
            var parameters = new Dictionary<string, object>
            {
                { "@LayerId", layerId }
            };

            object result = await _queryHelper.ExecuteScalarAsync(sql, parameters);
            return Convert.ToInt32(result) > 0;
        }

        /// <summary>
        /// 3. GET ALL: Lấy tất cả Layer Styles
        /// </summary>
        public async Task<List<LayerStyle>> GetAllAsync()
        {
            string sql = @"SELECT Id, LayerId, FillColor, StrokeColor, StrokeWidth, IconUrl 
                           FROM LAYERSTYLE 
                           ORDER BY Id DESC";
            
            try
            {
                DataTable dataTable = await _queryHelper.ExecuteReaderAsync(sql);
                var list = new List<LayerStyle>();

                foreach (DataRow row in dataTable.Rows)
                {
                    list.Add(new LayerStyle
                    {
                        Id = Convert.ToInt32(row["Id"]),
                        LayerId = Convert.ToInt32(row["LayerId"]),
                        FillColor = row["FillColor"].ToString() ?? "#3399CC",
                        StrokeColor = row["StrokeColor"].ToString() ?? "#FFFFFF",
                        StrokeWidth = Convert.ToDouble(row["StrokeWidth"] ?? 1.5),
                        IconUrl = row["IconUrl"].ToString()
                    });
                }

                return list;
            }
            catch (SqlException ex)
            {
                LogHelper.LogError("[LayerStyleRepository.GetAllAsync] Lỗi SQL khi lấy danh sách Layer Styles", ex);
                throw new Exception($"[LayerStyleRepository.GetAllAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 4. GET BY ID: Lấy Layer Style theo Id
        /// </summary>
        public async Task<LayerStyle> GetByIdAsync(int id)
        {
            string sql = @"SELECT Id, LayerId, FillColor, StrokeColor, StrokeWidth, IconUrl 
                           FROM LAYERSTYLE 
                           WHERE Id = @Id";
            
            var parameters = new Dictionary<string, object>
            {
                { "@Id", id }
            };

            try
            {
                DataTable dataTable = await _queryHelper.ExecuteReaderAsync(sql, parameters);

                if (dataTable.Rows.Count == 0)
                    return null;

                DataRow row = dataTable.Rows[0];
                return new LayerStyle
                {
                    Id = Convert.ToInt32(row["Id"]),
                    LayerId = Convert.ToInt32(row["LayerId"]),
                    FillColor = row["FillColor"].ToString() ?? "#3399CC",
                    StrokeColor = row["StrokeColor"].ToString() ?? "#FFFFFF",
                    StrokeWidth = Convert.ToDouble(row["StrokeWidth"] ?? 1.5),
                    IconUrl = row["IconUrl"].ToString()
                };
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerStyleRepository.GetByIdAsync] Lỗi SQL khi lấy Layer Style ID: {id}", ex);
                throw new Exception($"[LayerStyleRepository.GetByIdAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 5. GET BY LAYER ID: Lấy Layer Style theo Layer ID
        /// </summary>
        public async Task<LayerStyle> GetByLayerIdAsync(int layerId)
        {
            string sql = @"SELECT Id, LayerId, FillColor, StrokeColor, StrokeWidth, IconUrl 
                           FROM LAYERSTYLE 
                           WHERE LayerId = @LayerId";
            
            var parameters = new Dictionary<string, object>
            {
                { "@LayerId", layerId }
            };

            try
            {
                DataTable dataTable = await _queryHelper.ExecuteReaderAsync(sql, parameters);

                if (dataTable.Rows.Count == 0)
                    return null;

                DataRow row = dataTable.Rows[0];
                return new LayerStyle
                {
                    Id = Convert.ToInt32(row["Id"]),
                    LayerId = Convert.ToInt32(row["LayerId"]),
                    FillColor = row["FillColor"].ToString() ?? "#3399CC",
                    StrokeColor = row["StrokeColor"].ToString() ?? "#FFFFFF",
                    StrokeWidth = Convert.ToDouble(row["StrokeWidth"] ?? 1.5),
                    IconUrl = row["IconUrl"].ToString()
                };
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerStyleRepository.GetByLayerIdAsync] Lỗi SQL khi lấy Layer Style Layer ID: {layerId}", ex);
                throw new Exception($"[LayerStyleRepository.GetByLayerIdAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 6. INSERT: Thêm mới Layer Style và trả về ID tự sinh
        /// </summary>
        public async Task<int> InsertAsync(LayerStyle entity)
        {
            string sql = @"INSERT INTO LAYERSTYLE (LayerId, FillColor, StrokeColor, StrokeWidth, IconUrl)
                           VALUES (@LayerId, @FillColor, @StrokeColor, @StrokeWidth, @IconUrl);
                           SELECT SCOPE_IDENTITY();";

            var parameters = new Dictionary<string, object>
            {
                {"@LayerId", entity.LayerId},
                {"@FillColor", entity.FillColor ?? "#3399CC"},
                {"@StrokeColor", entity.StrokeColor ?? "#FFFFFF"},
                {"@StrokeWidth", entity.StrokeWidth},
                {"@IconUrl", entity.IconUrl ?? (object)DBNull.Value}
            };

            try
            {
                object result = await _queryHelper.ExecuteScalarAsync(sql, parameters);

                if (result != null && result != DBNull.Value)
                {
                    return Convert.ToInt32(result);
                }

                throw new Exception("Không lấy được Id mới sinh từ Database.");
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerStyleRepository.InsertAsync] Lỗi SQL khi thêm Layer Style cho Layer: {entity.LayerId}", ex);
                throw new Exception($"[LayerStyleRepository.InsertAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 7. UPDATE: Cập nhật Layer Style theo ID
        /// </summary>
        public async Task<int> UpdateAsync(LayerStyle entity)
        {
            string sql = @"UPDATE LAYERSTYLE 
                           SET LayerId = @LayerId, 
                               FillColor = @FillColor, 
                               StrokeColor = @StrokeColor, 
                               StrokeWidth = @StrokeWidth, 
                               IconUrl = @IconUrl
                           WHERE Id = @Id;";

            var parameters = new Dictionary<string, object>
            {
                {"@Id", entity.Id},
                {"@LayerId", entity.LayerId},
                {"@FillColor", entity.FillColor ?? "#3399CC"},
                {"@StrokeColor", entity.StrokeColor ?? "#FFFFFF"},
                {"@StrokeWidth", entity.StrokeWidth},
                {"@IconUrl", entity.IconUrl ?? (object)DBNull.Value}
            };

            try
            {
                return await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerStyleRepository.UpdateAsync] Lỗi SQL khi sửa Layer Style ID: {entity.Id}", ex);
                throw new Exception($"[LayerStyleRepository.UpdateAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 8. DELETE BY ID: Xóa Layer Style theo ID
        /// </summary>
        public async Task<int> DeleteByIdAsync(int id)
        {
            string sql = "DELETE FROM LAYERSTYLE WHERE Id = @Id;";
            
            var parameters = new Dictionary<string, object>
            {
                {"@Id", id}
            };

            try
            {
                return await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerStyleRepository.DeleteByIdAsync] Lỗi SQL khi xóa Layer Style ID: {id}", ex);
                throw new Exception($"[LayerStyleRepository.DeleteByIdAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 9. DELETE BY LAYER ID: Xóa Layer Style theo Layer ID
        /// </summary>
        public async Task<int> DeleteByLayerIdAsync(int layerId)
        {
            string sql = "DELETE FROM LAYERSTYLE WHERE LayerId = @LayerId;";
            
            var parameters = new Dictionary<string, object>
            {
                {"@LayerId", layerId}
            };

            try
            {
                return await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerStyleRepository.DeleteByLayerIdAsync] Lỗi SQL khi xóa Layer Style Layer ID: {layerId}", ex);
                throw new Exception($"[LayerStyleRepository.DeleteByLayerIdAsync] Lỗi DB: {ex.Message}", ex);
            }
        }
    }
}
