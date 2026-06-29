using System;
using System.Security.Cryptography;
using System.Text;

namespace gServerWeb.Helpers
{
    // Phải giữ Secret và format giống hệt WCF TokenHelper để WCF validate được
    internal static class TokenHelper
    {
        private const string Secret      = "gServer-hmac-secret-2025-ekgis";
        private const int    ExpiryHours = 8;

        public static string Generate(string username, string role)
        {
            var epoch   = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var expiry  = (long)(DateTimeOffset.UtcNow.AddHours(ExpiryHours) - epoch).TotalSeconds;
            var payload = Convert.ToBase64String(
                              Encoding.UTF8.GetBytes(string.Format("{0}|{1}|{2}", username, role, expiry)));
            var sig = Hmac(payload);
            return payload + "." + sig;
        }

        private static string Hmac(string data)
        {
            using (var h = new HMACSHA256(Encoding.UTF8.GetBytes(Secret)))
                return Convert.ToBase64String(h.ComputeHash(Encoding.UTF8.GetBytes(data)));
        }
    }
}
