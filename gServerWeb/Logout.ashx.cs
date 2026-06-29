using System.Web;
using System.Web.Security;

namespace gServerWeb
{
    public class LogoutHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            FormsAuthentication.SignOut();
            context.Response.Redirect("~/Login.aspx");
        }

        public bool IsReusable => false;
    }
}
