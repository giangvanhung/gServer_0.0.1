using System.ServiceModel;
using System.ServiceModel.Web;
using gServer_0._0._1.Models;

namespace gServer_0._0._1.IServices
{
    [ServiceContract]
    public interface IAuthService
    {
        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/login",
                   RequestFormat  = WebMessageFormat.Json,
                   ResponseFormat = WebMessageFormat.Json)]
        AuthResult Login(LoginRequest request);

        [OperationContract]
        [WebInvoke(Method = "GET", UriTemplate = "/me",
                   ResponseFormat = WebMessageFormat.Json)]
        AuthResult GetMe();
    }
}
