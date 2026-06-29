using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Routing;
using Microsoft.AspNet.FriendlyUrls;
using gServerWeb.Handlers;

namespace gServerWeb
{
    public static class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            // WCF proxy: /api/* → WcfBaseUrl/*  (must register before FriendlyUrls)
            routes.Add(new Route("api/{*path}", new WcfProxyRouteHandler()));

            var settings = new FriendlyUrlSettings();
            settings.AutoRedirectMode = RedirectMode.Off;
            routes.EnableFriendlyUrls(settings);
        }
    }
}
