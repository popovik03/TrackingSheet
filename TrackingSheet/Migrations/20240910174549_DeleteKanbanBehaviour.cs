using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackingSheet.Migrations
{
    /// <inheritdoc />
    public partial class DeleteKanbanBehaviour : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KanbanColumns_KanbanBoards_KanbanBoardId",
                table: "KanbanColumns");

            migrationBuilder.DeleteData(
                table: "KanbanBoards",
                keyColumn: "Id",
                keyValue: new Guid("2b2c642c-0ec6-4962-99ea-27097ea6c6fe"));

            migrationBuilder.InsertData(
                table: "KanbanBoards",
                columns: new[] { "Id", "Board", "CreatedAt", "IsProtected" },
                values: new object[] { new Guid("48d1fed4-21a2-4ec8-8ff0-6f33308da710"), "Главная", new DateTime(2024, 9, 10, 17, 45, 46, 522, DateTimeKind.Utc).AddTicks(2124), true });

            migrationBuilder.AddForeignKey(
                name: "FK_KanbanColumns_KanbanBoards_KanbanBoardId",
                table: "KanbanColumns",
                column: "KanbanBoardId",
                principalTable: "KanbanBoards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KanbanColumns_KanbanBoards_KanbanBoardId",
                table: "KanbanColumns");

            migrationBuilder.DeleteData(
                table: "KanbanBoards",
                keyColumn: "Id",
                keyValue: new Guid("48d1fed4-21a2-4ec8-8ff0-6f33308da710"));

            migrationBuilder.InsertData(
                table: "KanbanBoards",
                columns: new[] { "Id", "Board", "CreatedAt", "IsProtected" },
                values: new object[] { new Guid("2b2c642c-0ec6-4962-99ea-27097ea6c6fe"), "Default Board", new DateTime(2024, 9, 9, 4, 21, 37, 978, DateTimeKind.Utc).AddTicks(3041), true });

            migrationBuilder.AddForeignKey(
                name: "FK_KanbanColumns_KanbanBoards_KanbanBoardId",
                table: "KanbanColumns",
                column: "KanbanBoardId",
                principalTable: "KanbanBoards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
