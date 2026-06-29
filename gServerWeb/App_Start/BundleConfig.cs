using System.Web.Optimization;

namespace gServerWeb
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            // Scripts/Content đã được chuyển sang ExtJS webpack bundle.
            // BundleConfig giữ lại trống để Global.asax không báo lỗi.
        }
    }
}
