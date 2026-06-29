using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.UI;

namespace gServerWeb
{
    public partial class SetupPage : Page
    {
        protected void Page_Load(object sender, EventArgs e) { }

        protected void btnCreate_Click(object sender, EventArgs e)
        {
            try
            {
                var connStr = ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString;
                using (var conn = new SqlConnection(connStr))
                {
                    conn.Open();

                    // Tạo bảng USERS nếu chưa có
                    using (var cmd = new SqlCommand(@"
                        IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='USERS' AND xtype='U')
                        CREATE TABLE USERS (
                            Id        INT IDENTITY(1,1) PRIMARY KEY,
                            Username  NVARCHAR(50)  NOT NULL UNIQUE,
                            Password  NVARCHAR(256) NOT NULL,
                            FullName  NVARCHAR(100),
                            Email     NVARCHAR(100),
                            Role      NVARCHAR(20)  NOT NULL DEFAULT 'user',
                            IsActive  BIT           NOT NULL DEFAULT 1,
                            CreatedAt DATETIME      NOT NULL DEFAULT GETDATE()
                        )", conn))
                    {
                        cmd.ExecuteNonQuery();
                    }

                    // Tạo admin nếu chưa có
                    var hash = LoginPage.HashPassword("Admin@123");
                    using (var cmd = new SqlCommand(@"
                        IF NOT EXISTS (SELECT 1 FROM USERS WHERE Username = 'admin')
                            INSERT INTO USERS (Username, Password, FullName, Role)
                            VALUES ('admin', @pwd, N'Administrator', 'admin')
                        ELSE
                            SELECT 'exists'", conn))
                    {
                        cmd.Parameters.AddWithValue("@pwd", hash);
                        var result = cmd.ExecuteScalar();

                        ResultLabel.Text = (result?.ToString() == "exists")
                            ? "<div class='result err'>⚠ Admin đã tồn tại.</div>"
                            : "<div class='result ok'>✓ Tạo admin thành công!<br>Username: <b>admin</b> / Password: <b>Admin@123</b><br><br>Hãy xóa trang Setup.aspx sau khi dùng xong.</div>";
                    }
                }
            }
            catch (Exception ex)
            {
                ResultLabel.Text = $"<div class='result err'>Lỗi: {ex.Message}</div>";
            }
        }
    }
}
