using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
using TrackingSheet.Models.DTO;


namespace TrackingSheet.Models.Kanban
{
    public class KanbanBoard
    {
        public Guid Id { get; set; }
        public string Board { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsProtected { get; set; } 
        public List<KanbanColumn> Columns { get; set; } = new List<KanbanColumn>();
    }


    public class KanbanColumn
    {
        public Guid Id { get; set; }
        public Guid KanbanBoardId { get; set; }
        public string Column { get; set; } // Название колонки (To-Do, In Progress, Done и т.д.)
        public string ColumnColor { get; set; } // Цвет колонки
        public int Order { get; set; } // Порядок колонки на доске
        public List<KanbanTask> Tasks { get; set; } = new List<KanbanTask>(); // Задачи в колонке
        [JsonIgnore]

        public KanbanBoard KanbanBoard { get; set; }  // Навигационное свойство для связи с доской
    }

    public class KanbanTask
    {
        public Guid Id { get; set; }
        public Guid KanbanColumnId { get; set; }
        public string? TaskAuthor { get; set; } // Создатель задачи
        public string TaskName { get; set; } // Название задачи
        public string? TaskDescription { get; set; } // Описание задачи
        public List<KanbanSubtask> Subtasks { get; set; } = new List<KanbanSubtask>(); // Подзадачи
        public List<KanbanComment> Comments { get; set; } = new List<KanbanComment>(); // Комментарии
        public List<KanbanTaskMember> TaskMembers { get; set; } = new List<KanbanTaskMember>(); // Ответственные
        public ICollection<KanbanFile> Files { get; set; } = new List<KanbanFile>();
        public string TaskColor { get; set; } // Цвет задачи
        public DateTime CreatedAt { get; set; } // Дата создания задачи
        public DateTime? DueDate { get; set; } // Дедлайн задачи
        public string? Status { get; set; } // Статус задачи (Активная, Завершённая и т.д.)
        public int Order { get; set; } // Порядок задачи в колонке
        public string? Priority { get; set; } // Приоритет задачи (Низкий, Средний, Высокий)
        public string? TaskType { get; set; } // Тип задачи (Баг, Фича и т.д.)

        [Timestamp]
        public byte[] RowVersion { get; set; } // Поле для отслеживания версий записи

    }


    public class KanbanSubtask
    {
        public Guid Id { get; set; }
        public Guid KanbanTaskId { get; set; }
        public string SubtaskDescription { get; set; } // Описание подзадачи
        public bool IsCompleted { get; set; } // Статус выполнения подзадачи
        [JsonIgnore]
        public KanbanTask KanbanTask { get; set; } // навигационное свойство для связи с задачей

        [Timestamp]
        public byte[] RowVersion { get; set; } // Поле для отслеживания версий записи
    }

    public class KanbanComment
    {
        public Guid Id { get; set; }
        public Guid KanbanTaskId { get; set; }
        public string CommentAuthor { get; set; } // Автор комментария
        public string CommentText { get; set; } // Текст комментария
        public DateTime CreatedAt { get; set; } // Дата создания комментария

        [JsonIgnore]
        public KanbanTask KanbanTask { get; set; } // навигационное свойство для связи с задачей

        [Timestamp]
        public byte[] RowVersion { get; set; } // Поле для отслеживания версий записи
    }

    public class KanbanMember
    {
        public Guid Id { get; set; }
        public string Name { get; set; } // Имя участника
        public List<KanbanTaskMember> TaskMembers { get; set; } = new List<KanbanTaskMember>(); // Связанные задачи
        [JsonIgnore] // Предотвращает циклические ссылки
        public List<KanbanTask> Tasks { get; set; }

        [Timestamp]
        public byte[] RowVersion { get; set; } // Поле для отслеживания версий записи
    }

    public class KanbanTaskMember
    {
        public Guid KanbanTaskId { get; set; }
        public KanbanTask KanbanTask { get; set; } // Задача

        public Guid KanbanMemberId { get; set; }
        public KanbanMember KanbanMember { get; set; } // Участник

        [Timestamp]
        public byte[] RowVersion { get; set; } // Поле для отслеживания версий записи
    }


    public class DeleteSubtaskModel
    {

        public Guid SubtaskId { get; set; }

        public string RowVersion { get; set; }
    }


    public class ToggleSubtaskCompletionModel
    {
        public Guid SubtaskId { get; set; }

        public string RowVersion { get; set; }
    }

    // Модель для получения данных о перемещении задачи
    public class TaskMoveModel
    {
        public Guid TaskId { get; set; }
        public Guid OldColumnId { get; set; }
        public Guid NewColumnId { get; set; }
        public int NewIndex { get; set; }
    }

    // Модель для редактирования задачи
    public class EditTaskModel
    {
        public Guid TaskId { get; set; }
        public Guid ColumnId { get; set; }
        public string TaskName { get; set; }
        public string? TaskDescription { get; set; }
        public string TaskColor { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Priority { get; set; }
        public string TaskAuthor { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? SubtasksJson { get; set; } // Добавлено поле для получения подзадач в формате JSON

        public string RowVersion { get; set; } // Добавлено для отслеживания версий 

        // Инициализируем пустым списком
        public List<EditTaskCommentDTO> Comments { get; set; } = new List<EditTaskCommentDTO>();
    }

    public class AddCommentModel
    {
        public Guid TaskId { get; set; }
        public string CommentAuthor { get; set; }
        public string CommentText { get; set; }
        public string RowVersion { get; set; }
    }

    public class DeleteCommentModel
    {
        public Guid CommentId { get; set; }
        public string RowVersion { get; set; }
    }

    public class UpdateSubtaskStatusModel
    {
        public Guid SubtaskId { get; set; }
        public bool IsCompleted { get; set; }
        public string RowVersion { get; set; }
        public Guid TaskId { get; set; } // Если требуется
    }

    public class AddSubtaskModel
    {
        public Guid TaskId { get; set; }
        public string SubtaskDescription { get; set; }
    }


    public class KanbanFile
    {
        public Guid Id { get; set; }
        public Guid KanbanTaskId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public DateTime UploadedAt { get; set; }

        public KanbanTask KanbanTask { get; set; }
    }

}
