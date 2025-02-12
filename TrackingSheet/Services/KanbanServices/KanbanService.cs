using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TrackingSheet.Data;
using TrackingSheet.Models.Kanban;

namespace TrackingSheet.Services
{
    public class KanbanService : IKanbanService
    {
        private readonly MVCDbContext _context;

        public KanbanService(MVCDbContext context)
        {
            _context = context;
        }

        #region Методы для работы с досками

        public async Task<List<KanbanBoard>> GetAllBoardsAsync()
        {
            return await _context.KanbanBoards
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Tasks)
                        .ThenInclude(t => t.Subtasks)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Tasks)
                        .ThenInclude(t => t.Comments)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Tasks)
                        .ThenInclude(t => t.Files) 
                .OrderBy(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<KanbanBoard> GetBoardByIdAsync(Guid id)
        {
            return await _context.KanbanBoards
                .Include(b => b.Columns.OrderBy(c => c.Order)) 
                    .ThenInclude(c => c.Tasks)
                        .ThenInclude(t => t.Subtasks)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Tasks)
                        .ThenInclude(t => t.Comments)
                .Include(b => b.Columns)
                    .ThenInclude(c => c.Tasks)
                        .ThenInclude(t => t.Files) 
                .FirstOrDefaultAsync(b => b.Id == id);
        }


        public async Task<KanbanBoard> CreateBoardAsync(KanbanBoard board)
        {
            _context.KanbanBoards.Add(board);
            await _context.SaveChangesAsync();
            return board;
        }

        public async Task UpdateBoardAsync(KanbanBoard board)
        {
            _context.KanbanBoards.Update(board);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteBoardAsync(Guid id)
        {
            var board = await _context.KanbanBoards.FindAsync(id);
            if (board != null)
            {
                _context.KanbanBoards.Remove(board);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<KanbanBoard> GetBoardByColumnIdAsync(Guid columnId)
        {
            var column = await _context.KanbanColumns
                .Include(c => c.KanbanBoard)
                .ThenInclude(b => b.Columns.OrderBy(c => c.Order)) 
                .FirstOrDefaultAsync(c => c.Id == columnId);

            return column?.KanbanBoard;
        }

        #endregion

        #region Методы для работы с колонками

        public async Task<KanbanColumn> GetColumnByIdAsync(Guid id)
        {
            return await _context.KanbanColumns
                .Include(c => c.Tasks)
                    .ThenInclude(t => t.Subtasks)
                .Include(c => c.Tasks)
                    .ThenInclude(t => t.Comments)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task AddColumnToBoardAsync(Guid boardId, KanbanColumn column)
        {
            var board = await _context.KanbanBoards
                .Include(b => b.Columns)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board != null)
            {
                var maxOrder = board.Columns.Any() ? board.Columns.Max(c => c.Order) : 0;
                column.Order = maxOrder + 1;

                board.Columns.Add(column);
                await _context.SaveChangesAsync();
            }
        }

        public async Task AddColumnAsync(KanbanColumn column)
        {
            // Определяем максимальный Order среди существующих колонок для данной доски
            var maxOrder = await _context.KanbanColumns
                .Where(c => c.KanbanBoardId == column.KanbanBoardId)
                .Select(c => (int?)c.Order)
                .MaxAsync() ?? 0;

            column.Order = maxOrder + 1;

            // Добавляем колонку непосредственно в контекст
            _context.KanbanColumns.Add(column);
            await _context.SaveChangesAsync();
        }


        public async Task UpdateColumnAsync(KanbanColumn column)
        {
            // Проверка, отслеживается ли колонка контекстом
            var existingColumn = await _context.KanbanColumns.FindAsync(column.Id);
            if (existingColumn != null)
            {
                // Обновляем свойства колонки
                existingColumn.Column = column.Column;
                existingColumn.Order = column.Order;
                existingColumn.ColumnColor = column.ColumnColor;

                // Сохранение изменений
                await _context.SaveChangesAsync();
            }
            else
            {
                throw new Exception("Колонка не найдена.");
            }
        }


        public async Task DeleteColumnAsync(Guid id)
        {
            var column = await _context.KanbanColumns.FindAsync(id);
            if (column != null)
            {
                _context.KanbanColumns.Remove(column);
                await _context.SaveChangesAsync();
            }
        }

        public async Task RenameColumnAsync(Guid columnId, string newName)
        {
            var column = await _context.KanbanColumns.FindAsync(columnId);
            if (column != null)
            {
                column.Column = newName;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateColumnOrderAsync(List<ColumnOrderUpdateModel> updatedOrder)
        {
            foreach (var columnUpdate in updatedOrder)
            {
                var column = await _context.KanbanColumns.FindAsync(columnUpdate.Id);
                if (column != null)
                {
                    column.Order = columnUpdate.Order;
                }
            }

            await _context.SaveChangesAsync();
        }

        #endregion

        #region Методы для работы с задачами

        public async Task<KanbanTask> GetTaskByIdAsync(Guid id)
        {
            return await _context.KanbanTasks
                .Include(t => t.Subtasks)
                .Include(t => t.Comments)
                .Include(t => t.TaskMembers)
                    .ThenInclude(tm => tm.KanbanMember)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task AddTaskToColumnAsync(Guid columnId, KanbanTask task)
        {
            // Определяем максимальный Order среди задач в колонке
            var maxOrder = await _context.KanbanTasks
                .Where(t => t.KanbanColumnId == columnId)
                .Select(t => (int?)t.Order)
                .MaxAsync() ?? 0;

            task.Order = maxOrder + 1;
            task.KanbanColumnId = columnId;

            // Добавляем задачу непосредственно в контекст
            _context.KanbanTasks.Add(task);
            await _context.SaveChangesAsync();
        }


        public async Task UpdateTaskAsync(KanbanTask updatedTask, byte[] originalRowVersion)
        {
            var existingTask = await _context.KanbanTasks
                .Include(t => t.Subtasks)
                .FirstOrDefaultAsync(t => t.Id == updatedTask.Id);

            if (existingTask == null)
            {
                throw new Exception("Task not found.");
            }

            // Проверка RowVersion
            if (!existingTask.RowVersion.SequenceEqual(originalRowVersion))
            {
                throw new DbUpdateConcurrencyException();
            }

            // Обновляем основные поля задачи
            existingTask.TaskName = updatedTask.TaskName;
            existingTask.TaskDescription = updatedTask.TaskDescription;
            existingTask.TaskColor = updatedTask.TaskColor;
            existingTask.DueDate = updatedTask.DueDate;
            existingTask.Priority = updatedTask.Priority;

            // Обновляем подзадачи
            UpdateSubtasks(existingTask, updatedTask.Subtasks);

            await _context.SaveChangesAsync();
        }



        public async Task EditTaskAsync(Guid taskId, string taskName, string taskDescription, string taskColor, DateTime? dueDate, string priority, string taskAuthor, DateTime createdAt, List<KanbanSubtask> subtasks)
        {
            var task = await _context.KanbanTasks
                .Include(t => t.Subtasks)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task != null)
            {
                task.TaskName = taskName;
                task.TaskDescription = taskDescription;
                task.TaskColor = taskColor;
                task.DueDate = dueDate;
                task.Priority = priority;
                task.TaskAuthor = taskAuthor;
                task.CreatedAt = createdAt;

                // Обновление подзадач
                UpdateSubtasks(task, subtasks);

                await _context.SaveChangesAsync();
            }
            else
            {
                throw new Exception("Задача не найдена.");
            }
        }


        private void UpdateSubtasks(KanbanTask task, List<KanbanSubtask> updatedSubtasks)
        {
            // Удаление подзадач, которые были удалены
            var existingSubtaskIds = task.Subtasks.Select(s => s.Id).ToList();
            var updatedSubtaskIds = updatedSubtasks.Select(s => s.Id).ToList();

            var subtasksToRemove = task.Subtasks.Where(s => !updatedSubtaskIds.Contains(s.Id)).ToList();
            foreach (var subtask in subtasksToRemove)
            {
                _context.KanbanSubtasks.Remove(subtask);
            }

            // Обновление существующих и добавление новых подзадач
            foreach (var updatedSubtask in updatedSubtasks)
            {
                var existingSubtask = task.Subtasks.FirstOrDefault(s => s.Id == updatedSubtask.Id);
                if (existingSubtask != null)
                {
                    // Обновление существующей подзадачи
                    existingSubtask.SubtaskDescription = updatedSubtask.SubtaskDescription;
                    existingSubtask.IsCompleted = updatedSubtask.IsCompleted;
                }
                else
                {
                    // Добавление новой подзадачи
                    task.Subtasks.Add(new KanbanSubtask
                    {
                        Id = Guid.NewGuid(),
                        SubtaskDescription = updatedSubtask.SubtaskDescription,
                        IsCompleted = updatedSubtask.IsCompleted,
                        KanbanTaskId = task.Id
                    });
                }
            }
        }


        public async Task DeleteTaskAsync(Guid taskId)
        {
            var task = await _context.KanbanTasks.FindAsync(taskId);
            if (task != null)
            {
                _context.KanbanTasks.Remove(task);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<KanbanTask> MoveTaskAsync(Guid taskId, Guid targetColumnId, int newIndex)
        {
            var task = await _context.KanbanTasks.FindAsync(taskId);
            if (task == null)
            {
                return null;
            }

            var targetColumn = await _context.KanbanColumns.FindAsync(targetColumnId);
            if (targetColumn == null)
            {
                return null;
            }

            var oldColumnId = task.KanbanColumnId;

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Обновляем колонку задачи
                    task.KanbanColumnId = targetColumnId;

                    // Обновляем порядок задач в старой колонке
                    var oldColumnTasks = await _context.KanbanTasks
                        .Where(t => t.KanbanColumnId == oldColumnId && t.Id != taskId)
                        .OrderBy(t => t.Order)
                        .ToListAsync();

                    for (int i = 0; i < oldColumnTasks.Count; i++)
                    {
                        oldColumnTasks[i].Order = i;
                    }

                    // Обновляем порядок задач в новой колонке
                    var newColumnTasks = await _context.KanbanTasks
                        .Where(t => t.KanbanColumnId == targetColumnId)
                        .OrderBy(t => t.Order)
                        .ToListAsync();

                    newColumnTasks.Insert(newIndex, task);

                    for (int i = 0; i < newColumnTasks.Count; i++)
                    {
                        newColumnTasks[i].Order = i;
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Загружаем обновлённые данные задачи
                    var updatedTask = await _context.KanbanTasks
                        .Include(t => t.Subtasks)
                        .Include(t => t.Comments)
                        .FirstOrDefaultAsync(t => t.Id == taskId);

                    return updatedTask;
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<KanbanTask> MoveTaskAsync(Guid taskId, Guid oldColumnId, Guid newColumnId, int newIndex)
        {
            var task = await _context.KanbanTasks.FindAsync(taskId);

            if (task != null)
            {
                // Если задача изменена
                if (task.KanbanColumnId != newColumnId)
                {
                    var oldColumnTasks = await _context.KanbanTasks
                        .Where(t => t.KanbanColumnId == oldColumnId)
                        .OrderBy(t => t.Order)
                        .ToListAsync();

                    oldColumnTasks.Remove(task);
                    for (int i = 0; i < oldColumnTasks.Count; i++)
                    {
                        oldColumnTasks[i].Order = i;
                    }

                    task.KanbanColumnId = newColumnId;
                }

                var newColumnTasks = await _context.KanbanTasks
                    .Where(t => t.KanbanColumnId == newColumnId)
                    .OrderBy(t => t.Order)
                    .ToListAsync();

                newColumnTasks.Insert(newIndex, task);

                for (int i = 0; i < newColumnTasks.Count; i++)
                {
                    newColumnTasks[i].Order = i;
                }

                await _context.SaveChangesAsync();
            }

            return task; 
        }


        public async Task<Guid> GetBoardIdByColumnIdAsync(Guid columnId)
        {
            var column = await _context.KanbanColumns
                .FirstOrDefaultAsync(c => c.Id == columnId);

            return column?.KanbanBoardId ?? Guid.Empty;
        }

        #endregion

        // Модель для обновления порядка колонок
        public class ColumnOrderUpdateModel
        {
            public Guid Id { get; set; }
            public int Order { get; set; }
        }

        //Методы для работы с комментариями
        public async Task AddCommentAsync(KanbanComment comment)
        {
            _context.KanbanComments.Add(comment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteCommentAsync(KanbanComment comment)
        {
            _context.KanbanComments.Remove(comment);
            await _context.SaveChangesAsync();
        }

        public async Task<KanbanComment> GetCommentByIdAsync(Guid commentId)
        {
            return await _context.KanbanComments
                .FirstOrDefaultAsync(c => c.Id == commentId);
        }

        public async Task<List<KanbanColumn>> GetColumnsByBoardIdAsync(Guid boardId)
        {
            return await _context.KanbanColumns
                                 .Where(c => c.KanbanBoardId == boardId)
                                 .OrderBy(c => c.Order) 
                                 .ToListAsync();
        }
    }
}
