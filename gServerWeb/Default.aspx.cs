using System.Web.UI;

namespace gServerWeb
{
    public partial class _Default : Page
    {
        protected void Page_Load(object sender, System.EventArgs e)
        {
            Response.Redirect("~/Login.aspx");
        }
    }
}
