using TrackingSheet.Models.Kanban;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using static TrackingSheet.Services.KanbanService;

namespace TrackingSheet.Services
{
    public interface IKanbanService
    {
        // Методы для работы с Kanban-досками
        Task<List<KanbanBoard>> GetAllBoardsAsync();
        Task<KanbanBoard> GetBoardByIdAsync(Guid id);
        Task<KanbanBoard> CreateBoardAsync(KanbanBoard board);
        Task UpdateBoardAsync(KanbanBoard board);
        Task DeleteBoardAsync(Guid id);

        // Методы для работы с колонками
        Task<KanbanColumn> GetColumnByIdAsync(Guid id);
        Task AddColumnToBoardAsync(Guid boardId, KanbanColumn column);
        Task UpdateColumnAsync(KanbanColumn column);
        Task DeleteColumnAsync(Guid id);
        Task RenameColumnAsync(Guid columnId, string newName);
        Task AddColumnAsync(KanbanColumn column);


        // Методы для работы с задачами
        Task<KanbanTask> GetTaskByIdAsync(Guid id);
        Task AddTaskToColumnAsync(Guid columnId, KanbanTask task);
        Task UpdateTaskAsync(KanbanTask updatedTask, byte[] originalRowVersion);
        
        Task<Guid> GetBoardIdByColumnIdAsync(Guid columnId);


        // Комментарии
        Task AddCommentAsync(KanbanComment comment);
        Task DeleteCommentAsync(KanbanComment comment);
        Task<KanbanComment> GetCommentByIdAsync(Guid commentId);


        // Новый метод для получения доски по идентификатору колонки
        Task<KanbanBoard> GetBoardByColumnIdAsync(Guid columnId);

        //Метод для сортировки колонок
        Task UpdateColumnOrderAsync(List<ColumnOrderUpdateModel> updatedOrder);

        // Методы редактирования задач
        Task<KanbanTask> MoveTaskAsync(Guid taskId, Guid oldColumnId, Guid newColumnId, int newIndex);
        Task EditTaskAsync(Guid taskId, string taskName, string taskDescription, string taskColor, DateTime? dueDate, string priority, string taskAuthor, DateTime createdAt, List<KanbanSubtask> subtasks);
        Task DeleteTaskAsync(Guid taskId);

        Task<KanbanTask> MoveTaskAsync(Guid taskId, Guid targetColumnId, int newIndex);
        Task<List<KanbanColumn>> GetColumnsByBoardIdAsync(Guid boardId);

    }
}
