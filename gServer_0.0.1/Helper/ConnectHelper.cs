using System.Configuration;
using System.Data.SqlClient;

namespace gServer_0._0._1.Helper
{
	public class ConnectHelper
    {
		private readonly ConnectionString _connectionString;
		public ConnectHelper()
		{
			_connectionString = new ConnectionString();
		}
		public SqlConnection GetConnect()
		{
			string connectionText = _connectionString.GetString();
            return new SqlConnection(connectionText);
        }
	}
}