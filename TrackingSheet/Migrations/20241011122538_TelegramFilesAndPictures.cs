using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackingSheet.Migrations
{
    /// <inheritdoc />
    public partial class TelegramFilesAndPictures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TelegramDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TelegramMessageId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelegramDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelegramDocuments_TelegramMessages_TelegramMessageId",
                        column: x => x.TelegramMessageId,
                        principalTable: "TelegramMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelegramPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TelegramMessageId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelegramPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelegramPhotos_TelegramMessages_TelegramMessageId",
                        column: x => x.TelegramMessageId,
                        principalTable: "TelegramMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TelegramDocuments_TelegramMessageId",
                table: "TelegramDocuments",
                column: "TelegramMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_TelegramPhotos_TelegramMessageId",
                table: "TelegramPhotos",
                column: "TelegramMessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TelegramDocuments");

            migrationBuilder.DropTable(
                name: "TelegramPhotos");
        }
    }
}
