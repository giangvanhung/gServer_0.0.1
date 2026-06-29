using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Security;
using System.Web.UI;
using gServerWeb.Helpers;

namespace gServerWeb
{
    public partial class RegisterPage : Page
    {
        protected void Page_Load(object sender, EventArgs e) { }

        protected void btnRegister_Click(object sender, EventArgs e)
        {
            var username = txtUsername.Text.Trim();
            var fullName = txtFullName.Text.Trim();
            var email    = txtEmail.Text.Trim();
            var password = txtPassword.Text;
            var confirm  = txtConfirm.Text;

            // ── Validation ────────────────────────────────────────────────────
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(fullName) || string.IsNullOrEmpty(password))
            {
                ShowError("Vui lòng điền đầy đủ các trường bắt buộc."); return;
            }
            if (!Regex.IsMatch(username, @"^[a-zA-Z0-9_]{3,50}$"))
            {
                ShowError("Username chỉ gồm chữ, số, dấu _ và từ 3-50 ký tự."); return;
            }
            if (password.Length < 6)
            {
                ShowError("Mật khẩu tối thiểu 6 ký tự."); return;
            }
            if (password != confirm)
            {
                ShowError("Xác nhận mật khẩu không khớp."); return;
            }
            if (UsernameExists(username))
            {
                ShowError("Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác."); return;
            }

            // ── Insert user ───────────────────────────────────────────────────
            var hash = HashPassword(password);
            InsertUser(username, fullName, email, hash);

            // ── Auto-login: set FormsAuth + gserver_auth cookie ───────────────
            var ticket = new FormsAuthenticationTicket(
                version: 1, name: username,
                issueDate: DateTime.Now, expiration: DateTime.Now.AddHours(8),
                isPersistent: false, userData: "user");
            Response.Cookies.Add(new HttpCookie(
                FormsAuthentication.FormsCookieName,
                FormsAuthentication.Encrypt(ticket)));

            var token   = TokenHelper.Generate(username, "user");
            var authJson = new JavaScriptSerializer().Serialize(new {
                token    = token,
                username = username,
                role     = "user",
                fullName = fullName
            });
            Response.Cookies.Add(new HttpCookie("gserver_auth",
                Convert.ToBase64String(Encoding.UTF8.GetBytes(authJson)))
            {
                HttpOnly = false,
                Path     = "/",
                Expires  = DateTime.Now.AddHours(8)
            });

            var extJsUrl = ConfigurationManager.AppSettings["ExtJsBaseUrl"] ?? "http://localhost:1962";
            var loginUrl = Request.Url.GetLeftPart(UriPartial.Authority) + "/Login.aspx";
            Response.Redirect(string.Format("{0}?loginUrl={1}", extJsUrl, Uri.EscapeDataString(loginUrl)));
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private void ShowError(string msg)
        {
            ErrorLabel.Text     = msg;
            ErrorLabel.CssClass = "msg error show";
        }

        private bool UsernameExists(string username)
        {
            var conn = ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString;
            using (var c = new SqlConnection(conn))
            using (var cmd = new SqlCommand("SELECT COUNT(1) FROM USERS WHERE Username=@u", c))
            {
                cmd.Parameters.AddWithValue("@u", username);
                c.Open();
                return (int)cmd.ExecuteScalar() > 0;
            }
        }

        private void InsertUser(string username, string fullName, string email, string hash)
        {
            var conn = ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString;
            using (var c = new SqlConnection(conn))
            using (var cmd = new SqlCommand(
                "INSERT INTO USERS (Username,Password,FullName,Email,Role,IsActive,CreatedAt) " +
                "VALUES (@u,@p,@fn,@em,'user',1,GETDATE())", c))
            {
                cmd.Parameters.AddWithValue("@u",  username);
                cmd.Parameters.AddWithValue("@p",  hash);
                cmd.Parameters.AddWithValue("@fn", fullName);
                cmd.Parameters.AddWithValue("@em", string.IsNullOrEmpty(email) ? (object)DBNull.Value : email);
                c.Open();
                cmd.ExecuteNonQuery();
            }
        }

        private static string HashPassword(string password)
        {
            var salt = Guid.NewGuid().ToString("N");
            return salt + ":" + ComputeSha256(salt + ":" + password);
        }

        private static string ComputeSha256(string input)
        {
            using (var sha = SHA256.Create())
                return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }
    }
}
