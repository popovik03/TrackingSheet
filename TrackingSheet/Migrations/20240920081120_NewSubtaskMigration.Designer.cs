﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using TrackingSheet.Data;

#nullable disable

namespace TrackingSheet.Migrations
{
    [DbContext(typeof(MVCDbContext))]
    [Migration("20240920081120_NewSubtaskMigration")]
    partial class NewSubtaskMigration
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.6")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("TrackingSheet.Models.Domain.IncidentUpdate", b =>
                {
                    b.Property<Guid>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime>("Date")
                        .HasColumnType("datetime2");

                    b.Property<Guid>("IncidentID")
                        .HasColumnType("uniqueidentifier");

                    b.Property<int>("Run")
                        .HasColumnType("int");

                    b.Property<string>("UpdateReporter")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("UpdateSolution")
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("ID");

                    b.HasIndex("IncidentID");

                    b.ToTable("IncidentUpdates");
                });

            modelBuilder.Entity("TrackingSheet.Models.Domain.Incidents", b =>
                {
                    b.Property<Guid>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime>("Date")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("DateEnd")
                        .HasColumnType("datetime2");

                    b.Property<int>("File")
                        .HasColumnType("int");

                    b.Property<string>("HighLight")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ProblemType")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Reporter")
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("Run")
                        .HasColumnType("int");

                    b.Property<long>("SavedNPT")
                        .HasColumnType("bigint");

                    b.Property<string>("Shift")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Solution")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Status")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Update")
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("VSAT")
                        .HasColumnType("int");

                    b.Property<string>("Well")
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("ID");

                    b.ToTable("IncidentList");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanBoard", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Board")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<bool>("IsProtected")
                        .HasColumnType("bit");

                    b.HasKey("Id");

                    b.ToTable("KanbanBoards");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanColumn", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Column")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ColumnColor")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<Guid>("KanbanBoardId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<int>("Order")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("KanbanBoardId");

                    b.ToTable("KanbanColumns");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanComment", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("CommentAuthor")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("CommentText")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<Guid>("KanbanTaskId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<byte[]>("RowVersion")
                        .IsConcurrencyToken()
                        .IsRequired()
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("rowversion");

                    b.HasKey("Id");

                    b.HasIndex("KanbanTaskId");

                    b.ToTable("KanbanComments");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanMember", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<byte[]>("RowVersion")
                        .IsConcurrencyToken()
                        .IsRequired()
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("rowversion");

                    b.HasKey("Id");

                    b.ToTable("KanbanMembers");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanSubtask", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<bool>("IsCompleted")
                        .HasColumnType("bit");

                    b.Property<Guid>("KanbanTaskId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<byte[]>("RowVersion")
                        .IsConcurrencyToken()
                        .IsRequired()
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("rowversion");

                    b.Property<string>("SubtaskDescription")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.HasIndex("KanbanTaskId");

                    b.ToTable("KanbanSubtasks");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanTask", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("DueDate")
                        .HasColumnType("datetime2");

                    b.Property<Guid>("KanbanColumnId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("KanbanMemberId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<int>("Order")
                        .HasColumnType("int");

                    b.Property<string>("Priority")
                        .HasColumnType("nvarchar(max)");

                    b.Property<byte[]>("RowVersion")
                        .IsConcurrencyToken()
                        .IsRequired()
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("rowversion");

                    b.Property<string>("Status")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskAuthor")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskColor")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskDescription")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskName")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("TaskType")
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.HasIndex("KanbanColumnId");

                    b.HasIndex("KanbanMemberId");

                    b.ToTable("KanbanTasks");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanTaskMember", b =>
                {
                    b.Property<Guid>("KanbanTaskId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("KanbanMemberId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<byte[]>("RowVersion")
                        .IsConcurrencyToken()
                        .IsRequired()
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("rowversion");

                    b.HasKey("KanbanTaskId", "KanbanMemberId");

                    b.HasIndex("KanbanMemberId");

                    b.ToTable("KanbanTaskMembers");
                });

            modelBuilder.Entity("TrackingSheet.Models.RO_Planer.EmployeePlaner2024", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("April")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("August")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("December")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("EmployeeId")
                        .HasColumnType("int");

                    b.Property<string>("February")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("January")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("July")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("June")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("March")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("May")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("November")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("October")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("September")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("Year")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("EmployeeId");

                    b.ToTable("EmployeePlaner2024");
                });

            modelBuilder.Entity("TrackingSheet.Models.RO_Planer.ROemployees", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("Stol")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.ToTable("ROemployees");
                });

            modelBuilder.Entity("TrackingSheet.Models.Domain.IncidentUpdate", b =>
                {
                    b.HasOne("TrackingSheet.Models.Domain.Incidents", "Incident")
                        .WithMany("Updates")
                        .HasForeignKey("IncidentID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Incident");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanColumn", b =>
                {
                    b.HasOne("TrackingSheet.Models.Kanban.KanbanBoard", "KanbanBoard")
                        .WithMany("Columns")
                        .HasForeignKey("KanbanBoardId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("KanbanBoard");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanComment", b =>
                {
                    b.HasOne("TrackingSheet.Models.Kanban.KanbanTask", "KanbanTask")
                        .WithMany("Comments")
                        .HasForeignKey("KanbanTaskId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("KanbanTask");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanSubtask", b =>
                {
                    b.HasOne("TrackingSheet.Models.Kanban.KanbanTask", "KanbanTask")
                        .WithMany("Subtasks")
                        .HasForeignKey("KanbanTaskId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("KanbanTask");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanTask", b =>
                {
                    b.HasOne("TrackingSheet.Models.Kanban.KanbanColumn", null)
                        .WithMany("Tasks")
                        .HasForeignKey("KanbanColumnId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("TrackingSheet.Models.Kanban.KanbanMember", null)
                        .WithMany("Tasks")
                        .HasForeignKey("KanbanMemberId");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanTaskMember", b =>
                {
                    b.HasOne("TrackingSheet.Models.Kanban.KanbanMember", "KanbanMember")
                        .WithMany("TaskMembers")
                        .HasForeignKey("KanbanMemberId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("TrackingSheet.Models.Kanban.KanbanTask", "KanbanTask")
                        .WithMany("TaskMembers")
                        .HasForeignKey("KanbanTaskId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("KanbanMember");

                    b.Navigation("KanbanTask");
                });

            modelBuilder.Entity("TrackingSheet.Models.RO_Planer.EmployeePlaner2024", b =>
                {
                    b.HasOne("TrackingSheet.Models.RO_Planer.ROemployees", "ROemployees")
                        .WithMany("PlanerEntries")
                        .HasForeignKey("EmployeeId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("ROemployees");
                });

            modelBuilder.Entity("TrackingSheet.Models.Domain.Incidents", b =>
                {
                    b.Navigation("Updates");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanBoard", b =>
                {
                    b.Navigation("Columns");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanColumn", b =>
                {
                    b.Navigation("Tasks");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanMember", b =>
                {
                    b.Navigation("TaskMembers");

                    b.Navigation("Tasks");
                });

            modelBuilder.Entity("TrackingSheet.Models.Kanban.KanbanTask", b =>
                {
                    b.Navigation("Comments");

                    b.Navigation("Subtasks");

                    b.Navigation("TaskMembers");
                });

            modelBuilder.Entity("TrackingSheet.Models.RO_Planer.ROemployees", b =>
                {
                    b.Navigation("PlanerEntries");
                });
#pragma warning restore 612, 618
        }
    }
}
