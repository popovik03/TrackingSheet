//На паузе
using System.Text;
using Microsoft.AspNetCore.Mvc;

public class RemoteDesktopController : Controller
{
    [HttpGet]
    [Route("download-rdp")]
    public IActionResult DownloadRdp()
    {
        string server = "10.172.118.131";
        string username = "advmanager";

        string rdpContent = $@"
screen mode id:i:2
desktopwidth:i:1280
desktopheight:i:720
session bpp:i:32
full address:s:{server}
username:s:{username}
prompt for credentials:i:0
";
        // prompt for credentials:i:0 использует сохранённые в Credential Manager учётные данные

        byte[] byteArray = Encoding.UTF8.GetBytes(rdpContent);
        return File(byteArray, "application/x-rdp", "connection.rdp");
    }
}
