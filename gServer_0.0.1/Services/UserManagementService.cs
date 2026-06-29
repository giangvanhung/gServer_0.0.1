using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Net;
using System.ServiceModel.Web;
using gServer_0._0._1.Helper;
using gServer_0._0._1.IServices;
using gServer_0._0._1.Models;

namespace gServer_0._0._1.Services
{
    public class UserManagementService : IUserManagementService
    {
        public ServiceResult<List<UserDto>> GetUsers()
        {
            if (!AuthService.RequireAdmin()) return Denied<List<UserDto>>();

            var list = new List<UserDto>();
            var sql  = "SELECT Id, Username, FullName, Email, Role, IsActive, CreatedAt " +
                       "FROM USERS ORDER BY Id";
            using (var conn = Open())
            using (var cmd  = new SqlCommand(sql, conn))
            using (var r    = cmd.ExecuteReader())
                while (r.Read())
                    list.Add(MapRow(r));

            return Ok(list);
        }

        public ServiceResult<UserDto> CreateUser(CreateUserRequest req)
        {
            if (!AuthService.RequireAdmin()) return Denied<UserDto>();
            if (string.IsNullOrEmpty(req?.Username) || string.IsNullOrEmpty(req.Password))
                return Fail<UserDto>("Username và Password là bắt buộc.");

            var role = (req.Role == "admin") ? "admin" : "user";
            var sql  = "INSERT INTO USERS (Username, Password, FullName, Email, Role) " +
                       "OUTPUT INSERTED.Id VALUES (@u, @p, @fn, @em, @r)";
            using (var conn = Open())
            using (var cmd  = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@u",  req.Username);
                cmd.Parameters.AddWithValue("@p",  PasswordHelper.Hash(req.Password));
                cmd.Parameters.AddWithValue("@fn", (object)req.FullName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@em", (object)req.Email    ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@r",  role);
                var id = (int)cmd.ExecuteScalar();
                return Ok(new UserDto
                {
                    Id       = id,
                    Username = req.Username,
                    FullName = req.FullName,
                    Email    = req.Email,
                    Role     = role,
                    IsActive = true
                });
            }
        }

        public ServiceResult<UserDto> UpdateUser(string id, UpdateUserRequest req)
        {
            if (!AuthService.RequireAdmin()) return Denied<UserDto>();
            if (!int.TryParse(id, out int userId)) return Fail<UserDto>("ID không hợp lệ.");

            var role = (req.Role == "admin") ? "admin" : "user";
            var setPwd = !string.IsNullOrEmpty(req.Password);

            var sql = setPwd
                ? "UPDATE USERS SET FullName=@fn, Email=@em, Role=@r, IsActive=@a, Password=@p WHERE Id=@id"
                : "UPDATE USERS SET FullName=@fn, Email=@em, Role=@r, IsActive=@a WHERE Id=@id";

            using (var conn = Open())
            using (var cmd  = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@fn", (object)req.FullName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@em", (object)req.Email    ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@r",  role);
                cmd.Parameters.AddWithValue("@a",  req.IsActive);
                cmd.Parameters.AddWithValue("@id", userId);
                if (setPwd) cmd.Parameters.AddWithValue("@p", PasswordHelper.Hash(req.Password));

                var rows = cmd.ExecuteNonQuery();
                if (rows == 0) return Fail<UserDto>("Không tìm thấy người dùng.");
            }

            return Ok(GetById(userId));
        }

        public ServiceResult<bool> DeleteUser(string id)
        {
            if (!AuthService.RequireAdmin()) return Denied<bool>();
            if (!int.TryParse(id, out int userId)) return Fail<bool>("ID không hợp lệ.");

            using (var conn = Open())
            using (var cmd  = new SqlCommand("DELETE FROM USERS WHERE Id=@id", conn))
            {
                cmd.Parameters.AddWithValue("@id", userId);
                cmd.ExecuteNonQuery();
            }
            return Ok(true);
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private SqlConnection Open()
        {
            var conn = new SqlConnection(
                ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString);
            conn.Open();
            return conn;
        }

        private UserDto GetById(int id)
        {
            using (var conn = Open())
            using (var cmd  = new SqlCommand(
                "SELECT Id,Username,FullName,Email,Role,IsActive,CreatedAt FROM USERS WHERE Id=@id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                    return r.Read() ? MapRow(r) : null;
            }
        }

        private static UserDto MapRow(SqlDataReader r) => new UserDto
        {
            Id        = r.GetInt32(0),
            Username  = r.GetString(1),
            FullName  = r.IsDBNull(2) ? "" : r.GetString(2),
            Email     = r.IsDBNull(3) ? "" : r.GetString(3),
            Role      = r.GetString(4),
            IsActive  = r.GetBoolean(5),
            CreatedAt = r.IsDBNull(6) ? "" : r.GetDateTime(6).ToString("yyyy-MM-dd HH:mm")
        };

        private ServiceResult<T> Ok<T>(T data) =>
            new ServiceResult<T> { Success = true, Data = data };

        private ServiceResult<T> Fail<T>(string msg) =>
            new ServiceResult<T> { Success = false, Message = msg };

        private ServiceResult<T> Denied<T>()
        {
            if (WebOperationContext.Current != null)
                WebOperationContext.Current.OutgoingResponse.StatusCode = HttpStatusCode.Forbidden;
            return Fail<T>("Không có quyền thực hiện thao tác này.");
        }
    }
}
