using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackingSheet.Migrations
{
    /// <inheritdoc />
    public partial class IncidentUpdateColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IncidentUpdates",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IncidentID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateReporter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdateSolution = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Run = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentUpdates", x => x.ID);
                    table.ForeignKey(
                        name: "FK_IncidentUpdates_IncidentList_IncidentID",
                        column: x => x.IncidentID,
                        principalTable: "IncidentList",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IncidentUpdates_IncidentID",
                table: "IncidentUpdates",
                column: "IncidentID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IncidentUpdates");
        }
    }
}
