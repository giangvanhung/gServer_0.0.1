using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.Security;
using System.Web.SessionState;

namespace gServerWeb
{
    public class Global : HttpApplication
    {
        void Application_Start(object sender, EventArgs e)
        {
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }

        void Application_PreRequestHandlerExecute(object sender, EventArgs e)
        {
            if (!(Context.Handler is System.Web.UI.Page)) return;
            if (Request.IsAuthenticated) return;

            var filePath = Request.AppRelativeCurrentExecutionFilePath.ToLower();
            var rawPath  = Request.Path.ToLower();
            if (filePath.StartsWith("~/login")   || rawPath.StartsWith("/login")   ||
                filePath.StartsWith("~/setup")   || rawPath.StartsWith("/setup")   ||
                filePath.StartsWith("~/default") || rawPath == "/") return;

            var returnUrl = Uri.EscapeDataString(Request.Url.PathAndQuery);
            Response.Redirect("~/Login.aspx?returnUrl=" + returnUrl);
        }
    }
}