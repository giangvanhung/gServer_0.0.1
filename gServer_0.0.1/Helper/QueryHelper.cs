using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace gServer_0._0._1.Helper
{
    public class QueryHelper
    {
        private readonly ConnectHelper _connectHelper;
        public QueryHelper()
        {
            _connectHelper = new ConnectHelper();
            LogHelper.LogInfo("QueryHelper đã được khởi tạo thành công.");
        }
        private SqlParameter[] MapParameters(Dictionary<string, object> dictParams)
        {
            if (dictParams == null || dictParams.Count == 0) return null;

            var sqlParams = new List<SqlParameter>();
            foreach (var item in dictParams)
            {
                // Nếu giá trị truyền vào bị null, phải chuyển thành DBNull.Value thì SQL mới chịu nhận
                var value = item.Value ?? DBNull.Value;
                sqlParams.Add(new SqlParameter(item.Key, value));
            }
            return sqlParams.ToArray();
        }
        public async Task<int> ExecuteNonQueryAsync(string sql, Dictionary<string, object> parameters = null)
        {
            SqlParameter[] sqlParams = MapParameters(parameters);
            using (SqlConnection conn = _connectHelper.GetConnect())
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (parameters != null) cmd.Parameters.AddRange(sqlParams);

                    await conn.OpenAsync();
                    return await cmd.ExecuteNonQueryAsync();
                }
            } 
        }
        public async Task<object> ExecuteScalarAsync(string sql, Dictionary<string, object> parameters = null)
        {
            SqlParameter[] sqlParams = MapParameters(parameters);
            using (SqlConnection conn = _connectHelper.GetConnect())
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (parameters != null) cmd.Parameters.AddRange(sqlParams);

                    await conn.OpenAsync();
                    return await cmd.ExecuteScalarAsync();
                }
            }
        }

        public async Task<DataTable> ExecuteReaderAsync(string sql, Dictionary<string, object> parameters = null)
        {
            DataTable dataTable = new DataTable();
            SqlParameter[] sqlParams = MapParameters(parameters);
            using (SqlConnection conn = _connectHelper.GetConnect())
            {
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (parameters != null) cmd.Parameters.AddRange(sqlParams);

                    await conn.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        dataTable.Load(reader);
                    }
                }
            }
            return dataTable;
        }
    }
}