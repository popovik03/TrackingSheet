namespace TrackingSheet.Models.DTO
{
    public class EditTaskCommentDTO
    {
        public Guid Id { get; set; }
        public string CommentAuthor { get; set; }
        public string CommentText { get; set; }
        public string CreatedAt { get; set; }
        public string AvatarUrl { get; set; }
        public string RowVersion { get; set; }
    }
}
