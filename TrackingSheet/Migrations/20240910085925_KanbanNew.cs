using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackingSheet.Migrations
{
    /// <inheritdoc />
    public partial class KanbanNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KanbanBoards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Board = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsProtected = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanBoards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KanbanMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanMembers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KanbanColumns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KanbanBoardId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Column = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColumnColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanColumns_KanbanBoards_KanbanBoardId",
                        column: x => x.KanbanBoardId,
                        principalTable: "KanbanBoards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KanbanColumnId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskAuthor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaskName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaskDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TaskColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Order = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TaskType = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanTasks_KanbanColumns_KanbanColumnId",
                        column: x => x.KanbanColumnId,
                        principalTable: "KanbanColumns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanComments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KanbanTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CommentAuthor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CommentText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanComments_KanbanTasks_KanbanTaskId",
                        column: x => x.KanbanTaskId,
                        principalTable: "KanbanTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanSubtasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KanbanTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubtaskDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanSubtasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanSubtasks_KanbanTasks_KanbanTaskId",
                        column: x => x.KanbanTaskId,
                        principalTable: "KanbanTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KanbanTaskMembers",
                columns: table => new
                {
                    KanbanTaskId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KanbanMemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanTaskMembers", x => new { x.KanbanTaskId, x.KanbanMemberId });
                    table.ForeignKey(
                        name: "FK_KanbanTaskMembers_KanbanMembers_KanbanMemberId",
                        column: x => x.KanbanMemberId,
                        principalTable: "KanbanMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KanbanTaskMembers_KanbanTasks_KanbanTaskId",
                        column: x => x.KanbanTaskId,
                        principalTable: "KanbanTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "KanbanBoards",
                columns: new[] { "Id", "Board", "CreatedAt", "IsProtected" },
                values: new object[] { new Guid("12711015-7a9c-4563-910c-60eccae8696a"), "Главная", new DateTime(2024, 9, 10, 8, 59, 23, 237, DateTimeKind.Utc).AddTicks(4159), true });

            migrationBuilder.CreateIndex(
                name: "IX_KanbanColumns_KanbanBoardId",
                table: "KanbanColumns",
                column: "KanbanBoardId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanComments_KanbanTaskId",
                table: "KanbanComments",
                column: "KanbanTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanSubtasks_KanbanTaskId",
                table: "KanbanSubtasks",
                column: "KanbanTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTaskMembers_KanbanMemberId",
                table: "KanbanTaskMembers",
                column: "KanbanMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_KanbanColumnId",
                table: "KanbanTasks",
                column: "KanbanColumnId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KanbanComments");

            migrationBuilder.DropTable(
                name: "KanbanSubtasks");

            migrationBuilder.DropTable(
                name: "KanbanTaskMembers");

            migrationBuilder.DropTable(
                name: "KanbanMembers");

            migrationBuilder.DropTable(
                name: "KanbanTasks");

            migrationBuilder.DropTable(
                name: "KanbanColumns");

            migrationBuilder.DropTable(
                name: "KanbanBoards");
        }
    }
}
