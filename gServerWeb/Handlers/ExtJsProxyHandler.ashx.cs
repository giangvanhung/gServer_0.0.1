using System.Configuration;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace gServerWeb.Handlers
{
    public class ExtJsProxyHandler : HttpTaskAsyncHandler
    {
        private static readonly HttpClient _http = new HttpClient();

        public override async Task ProcessRequestAsync(HttpContext context)
        {
            var extJsBase = ConfigurationManager.AppSettings["ExtJsBaseUrl"].TrimEnd('/');

            // Lấy phần path sau /extjs/  ví dụ: /extjs/generatedFiles/desktop.json → generatedFiles/desktop.json
            var subPath = context.Request.PathInfo.TrimStart('/');
            var query   = context.Request.QueryString.ToString();
            var url     = $"{extJsBase}/{subPath}{(query.Length > 0 ? "?" + query : "")}";

            var response = await _http.GetAsync(url);
            var bytes    = await response.Content.ReadAsByteArrayAsync();

            context.Response.ContentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            context.Response.StatusCode  = (int)response.StatusCode;
            context.Response.BinaryWrite(bytes);
        }

        public override bool IsReusable => true;
    }
}
