using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace TrackingSheet.Hubs
{
    public class KanbanHub : Hub
    {
        // Метод для отправки уведомления о новой задаче всем подключенным клиентам
        public async Task NotifyNewTask(object task)
        {
            await Clients.All.SendAsync("Получена новая задача!", task);
        }
    }


}
