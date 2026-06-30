using System.IO;
using System.Text;
using System.Web.Security;
using System.Web.UI;

namespace gServerWeb
{
    public partial class _Default : Page
    {
        protected void Page_Load(object sender, System.EventArgs e)
        {
            if (!Request.IsAuthenticated)
            {
                FormsAuthentication.RedirectToLoginPage();
                return;
            }

            var path = Server.MapPath("~/wwwroot/production/gClient/index.html");
            var html = File.ReadAllText(path, Encoding.UTF8);

            // Inject <base href> để ExtJS resolve đúng relative URLs (bootstrap.json, JS, CSS...)
            // khi app được serve từ "/" thay vì "/build/production/gClient/"
            html = html.Replace("<head>", "<head><base href=\"/\">");

            Response.Clear();
            Response.ContentType = "text/html";
            Response.Charset = "UTF-8";
            Response.Write(html);
            Response.End();
        }
    }
}
