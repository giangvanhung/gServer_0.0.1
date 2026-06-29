using System;
using System.Security.Cryptography;
using System.Text;

namespace gServer_0._0._1.Helper
{
    public class TokenClaims
    {
        public string Username { get; set; }
        public string Role     { get; set; }
    }

    public static class TokenHelper
    {
        private const string Secret      = "gServer-hmac-secret-2025-ekgis";
        private const int    ExpiryHours = 8;

        public static string Generate(string username, string role)
        {
            var epoch   = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var exp     = (long)(DateTimeOffset.UtcNow.AddHours(ExpiryHours) - epoch).TotalSeconds;
            var payload = $"{username}|{role}|{exp}";
            var b64     = Convert.ToBase64String(Encoding.UTF8.GetBytes(payload));
            return $"{b64}.{Hmac(b64)}";
        }

        public static TokenClaims Validate(string token)
        {
            if (string.IsNullOrEmpty(token)) return null;
            var dot = token.LastIndexOf('.');
            if (dot < 0) return null;

            var b64 = token.Substring(0, dot);
            var sig = token.Substring(dot + 1);
            if (Hmac(b64) != sig) return null;

            string decoded;
            try { decoded = Encoding.UTF8.GetString(Convert.FromBase64String(b64)); }
            catch { return null; }

            var parts = decoded.Split('|');
            if (parts.Length != 3) return null;

            long exp;
            if (!long.TryParse(parts[2], out exp)) return null;

            var epoch = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var now   = (long)(DateTimeOffset.UtcNow - epoch).TotalSeconds;
            if (now > exp) return null;

            return new TokenClaims { Username = parts[0], Role = parts[1] };
        }

        private static string Hmac(string data)
        {
            using (var h = new HMACSHA256(Encoding.UTF8.GetBytes(Secret)))
                return Convert.ToBase64String(h.ComputeHash(Encoding.UTF8.GetBytes(data)));
        }
    }
}
