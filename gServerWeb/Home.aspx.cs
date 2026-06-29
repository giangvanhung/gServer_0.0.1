using System;
using System.Configuration;
using System.Web;
using System.Web.Security;
using System.Web.UI;

namespace gServerWeb
{
    public partial class HomePage : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // Nếu chưa login → về Login.aspx
            if (!Request.IsAuthenticated)
            {
                FormsAuthentication.RedirectToLoginPage();
                return;
            }

            // Đã login → redirect sang ExtJS
            var extJsUrl = ConfigurationManager.AppSettings["ExtJsBaseUrl"] ?? "http://localhost:1962";
            var loginUrl = Request.Url.GetLeftPart(UriPartial.Authority) + "/Login.aspx";
            Response.Redirect(string.Format("{0}?loginUrl={1}", extJsUrl, Uri.EscapeDataString(loginUrl)));
        }
    }
}
