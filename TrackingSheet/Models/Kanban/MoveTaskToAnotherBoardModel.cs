using System;
using System.ComponentModel.DataAnnotations;

namespace TrackingSheet.Models.Kanban
{
    public class MoveTaskToAnotherBoardModel
    {
        [Required]
        public Guid TaskId { get; set; }

        [Required]
        public Guid TargetBoardId { get; set; }

        [Required]
        public Guid TargetColumnId { get; set; }

        // Позиция в новой колонке (начиная с 0)
        public int NewIndex { get; set; }

        // Добавил свойство OldColumnId
        [Required]
        public Guid OldColumnId { get; set; }
    }
}
