using System;
using System.IO;
using System.Configuration;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Routing;

namespace gServerWeb.Handlers
{
    public class WcfProxyHandler : HttpTaskAsyncHandler
    {
        private static readonly HttpClient _http = new HttpClient();

        public override async Task ProcessRequestAsync(HttpContext context)
        {
            var wcfBase = ConfigurationManager.AppSettings["WcfBaseUrl"].TrimEnd('/');

            // Strip /api/ prefix: /api/LayerService.svc/layers → LayerService.svc/layers
            var fullPath  = context.Request.Path;
            const string prefix = "/api/";
            var idx      = fullPath.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
            var subPath  = idx >= 0 ? fullPath.Substring(idx + prefix.Length) : fullPath.TrimStart('/');

            var query = context.Request.QueryString.ToString();
            var url   = $"{wcfBase}/{subPath}{(query.Length > 0 ? "?" + query : "")}";

            var method = new HttpMethod(context.Request.HttpMethod);
            var req    = new HttpRequestMessage(method, url);

            if (method != HttpMethod.Get && method != HttpMethod.Delete)
            {
                var ms = new MemoryStream();
                await context.Request.InputStream.CopyToAsync(ms);
                if (ms.Length > 0)
                {
                    ms.Position = 0;
                    var body = new ByteArrayContent(ms.ToArray());
                    body.Headers.ContentType = System.Net.Http.Headers.MediaTypeHeaderValue
                        .Parse(context.Request.ContentType ?? "application/json");
                    req.Content = body;
                }
            }

            var resp  = await _http.SendAsync(req);
            var bytes = await resp.Content.ReadAsByteArrayAsync();

            context.Response.ContentType = resp.Content.Headers.ContentType?.MediaType ?? "application/json";
            context.Response.StatusCode  = (int)resp.StatusCode;
            context.Response.BinaryWrite(bytes);
        }

        public override bool IsReusable => true;
    }

    public class WcfProxyRouteHandler : IRouteHandler
    {
        public IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new WcfProxyHandler();
        }
    }
}
