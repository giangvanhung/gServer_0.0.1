using System.Collections.Generic;
using System.ServiceModel;
using System.ServiceModel.Web;
using gServer_0._0._1.Models;

namespace gServer_0._0._1.IServices
{
    [ServiceContract]
    public interface IUserManagementService
    {
        [OperationContract]
        [WebInvoke(Method = "GET", UriTemplate = "/users",
                   ResponseFormat = WebMessageFormat.Json)]
        ServiceResult<List<UserDto>> GetUsers();

        [OperationContract]
        [WebInvoke(Method = "POST", UriTemplate = "/users",
                   RequestFormat  = WebMessageFormat.Json,
                   ResponseFormat = WebMessageFormat.Json)]
        ServiceResult<UserDto> CreateUser(CreateUserRequest request);

        [OperationContract]
        [WebInvoke(Method = "PUT", UriTemplate = "/users/{id}",
                   RequestFormat  = WebMessageFormat.Json,
                   ResponseFormat = WebMessageFormat.Json)]
        ServiceResult<UserDto> UpdateUser(string id, UpdateUserRequest request);

        [OperationContract]
        [WebInvoke(Method = "DELETE", UriTemplate = "/users/{id}",
                   ResponseFormat = WebMessageFormat.Json)]
        ServiceResult<bool> DeleteUser(string id);
    }
}
