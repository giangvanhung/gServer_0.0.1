using System.Configuration;
using System.Data.SqlClient;
using System.ServiceModel.Web;
using gServer_0._0._1.Helper;
using gServer_0._0._1.IServices;
using gServer_0._0._1.Models;

namespace gServer_0._0._1.Services
{
    public class AuthService : IAuthService
    {
        public AuthResult Login(LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Username))
                return Fail("Thiếu thông tin đăng nhập.");

            var user = QueryUser(request.Username);
            if (user == null || !PasswordHelper.Verify(request.Password, user.PasswordHash))
                return Fail("Tên đăng nhập hoặc mật khẩu không đúng.");

            if (!user.IsActive)
                return Fail("Tài khoản đã bị khóa. Liên hệ quản trị viên.");

            return new AuthResult
            {
                Success  = true,
                Token    = TokenHelper.Generate(user.Username, user.Role),
                Username = user.Username,
                Role     = user.Role,
                FullName = user.FullName
            };
        }

        public AuthResult GetMe()
        {
            var claims = GetClaims();
            if (claims == null) return Unauthorized();

            var user = QueryUser(claims.Username);
            if (user == null) return Fail("Người dùng không tồn tại.");

            return new AuthResult
            {
                Success  = true,
                Username = user.Username,
                Role     = user.Role,
                FullName = user.FullName
            };
        }

        // ── Public helper — dùng bởi các service khác ────────────────────────

        public static TokenClaims GetClaims()
        {
            var ctx = WebOperationContext.Current;
            if (ctx == null) return null;
            var auth = ctx.IncomingRequest.Headers["Authorization"] ?? "";
            if (!auth.StartsWith("Bearer ")) return null;
            return TokenHelper.Validate(auth.Substring(7));
        }

        public static bool RequireAdmin()
        {
            var c = GetClaims();
            return c != null && c.Role == "admin";
        }

        // ── Private ──────────────────────────────────────────────────────────

        private AuthResult Fail(string msg) =>
            new AuthResult { Success = false, Message = msg };

        private AuthResult Unauthorized()
        {
            if (WebOperationContext.Current != null)
                WebOperationContext.Current.OutgoingResponse.StatusCode =
                    System.Net.HttpStatusCode.Unauthorized;
            return Fail("Chưa đăng nhập hoặc token hết hạn.");
        }

        private static UserRecord QueryUser(string username)
        {
            var sql = "SELECT Username, Password, FullName, Role, IsActive " +
                      "FROM USERS WHERE Username = @u";
            using (var conn = new SqlConnection(
                ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString))
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@u", username);
                conn.Open();
                using (var r = cmd.ExecuteReader())
                {
                    if (!r.Read()) return null;
                    return new UserRecord
                    {
                        Username     = r.GetString(0),
                        PasswordHash = r.GetString(1),
                        FullName     = r.IsDBNull(2) ? "" : r.GetString(2),
                        Role         = r.GetString(3),
                        IsActive     = r.GetBoolean(4)
                    };
                }
            }
        }

        private class UserRecord
        {
            public string Username     { get; set; }
            public string PasswordHash { get; set; }
            public string FullName     { get; set; }
            public string Role         { get; set; }
            public bool   IsActive     { get; set; }
        }
    }
}
