using System;
using System.Web.Security;
using System.Web.UI;
using gServerWeb.Helpers;

namespace gServerWeb
{
    public partial class HomePage : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Request.IsAuthenticated)
            {
                FormsAuthentication.RedirectToLoginPage();
                return;
            }

            Response.Redirect(ExtJsHelper.GetRedirectUrl(Request));
        }
    }
}
