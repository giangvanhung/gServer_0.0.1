using gServer_0._0._1.Helper;
using gServer_0._0._1.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace gServer_0._0._1.Repositories
{
    public class LayerRepository
    {
        private readonly QueryHelper _queryHelper;

        public LayerRepository()
        {
            _queryHelper = new QueryHelper();
        }

        /// <summary>
        /// 1. CHECK EXIST: Kiểm tra trùng tên Layer. 
        /// Hỗ trợ cả Update (bỏ qua chính nó bằng cách truyền currentId)
        /// </summary>
        public async Task<bool> CheckNameExist(string name, int currentId = 0)
        {
            string sql = "SELECT COUNT(1) FROM LAYERS WHERE Name = @Name AND Id != @Id";
            
            var parameters = new Dictionary<string, object>
            {
                { "@Name", name },
                { "@Id", currentId }
            };

            object result = await _queryHelper.ExecuteScalarAsync(sql, parameters);
            return Convert.ToInt32(result) > 0;
        }

        /// <summary>
        /// 2. INSERT: Thêm mới cấu hình lớp bản đồ và trả về ID tự sinh
        /// </summary>
        public async Task<int> InsertAsync(Layer entity)
        {
            string sql = @"INSERT INTO LAYERS (Name, Source, Description, LayerType, IsVisible, Opacity, MinZoom, MaxZoom)
                           VALUES (@Name, @Source, @Description, @LayerType, @IsVisible, @Opacity, @MinZoom, @MaxZoom);
                           SELECT SCOPE_IDENTITY();";

            var parameters = new Dictionary<string, object>
            {
                {"@Name", entity.Name},
                {"@Source", entity.Source ?? (object)DBNull.Value},
                {"@Description", entity.Description ?? (object)DBNull.Value},
                {"@LayerType", entity.LayerType},
                {"@IsVisible", entity.IsVisible},
                {"@Opacity", entity.Opacity},
                {"@MinZoom", entity.MinZoom},
                {"@MaxZoom", entity.MaxZoom}
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
                LogHelper.LogError($"[LayerRepository.InsertAsync] Lỗi SQL khi thêm layer: {entity.Name}", ex);
                throw new Exception($"[LayerRepository.InsertAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 3. UPDATE: Cập nhật thông tin cấu hình Layer theo ID
        /// </summary>
        public async Task<int> UpdateAsync(Layer entity)
        {
            string sql = @"UPDATE LAYERS 
                           SET Name = @Name, 
                               Source = @Source, 
                               Description = @Description, 
                               LayerType = @LayerType, 
                               IsVisible = @IsVisible, 
                               Opacity = @Opacity, 
                               MinZoom = @MinZoom, 
                               MaxZoom = @MaxZoom
                           WHERE Id = @Id;";

            var parameters = new Dictionary<string, object>
            {
                {"@Id", entity.Id},
                {"@Name", entity.Name},
                {"@Source", entity.Source ?? (object)DBNull.Value},
                {"@Description", entity.Description ?? (object)DBNull.Value},
                {"@LayerType", entity.LayerType},
                {"@IsVisible", entity.IsVisible},
                {"@Opacity", entity.Opacity},
                {"@MinZoom", entity.MinZoom},
                {"@MaxZoom", entity.MaxZoom}
            };

            try
            {
                // Trả về số hàng bị ảnh hưởng (1 nếu thành công, 0 nếu không tìm thấy ID)
                return await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerRepository.UpdateAsync] Lỗi SQL khi sửa layer ID: {entity.Id}", ex);
                throw new Exception($"[LayerRepository.UpdateAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 4. DELETE: Xóa Layer khỏi bảng cấu hình
        /// </summary>
        public async Task<int> DeleteAsync(int id)
        {
            string sql = "DELETE FROM LAYERS WHERE Id = @Id;";
            
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
                LogHelper.LogError($"[LayerRepository.DeleteAsync] Lỗi SQL khi xóa layer ID: {id}", ex);
                throw new Exception($"[LayerRepository.DeleteAsync] Lỗi ràng buộc dữ liệu hoặc lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 5. READ ALL: Lấy danh sách toàn bộ các lớp bản đồ đổ vào DTO rút gọn
        /// </summary>
        public async Task<ServiceResult<List<LayerListDto>>> GetLayersAsync()
        {
            string sql = "SELECT Id, Name, LayerType, IsVisible FROM LAYERS ORDER BY Id DESC;";
            var list = new List<LayerListDto>();

            try
            {
                DataTable dt = await _queryHelper.ExecuteReaderAsync(sql);
                foreach (DataRow row in dt.Rows)
                {
                    list.Add(new LayerListDto
                    {
                        Id = Convert.ToInt32(row["Id"]),
                        Name = row["Name"].ToString(),
                        LayerType = row["LayerType"].ToString(),
                        IsVisible = Convert.ToBoolean(row["IsVisible"])
                    });
                }
                return new ServiceResult<List<LayerListDto>>
                {
                    Success = true,
                    Data = list,
                };
            }
            catch (SqlException ex)
            {
                LogHelper.LogError("[LayerRepository.GetLayersAsync] Lỗi SQL khi đọc danh sách Layer", ex);
                throw new Exception($"[LayerRepository.GetLayersAsync] Lỗi DB: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// 6. BULK INSERT FEATURES: Đổ danh sách đối tượng không gian ngầm vào bảng riêng biệt.
        /// (Giả định bạn có bảng FEATURES liên kết khóa ngoại với bảng LAYERS thông qua LayerId)
        /// </summary>
        public async Task<bool> BulkInsertFeaturesAsync(int layerId, FeatureCollection features)
        {
            // Tạm thời viết khung sườn vòng lặp thực thi thô. 
            // Sau này khi thiết kế bảng FEATURES với dữ liệu GEOMETRY, 
            // chúng ta sẽ nâng cấp hàm này lên SqlBulkCopy để tối ưu hóa tốc độ nạp hàng triệu điểm.
            try
            {
                string sql = "INSERT INTO FEATURES (LayerId, Geom, Properties) VALUES (@LayerId, @Geom, @Props);";

                foreach (var feat in features.Features)
                {
                    var parameters = new Dictionary<string, object>
                    {
                        { "@LayerId", layerId },
                        { "@Geom", feat.GeomWkt }, // Chuỗi định dạng WKT (Well-Known Text) ví dụ: POINT(105 21)
                        { "@Props", feat.Properties } // Thuộc tính phi không gian dạng chuỗi JSON
                    };
                    await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
                }
                return true;
            }
            catch (Exception ex)
            {
                LogHelper.LogError($"[LayerRepository.BulkInsertFeaturesAsync] Thất bại khi nạp dữ liệu cho Layer {layerId}", ex);
                throw;
            }
        }

        // Thay async Task bằng Task hoặc plain method
        public async Task<FeatureInfoCollection> GetInfoFeaturesByLayerIdAsync(int layerId)
        {
            var result = new FeatureInfoCollection();

            string sql = @"
            SELECT 
                Id,
                ISNULL(Properties, '{}') AS Properties
            FROM FEATURES 
            WHERE LayerId = @LayerId
            AND Geom IS NOT NULL";

            var parameters = new Dictionary<string, object>
            {
                { "@LayerId", layerId }
            };

            DataTable dataTable = await _queryHelper.ExecuteReaderAsync(sql, parameters);

            foreach (DataRow row in dataTable.Rows)
            {
                var id = row["Id"].ToString();

                // Get WKT string

                // Handle Properties
                var propsRaw = "";
                if (row["Properties"] != null && !string.IsNullOrWhiteSpace(row["Properties"].ToString()))
                {
                    propsRaw = row["Properties"].ToString();
                }

                Dictionary<string, object> properties = new Dictionary<string, object>();
                if (!string.IsNullOrWhiteSpace(propsRaw) && propsRaw.Trim().StartsWith("{"))
                {
                    try
                    {
                        properties = JsonConvert.DeserializeObject<Dictionary<string, object>>(propsRaw);
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"Lỗi Properties Id {id}: {ex.Message}");
                        properties.Add("raw", propsRaw);
                    }
                }

                result.Features.Add(new Feature
                {
                    Id = id,
                    Properties = properties
                });
            }

            return result;
        }

        // Helper: Chuyển GeoJSON Dictionary → WKT
        private object WktToGeoJsonGeometry(string wkt)
        {
            if (wkt == null || wkt.Trim().Length == 0)
                return null;


            wkt = wkt.Trim();

            if (wkt.StartsWith("POINT", StringComparison.OrdinalIgnoreCase))
            {
                var inner = wkt
                    .Replace("POINT", "")
                    .Replace("(", "")
                    .Replace(")", "")
                    .Trim();

                var p = inner.Split(
                    new[] { ' ' },
                    StringSplitOptions.RemoveEmptyEntries);

                if (p.Length < 2)
                    return null;

                return new Dictionary<string, object>
                {
                    { "type", "Point" },
                    { "coordinates", new double[] { double.Parse(p[0]), double.Parse(p[1]) } }
                };
            }

            if (wkt.StartsWith("LINESTRING", StringComparison.OrdinalIgnoreCase))
            {
                var inner = wkt.Substring(
                    wkt.IndexOf('(') + 1,
                    wkt.LastIndexOf(')') - wkt.IndexOf('(') - 1);

                var coords = new List<double[]>();

                foreach (var pair in inner.Split(','))
                {
                    var p = pair.Trim().Split(
                        new[] { ' ' },
                        StringSplitOptions.RemoveEmptyEntries);

                    if (p.Length >= 2)
                    {
                        coords.Add(new double[] { double.Parse(p[0]), double.Parse(p[1]) });
                    }
                }

                if (coords.Count == 0)
                    return null;

                return new Dictionary<string, object>
                {
                    { "type", "LineString" },
                    { "coordinates", coords }
                };
            }

            if (wkt.StartsWith("POLYGON", StringComparison.OrdinalIgnoreCase))
            {
                var inner = wkt
                    .Replace("POLYGON", "")
                    .Replace("((", "")
                    .Replace("))", "")
                    .Trim();

                var coords = new List<double[]>();

                foreach (var pair in inner.Split(','))
                {
                    var p = pair.Trim().Split(
                        new[] { ' ' },
                        StringSplitOptions.RemoveEmptyEntries);

                    if (p.Length >= 2)
                    {
                        coords.Add(new double[] { double.Parse(p[0]), double.Parse(p[1]) });
                    }
                }

                if (coords.Count == 0)
                    return null;

                return new Dictionary<string, object>
                {
                    { "type", "Polygon" },
                    { "coordinates", new List<List<double[]>> { coords } }
                };
            }

            // ✅ return null instead of throw
            return null;
        }


        public async Task<Feature> GetFeatureGeometryAsync(int featureId)
        {
            string sql = @"
                SELECT 
                    Geom.STAsText() AS GeomText
                FROM FEATURES 
                WHERE Id = @featureId"; // Thêm AND LayerId = @layerId nếu cần

            var parameters = new Dictionary<string, object>
            {
                { "@featureId", featureId }
            };

            DataTable dataTable = await _queryHelper.ExecuteReaderAsync(sql, parameters);

            if (dataTable.Rows.Count > 0)
            {
                DataRow row = dataTable.Rows[0];
                var geomText = row["GeomText"] != DBNull.Value ? row["GeomText"].ToString() : null;

                return new Feature
                {
                    Id = featureId.ToString(),
                    GeomWkt = geomText
                };
            }

            return null; 
        }

        public async Task<Feature> GetFeatureByIdAsync(int featureId)
        {
            string sql = @"
                SELECT
                    Id,
                    Geom.STAsText() AS GeomText,
                    ISNULL(Properties, '{}') AS Properties
                FROM FEATURES
                WHERE Id = @featureId";

            var parameters = new Dictionary<string, object>
            {
                { "@featureId", featureId }
            };

            DataTable dt = await _queryHelper.ExecuteReaderAsync(sql, parameters);

            if (dt.Rows.Count == 0) return null;

            DataRow row = dt.Rows[0];
            var geomText = row["GeomText"] != DBNull.Value ? row["GeomText"].ToString() : null;
            var propsRaw = row["Properties"].ToString();

            Dictionary<string, object> properties = new Dictionary<string, object>();
            if (!string.IsNullOrWhiteSpace(propsRaw) && propsRaw.Trim().StartsWith("{"))
            {
                try { properties = JsonConvert.DeserializeObject<Dictionary<string, object>>(propsRaw); }
                catch { }
            }

            return new Feature
            {
                Id = featureId.ToString(),
                GeomWkt = geomText,
                Properties = properties
            };
        }

        public async Task<FeatureCollection> IdentifyFeaturesAsync(double lon, double lat)
        {
            var result = new FeatureCollection();

            // Buffer ~5m tolerance so point/line features are clickable, polygon uses STIntersects naturally
            string pointWkt = $"POINT({lon.ToString(System.Globalization.CultureInfo.InvariantCulture)} {lat.ToString(System.Globalization.CultureInfo.InvariantCulture)})";

            string sql = @"
                SELECT
                    Id,
                    Geom.STAsText() AS GeomText,
                    ISNULL(Properties, '{}') AS Properties
                FROM FEATURES
                WHERE Geom IS NOT NULL
                  AND Geom.STIntersects(geometry::STGeomFromText(@point, 4326).STBuffer(0.00005)) = 1";

            var parameters = new Dictionary<string, object>
            {
                { "@point", pointWkt }
            };

            DataTable dt = await _queryHelper.ExecuteReaderAsync(sql, parameters);

            foreach (DataRow row in dt.Rows)
            {
                var geomText = row["GeomText"] != DBNull.Value ? row["GeomText"].ToString() : null;
                var propsRaw = row["Properties"].ToString();

                Dictionary<string, object> properties = new Dictionary<string, object>();
                if (!string.IsNullOrWhiteSpace(propsRaw) && propsRaw.Trim().StartsWith("{"))
                {
                    try { properties = JsonConvert.DeserializeObject<Dictionary<string, object>>(propsRaw); }
                    catch { }
                }

                result.Features.Add(new Feature
                {
                    Id = row["Id"].ToString(),
                    GeomWkt = geomText,
                    Properties = properties
                });
            }

            return result;
        }

        public async Task<FeatureCollection> GetFeaturesByListIdsAsync(FeatureBatchRequest request)
        {
            var result = new FeatureCollection();

            if (request == null || request.FeatureIds == null || !request.FeatureIds.Any()) return result;
            var featureIds = request.FeatureIds;
            // Sử dụng Dapper hoặc parameterized query động để tránh SQL Injection cho IN clause
            // Ví dụ tạo chuỗi param: @Id0, @Id1, @Id2...
            var paramNames = featureIds.Select((s, i) => "@Id" + i).ToArray();

            string sql = $@"
            SELECT 
                Id,
                Geom.STAsText() AS GeomText
            FROM FEATURES 
            WHERE Id IN ({string.Join(",", paramNames)}) AND Geom IS NOT NULL";

            var parameters = new Dictionary<string, object>();
            for (int i = 0; i < featureIds.Count; i++)
            {
                parameters.Add("@Id" + i, featureIds[i]);
            }

            DataTable dataTable = await _queryHelper.ExecuteReaderAsync(sql, parameters);

            // Parse và tính toán Envelope cho nhóm này như cũ...
            // (Vòng lặp foreach parse WKT sang FeatureCollection)
            foreach (DataRow row in dataTable.Rows)
            {
                var id = row["Id"].ToString();

                // Get WKT string
                var geomText = row["GeomText"] != DBNull.Value ? row["GeomText"].ToString() : null;

                // Handle Properties
                result.Features.Add(new Feature
                {
                    Id = id,
                    GeomWkt = geomText
                });
            }
            result.CalculateEnvelope();

            return result;
        }

        public async Task<int> InsertFeatureAsync(int layerId, string geomWkt, string propertiesJson)
        {
            string propsJson = !string.IsNullOrEmpty(propertiesJson) ? propertiesJson : "{}";

            LogHelper.LogInfo($"[DEBUG]: {propsJson}");
            string sql = @"INSERT INTO FEATURES (LayerId, Geom, Properties)
                           VALUES (@LayerId, geometry::STGeomFromText(@Geom, 4326), @Props);
                           SELECT SCOPE_IDENTITY();";
            var parameters = new Dictionary<string, object>
            {
                { "@LayerId", layerId },
                { "@Geom",    geomWkt },
                { "@Props",   propsJson }
            };
            try
            {
                object result = await _queryHelper.ExecuteScalarAsync(sql, parameters);
                return (result != null && result != DBNull.Value) ? Convert.ToInt32(result) : 0;
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerRepository.InsertFeatureAsync] LayerId: {layerId}", ex);
                throw new Exception($"Lỗi DB khi thêm Feature: {ex.Message}", ex);
            }
        }

        public async Task<int> UpdateFeatureAsync(int featureId, string geomWkt, string properties)
        {
            string propsJson = !string.IsNullOrEmpty(properties) ? properties : "{}";
            string sql = @"UPDATE FEATURES
                           SET Geom       = geometry::STGeomFromText(@Geom, 4326),
                               Properties = @Props
                           WHERE Id = @Id";
            var parameters = new Dictionary<string, object>
            {
                { "@Id",    featureId },
                { "@Geom",  geomWkt },
                { "@Props", propsJson }
            };
            try
            {
                return await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerRepository.UpdateFeatureAsync] FeatureId: {featureId}", ex);
                throw new Exception($"Lỗi DB khi cập nhật Feature: {ex.Message}", ex);
            }
        }

        public async Task<int> DeleteFeatureAsync(int featureId)
        {
            string sql = "DELETE FROM FEATURES WHERE Id = @Id";
            var parameters = new Dictionary<string, object> { { "@Id", featureId } };
            try
            {
                return await _queryHelper.ExecuteNonQueryAsync(sql, parameters);
            }
            catch (SqlException ex)
            {
                LogHelper.LogError($"[LayerRepository.DeleteFeatureAsync] FeatureId: {featureId}", ex);
                throw new Exception($"Lỗi DB khi xóa Feature: {ex.Message}", ex);
            }
        }
    }
}