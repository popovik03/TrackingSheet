using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackingSheet.Migrations
{
    /// <inheritdoc />
    public partial class IncidentsWithFilesDateUpdateMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "KanbanBoards",
                keyColumn: "Id",
                keyValue: new Guid("48d1fed4-21a2-4ec8-8ff0-6f33308da710"));

            migrationBuilder.AddColumn<DateTime>(
                name: "DateEnd",
                table: "IncidentList",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "File",
                table: "IncidentList",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Update",
                table: "IncidentList",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateEnd",
                table: "IncidentList");

            migrationBuilder.DropColumn(
                name: "File",
                table: "IncidentList");

            migrationBuilder.DropColumn(
                name: "Update",
                table: "IncidentList");

            migrationBuilder.InsertData(
                table: "KanbanBoards",
                columns: new[] { "Id", "Board", "CreatedAt", "IsProtected" },
                values: new object[] { new Guid("48d1fed4-21a2-4ec8-8ff0-6f33308da710"), "Главная", new DateTime(2024, 9, 10, 17, 45, 46, 522, DateTimeKind.Utc).AddTicks(2124), true });
        }
    }
}
