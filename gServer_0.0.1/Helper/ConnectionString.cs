using System.Configuration;

namespace gServer_0._0._1.Helper
{
	public class ConnectionString
	{
		public string GetString()
		{
			return ConfigurationManager.ConnectionStrings["geoDB"].ConnectionString;
		}
	}
}