using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Security;
using System.Web.UI;
using gServerWeb.Helpers;

namespace gServerWeb
{
    public partial class LoginPage : Page
    {
        protected void Page_Load(object sender, EventArgs e) { }

        protected void btnLogin_Click(object sender, EventArgs e)
        {
            var username = txtUsername.Text.Trim();
            var password = txtPassword.Text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                ShowError("Vui lòng nhập đầy đủ thông tin.");
                return;
            }

            var user = GetUser(username);
            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                ShowError("Tên đăng nhập hoặc mật khẩu không đúng.");
                return;
            }

            if (!user.IsActive)
            {
                ShowError("Tài khoản đã bị khóa. Liên hệ quản trị viên.");
                return;
            }

            // 1. FormsAuthentication cookie (server-side session)
            var ticket = new FormsAuthenticationTicket(
                version:      1,
                name:         username,
                issueDate:    DateTime.Now,
                expiration:   DateTime.Now.AddHours(8),
                isPersistent: false,
                userData:     user.Role
            );
            Response.Cookies.Add(new HttpCookie(
                FormsAuthentication.FormsCookieName,
                FormsAuthentication.Encrypt(ticket)));

            // 2. JS-readable cookie cho ExtJS đọc (non-HttpOnly)
            var token = TokenHelper.Generate(username, user.Role);
            var authJson = new JavaScriptSerializer().Serialize(new {
                token    = token,
                username = username,
                role     = user.Role,
                fullName = user.FullName ?? username
            });
            var authB64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(authJson));

            var authCookie = new HttpCookie("gserver_auth", authB64)
            {
                HttpOnly = false,
                Path     = "/",
                Expires  = DateTime.Now.AddHours(8)
            };
            Response.Cookies.Add(authCookie);

            // 3. Redirect sang ExtJS, kèm loginUrl để ExtJS biết redirect lại khi hết hạn
            var extJsUrl   = ConfigurationManager.AppSettings["ExtJsBaseUrl"] ?? "http://localhost:1962";
            var loginUrl   = Request.Url.GetLeftPart(UriPartial.Authority) + "/Login.aspx";
            var returnUrl  = Request.QueryString["returnUrl"];

            if (!string.IsNullOrEmpty(returnUrl))
                Response.Redirect(Uri.UnescapeDataString(returnUrl));
            else
                Response.Redirect(string.Format("{0}?loginUrl={1}", extJsUrl, Uri.EscapeDataString(loginUrl)));
        }

        private void ShowError(string msg)
        {
            ErrorLabel.Text     = msg;
            ErrorLabel.CssClass = "error-msg show";
        }

        // ── Database ──────────────────────────────────────────────────────────

        private UserRecord GetUser(string username)
        {
            var connStr = ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString;
            using (var conn = new SqlConnection(connStr))
            using (var cmd  = new SqlCommand(
                "SELECT Password, Role, IsActive, FullName FROM USERS WHERE Username = @u", conn))
            {
                cmd.Parameters.AddWithValue("@u", username);
                conn.Open();
                using (var r = cmd.ExecuteReader())
                {
                    if (!r.Read()) return null;
                    return new UserRecord
                    {
                        PasswordHash = r.GetString(0),
                        Role         = r.GetString(1),
                        IsActive     = r.GetBoolean(2),
                        FullName     = r.IsDBNull(3) ? null : r.GetString(3)
                    };
                }
            }
        }

        // ── Password ─────────────────────────────────────────────────────────

        public static string HashPassword(string password)
        {
            var salt = Guid.NewGuid().ToString("N");
            return salt + ":" + ComputeSha256(salt + ":" + password);
        }

        private static bool VerifyPassword(string password, string stored)
        {
            var parts = stored.Split(':');
            if (parts.Length != 2) return false;
            return parts[1] == ComputeSha256(parts[0] + ":" + password);
        }

        private static string ComputeSha256(string input)
        {
            using (var sha = SHA256.Create())
                return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }

        private class UserRecord
        {
            public string PasswordHash { get; set; }
            public string Role         { get; set; }
            public bool   IsActive     { get; set; }
            public string FullName     { get; set; }
        }
    }
}
