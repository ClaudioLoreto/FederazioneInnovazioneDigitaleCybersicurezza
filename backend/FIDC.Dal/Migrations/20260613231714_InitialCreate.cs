using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FIDC.Dal.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Utenti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Cognome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Ruolo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EmailConfermata = table.Column<bool>(type: "boolean", nullable: false),
                    TokenConfermaEmail = table.Column<string>(type: "text", nullable: true),
                    ScadenzaTokenConferma = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utenti", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Eventi",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titolo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Sottotitolo = table.Column<string>(type: "text", nullable: true),
                    Descrizione = table.Column<string>(type: "text", nullable: false),
                    Pilastro = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DataInizio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataFine = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Luogo = table.Column<string>(type: "text", nullable: false),
                    PostiTotali = table.Column<int>(type: "integer", nullable: false),
                    Pubblicato = table.Column<bool>(type: "boolean", nullable: false),
                    RelatoreId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Eventi", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Eventi_Utenti_RelatoreId",
                        column: x => x.RelatoreId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "News",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titolo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Sommario = table.Column<string>(type: "text", nullable: false),
                    Contenuto = table.Column<string>(type: "text", nullable: false),
                    Slug = table.Column<string>(type: "character varying(220)", maxLength: 220, nullable: false),
                    Pilastro = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ImmagineCopertina = table.Column<string>(type: "text", nullable: true),
                    Pubblicato = table.Column<bool>(type: "boolean", nullable: false),
                    DataPubblicazione = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AutoreId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_News", x => x.Id);
                    table.ForeignKey(
                        name: "FK_News_Utenti_AutoreId",
                        column: x => x.AutoreId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Iscrizioni",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventoId = table.Column<int>(type: "integer", nullable: false),
                    UtenteId = table.Column<int>(type: "integer", nullable: false),
                    EmailConfermaInviata = table.Column<bool>(type: "boolean", nullable: false),
                    Presente = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Iscrizioni", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Iscrizioni_Eventi_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventi",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Iscrizioni_Utenti_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Eventi_RelatoreId",
                table: "Eventi",
                column: "RelatoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Iscrizioni_EventoId_UtenteId",
                table: "Iscrizioni",
                columns: new[] { "EventoId", "UtenteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Iscrizioni_UtenteId",
                table: "Iscrizioni",
                column: "UtenteId");

            migrationBuilder.CreateIndex(
                name: "IX_News_AutoreId",
                table: "News",
                column: "AutoreId");

            migrationBuilder.CreateIndex(
                name: "IX_News_Slug",
                table: "News",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Utenti_Email",
                table: "Utenti",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Iscrizioni");

            migrationBuilder.DropTable(
                name: "News");

            migrationBuilder.DropTable(
                name: "Eventi");

            migrationBuilder.DropTable(
                name: "Utenti");
        }
    }
}
