using System;
using System.Security.Cryptography;
using System.Text;

namespace gServer_0._0._1.Helper
{
    public static class PasswordHelper
    {
        public static string Hash(string password)
        {
            var salt = Guid.NewGuid().ToString("N");
            return $"{salt}:{Sha256(salt + ":" + password)}";
        }

        public static bool Verify(string password, string stored)
        {
            var parts = stored.Split(':');
            if (parts.Length != 2) return false;
            return parts[1] == Sha256(parts[0] + ":" + password);
        }

        private static string Sha256(string input)
        {
            using (var sha = SHA256.Create())
                return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }
    }
}
