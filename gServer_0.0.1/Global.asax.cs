using System;
using System.Web;

namespace gServer_0._0._1
{
    // 🎯 QUAN TRỌNG: Phải thêm ": System.Web.HttpApplication" ở đây
    public class Global : System.Web.HttpApplication
    {
        protected void Application_BeginRequest(object sender, EventArgs e)
        {
            var context = HttpContext.Current;

            // 🎯 Bổ sung Header CORS trực tiếp bằng code để bao sân, tránh lỗi IIS bỏ quên header
            context.Response.AddHeader("Access-Control-Allow-Origin", "*");
            context.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            context.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With, Authorization");

            // Kiểm tra nếu là request kiểm tra (Preflight OPTIONS) của trình duyệt
            if (context.Request.HttpMethod == "OPTIONS")
            {
                context.Response.StatusCode = 200;
                // Trả về kết quả ngay và luôn cho trình duyệt
                context.Response.End();
            }
        }
    }
}