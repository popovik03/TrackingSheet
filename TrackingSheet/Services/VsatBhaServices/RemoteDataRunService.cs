using System.Collections.Generic;
using System.Data.SqlClient;
using System;
using System.Threading.Tasks;
using TrackingSheet.Models.VSATdata;
using Microsoft.Extensions.Configuration;
using NuGet.Packaging.Signing;

namespace TrackingSheet.Services.VsatBhaServices
{
    public class RemoteDataRunService
    {
        // Подключение к базе данных 
        private string _connectionString;

        public void SetConnectionString(string connectionString)
        {
            _connectionString = connectionString;
        }

        // Получение всей информации о рейсах из таблицы MWD_RUN с компонентами
        public async Task<List<VsatInfoRun>> GetAllRunsVsatInfoAsync()
        {
            if (string.IsNullOrEmpty(_connectionString))
            {
                throw new InvalidOperationException("Connection string is not set.");
            }

            List<VsatInfoRun> vsatRunsList = new List<VsatInfoRun>();
            var runsDict = new Dictionary<string, VsatInfoRun>();
            var componentRealNames = new ComponentRealNames().componentRunID;


            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync(); // Открытие подключения

                // SQL-запрос с LEFT JOIN для получения всех данных
                string query = @"
                    SELECT 
                        r.MWRU_IDENTIFIER,
                        r.MWRU_NUMBER,
                        r.MWRU_DATETIME_START,
                        r.MWRU_DATETIME_END,
                        r.MWRU_HOLE_DIAMETER,
                        r.MWRU_FSE_1,
                        r.MWRU_FSE_2,
                        rtc.MWCO_IDENTIFIER,
                        rtc.MWRC_POSITION,
                        rtc.MWRC_OFFSET_FROM_BIT,
                        c.MWCO_SN,
                        c.MWCT_IDENTIFIER,
                        c.TOCO_IDENTIFIER
                    FROM 
                        MWD_RUN r
                    LEFT JOIN 
                        MWD_RUN_TO_COMPONENT rtc ON r.MWRU_IDENTIFIER = rtc.MWRU_IDENTIFIER
                    LEFT JOIN 
                        MWD_COMPONENT c ON rtc.MWCO_IDENTIFIER = c.MWCO_IDENTIFIER
                    ORDER BY 
                        r.MWRU_NUMBER ASC";

                using (var command = new SqlCommand(query, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            string mwruIdentifier = reader["MWRU_IDENTIFIER"].ToString();

                            // Проверяем, существует ли уже рейс в словаре
                            if (!runsDict.ContainsKey(mwruIdentifier))
                            {
                                VsatInfoRun vsatInfoRun = new VsatInfoRun
                                {
                                    MwruIdentifier = mwruIdentifier,
                                    MwruNumber = reader.GetInt32(reader.GetOrdinal("MWRU_NUMBER")),
                                    MwruDatetimeStart = reader.GetDateTime(reader.GetOrdinal("MWRU_DATETIME_START")),
                                    MwruDatetimeEnd = reader.GetDateTime(reader.GetOrdinal("MWRU_DATETIME_END")),
                                    MwruHoleDiameter = Convert.ToSingle(reader["MWRU_HOLE_DIAMETER"]) * 1000,

                                    MwruFse1 = reader["MWRU_FSE_1"] != DBNull.Value ? reader["MWRU_FSE_1"].ToString() : null,
                                    MwruFse2 = reader["MWRU_FSE_2"] != DBNull.Value ? reader["MWRU_FSE_2"].ToString() : null,
                                };

                                vsatRunsList.Add(vsatInfoRun);
                                runsDict[mwruIdentifier] = vsatInfoRun;
                            }

                            // Добавляем компонент, если он существует
                            if (reader["MWCO_IDENTIFIER"] != DBNull.Value)
                            {
                                VsatComponent component = new VsatComponent
                                {
                                    MwcoIdentifier = reader["MWCO_IDENTIFIER"].ToString(),
                                    MwrcPosition = reader["MWRC_POSITION"] != DBNull.Value ? Convert.ToInt32(reader["MWRC_POSITION"]) : 0,
                                    MwrcOffsetFromBit = Convert.ToSingle(reader["MWRC_OFFSET_FROM_BIT"]),
                                    MwcoSn = reader["MWCO_SN"] != DBNull.Value ? reader["MWCO_SN"].ToString() : null,
                                    MwctIdentifier = reader["MWCT_IDENTIFIER"] != DBNull.Value ? reader["MWCT_IDENTIFIER"].ToString() : null,
                                    TocoIdentifier = reader["TOCO_IDENTIFIER"] != DBNull.Value ? reader["TOCO_IDENTIFIER"].ToString() : null
                                };


                                // Присваивание реального имени элемента КНБК 
                                if (!string.IsNullOrEmpty(component.MwctIdentifier) && int.TryParse(component.MwctIdentifier, out int mwctID))
                                {
                                    // Поиск по MWCT_IDENTIFIER
                                    if (componentRealNames.TryGetValue(mwctID, out string realName))
                                    {
                                        component.MwcoRealName = realName;
                                    }
                                    else if (!string.IsNullOrEmpty(component.TocoIdentifier) && int.TryParse(component.TocoIdentifier, out int tocoID))
                                    {
                                        // Если MWCT_IDENTIFIER не найдено, проверяем TOCO_IDENTIFIER
                                        if (componentRealNames.TryGetValue(tocoID, out string realName2))
                                        {
                                            component.MwcoRealName = realName2;
                                        }
                                        else
                                        {
                                            // Если и TOCO_IDENTIFIER не найдено
                                            component.MwcoRealName = "Н/Д";
                                        }
                                    }
                                    else
                                    {
                                        // Если TOCO_IDENTIFIER пустой или не удалось преобразовать в число
                                        component.MwcoRealName = "Н/Д";
                                    }
                                }
                                else if (!string.IsNullOrEmpty(component.TocoIdentifier) && int.TryParse(component.TocoIdentifier, out int tocoID))
                                {
                                    // Если MWCT_IDENTIFIER отсутствует, сразу проверяем TOCO_IDENTIFIER
                                    if (componentRealNames.TryGetValue(tocoID, out string realName))
                                    {
                                        component.MwcoRealName = realName;
                                    }
                                    else
                                    {
                                        // Если TOCO_IDENTIFIER не найдено
                                        component.MwcoRealName = "Н/Д";
                                    }
                                }
                                else
                                {
                                    // Если оба поля MWCT_IDENTIFIER и TOCO_IDENTIFIER не заполнены
                                    component.MwcoRealName = "Н/Д";
                                }



                                runsDict[mwruIdentifier].Components.Add(component); //Добавляем все компоненты КНБК в словарь
                            }
                        }
                    }
                }

