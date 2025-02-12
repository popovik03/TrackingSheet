using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackingSheet.Migrations
{
    /// <inheritdoc />
    public partial class NewSubtaskMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "KanbanMemberId",
                table: "KanbanTasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_KanbanTasks_KanbanMemberId",
                table: "KanbanTasks",
                column: "KanbanMemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_KanbanTasks_KanbanMembers_KanbanMemberId",
                table: "KanbanTasks",
                column: "KanbanMemberId",
                principalTable: "KanbanMembers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KanbanTasks_KanbanMembers_KanbanMemberId",
                table: "KanbanTasks");

            migrationBuilder.DropIndex(
                name: "IX_KanbanTasks_KanbanMemberId",
                table: "KanbanTasks");

            migrationBuilder.DropColumn(
                name: "KanbanMemberId",
                table: "KanbanTasks");
        }
    }
}
