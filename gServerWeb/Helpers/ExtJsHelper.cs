using System;
using System.Configuration;
using System.Web;

namespace gServerWeb.Helpers
{
    public static class ExtJsHelper
    {
        /// <summary>
        /// Trả về URL đầy đủ tới ExtJS index.html, kèm ?loginUrl=... để ExtJS biết chỗ logout về.
        /// Nếu ExtJsMode="build" → dùng ExtJsBuildPath (file tĩnh trong gServerWeb).
        /// Nếu ExtJsMode="dev"   → dùng ExtJsBaseUrl (webpack-dev-server).
        /// </summary>
        public static string GetRedirectUrl(HttpRequest request)
        {
            var loginUrl  = request.Url.GetLeftPart(UriPartial.Authority) + "/Login.aspx";
            string extJsUrl = ConfigurationManager.AppSettings["ExtJsBaseUrl"];

            return string.Format("{0}?loginUrl={1}", extJsUrl, Uri.EscapeDataString(loginUrl));
        }
    }
}