                //Получение данных по скважине 

                string queryWELL_NAME = "SELECT TOP 1 WELL_NAME FROM WELL_TAB ORDER BY WELL_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryWELL_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            string wellNAme = reader["WELL_NAME"].ToString();
                            foreach (var run in vsatRunsList)
                            {
                                run.WellName = wellNAme;
                            }
                        }
                    }
                }

                string queryOOIN_NAME = "SELECT TOP 1 OOIN_NAME FROM OBJECT_OF_INTEREST_TAB ORDER BY OOIN_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryOOIN_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            string ooinName = reader["OOIN_NAME"].ToString();
                            foreach (var run in vsatRunsList)
                            {
                                run.OoinName = ooinName;
                            }
                        }
                    }
                }

                string queryFCTY_NAME = "SELECT TOP 1 FCTY_NAME FROM FACILITY_TAB ORDER BY FCTY_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryFCTY_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            string fctyName = reader["FCTY_NAME"].ToString();
                            foreach (var run in vsatRunsList)
                            {
                                run.FctyName = fctyName;
                            }
                        }
                    }
                }

                string queryCPNM_IDENTIFIER = "SELECT TOP 1 CPNM_IDENTIFIER FROM FACILITY_TAB ORDER BY FCTY_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryCPNM_IDENTIFIER, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            string cpnmID = reader["CPNM_IDENTIFIER"].ToString();
                            foreach (var run in vsatRunsList)
                            {
                                run.CpnmIdentifier = cpnmID;
                            }
                        }
                    }
                }

                string queryCPNM_NAME = "SELECT TOP 1 CPNM_NAME FROM COMPANY_NAME ORDER BY CPNM_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryCPNM_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            string cpnmNAME = reader["CPNM_NAME"].ToString();
                            foreach (var run in vsatRunsList)
                            {
                                run.CpnmName = cpnmNAME;
                            }
                        }
                    }
                }


                //Сортировка по позиции в КНБК

                foreach (var run in vsatRunsList)
                {
                    run.Components = run.Components.OrderBy(c => c.MwrcPosition).ToList();
                }
                 
            }

            return vsatRunsList; // Возвращаем список всех рейсов с компонентами
        }
    }
}
