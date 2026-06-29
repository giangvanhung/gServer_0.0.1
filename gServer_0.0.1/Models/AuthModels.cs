using System.Runtime.Serialization;

namespace gServer_0._0._1.Models
{
    [DataContract]
    public class LoginRequest
    {
        [DataMember] public string Username { get; set; }
        [DataMember] public string Password { get; set; }
    }

    [DataContract]
    public class AuthResult
    {
        [DataMember] public bool   Success  { get; set; }
        [DataMember] public string Message  { get; set; }
        [DataMember] public string Token    { get; set; }
        [DataMember] public string Username { get; set; }
        [DataMember] public string Role     { get; set; }
        [DataMember] public string FullName { get; set; }
    }

    [DataContract]
    public class UserDto
    {
        [DataMember] public int    Id        { get; set; }
        [DataMember] public string Username  { get; set; }
        [DataMember] public string FullName  { get; set; }
        [DataMember] public string Email     { get; set; }
        [DataMember] public string Role      { get; set; }
        [DataMember] public bool   IsActive  { get; set; }
        [DataMember] public string CreatedAt { get; set; }
    }

    [DataContract]
    public class CreateUserRequest
    {
        [DataMember] public string Username { get; set; }
        [DataMember] public string Password { get; set; }
        [DataMember] public string FullName { get; set; }
        [DataMember] public string Email    { get; set; }
        [DataMember] public string Role     { get; set; }
    }

    [DataContract]
    public class UpdateUserRequest
    {
        [DataMember] public string FullName { get; set; }
        [DataMember] public string Email    { get; set; }
        [DataMember] public string Role     { get; set; }
        [DataMember] public bool   IsActive { get; set; }
        [DataMember] public string Password { get; set; } // empty = không đổi
    }
}
