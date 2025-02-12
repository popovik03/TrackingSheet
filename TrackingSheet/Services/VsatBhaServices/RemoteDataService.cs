using System.Collections.Generic;
using System.Data.SqlClient;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using NuGet.Packaging.Signing;
using TrackingSheet.Models.VSATdata;
using System.Data;
using SciChart.Data.Model;


namespace TrackingSheet.Services.VsatBhaServices
{
    public class RemoteDataService
    {
        //Подключение к базе данных 
        private string _connectionString;

        public void SetConnectionString(string connectionString)
        {
            _connectionString = connectionString;
        }

        //Получение информации из базы данных 
        public async Task<VsatInfo> GetLatestVsatInfoAsync()
        {
            if (string.IsNullOrEmpty(_connectionString))
            {
                throw new InvalidOperationException("Connection string is not set.");
            }
            VsatInfo vsatInfo = new VsatInfo();
            using (var connection = new SqlConnection(_connectionString))

            {
                await connection.OpenAsync(); //открытие базы данных
                //Получение имени скважины
                string queryWELL_NAME = "SELECT TOP 1 WELL_NAME FROM WELL_TAB ORDER BY WELL_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryWELL_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.WELL_NAME = reader["WELL_NAME"].ToString();
                        }
                    }
                }
                //получение названия месторождения 
                string queryOOIN_NAME = "SELECT TOP 1 OOIN_NAME FROM OBJECT_OF_INTEREST_TAB ORDER BY OOIN_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryOOIN_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.OOIN_NAME = reader["OOIN_NAME"].ToString();
                        }
                    }
                }

                //получение номера куста 
                string queryFCTY_NAME = "SELECT TOP 1 FCTY_NAME FROM FACILITY_TAB ORDER BY FCTY_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryFCTY_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.FCTY_NAME = reader["FCTY_NAME"].ToString();
                        }
                    }
                }

                //получение ID заказчика 
                string queryCPNM_IDENTIFIER = "SELECT TOP 1 CPNM_IDENTIFIER FROM FACILITY_TAB ORDER BY FCTY_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryCPNM_IDENTIFIER, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.CPNM_IDENTIFIER = reader["CPNM_IDENTIFIER"].ToString();
                        }
                    }
                }

                //получение наименование заказчика
                string queryCPNM_NAME = "SELECT TOP 1 CPNM_NAME FROM COMPANY_NAME ORDER BY CPNM_UPDATE_DATE DESC";
                using (var command = new SqlCommand(queryCPNM_NAME, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.CPNM_NAME = reader["CPNM_NAME"].ToString();
                        }
                    }
                }
                //получение номера последнего рейса
                string queryMWRU_NUMBER = "SELECT TOP 1 MWRU_NUMBER FROM MWD_RUN ORDER BY ROWTIMESTAMP DESC";
                using (var command = new SqlCommand(queryMWRU_NUMBER, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.MWRU_NUMBER = Convert.ToInt32(reader["MWRU_NUMBER"]);
                        }
                    }
                }

                //получение всех рейсов 
                string queryALL_MWRU_NUMBER = "SELECT MWRU_NUMBER FROM MWD_RUN";
                using (var command = new SqlCommand(queryALL_MWRU_NUMBER, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            int mwruNumber = reader.GetInt32(0);
                            vsatInfo.ALL_MWRU_NUMBER.Add(mwruNumber);
                        }
                    }
                }

                //получение диаметра по рейсу
                string queryMWRU_HOLE_DIAMETER = "SELECT TOP 1 MWRU_HOLE_DIAMETER FROM MWD_RUN ORDER BY MWRU_NUMBER DESC";
                using (var command = new SqlCommand(queryMWRU_HOLE_DIAMETER, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.MWRU_HOLE_DIAMETER = Convert.ToSingle(reader["MWRU_HOLE_DIAMETER"]) * 1000;
                        }
                    }
                }

                //ID рейса
                string queryMWRU_IDENTIFIER = "SELECT TOP 1 MWRU_IDENTIFIER FROM MWD_RUN ORDER BY MWRU_NUMBER DESC";
                using (var command = new SqlCommand(queryMWRU_IDENTIFIER, connection))
                {
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            vsatInfo.MWRU_IDENTIFIER = reader["MWRU_IDENTIFIER"].ToString();
                        }
                    }
                }

                //получение ID компонента 
                string queryMWCO_IDENTIFIER = @"SELECT MWCO_IDENTIFIER FROM MWD_RUN_TO_COMPONENT WHERE MWRU_IDENTIFIER = @MWRU_IDENTIFIER";
                using (var command = new SqlCommand(queryMWCO_IDENTIFIER, connection)) //@MWRU_IDENTIFIER это переменная которая была определена выше
                {
                    command.Parameters.AddWithValue("@MWRU_IDENTIFIER", vsatInfo.MWRU_IDENTIFIER); //отправляем запрос в базу данных заменяем параметр на реальный код с помощью .Add

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync()) //каждый цикл ReadAsync возвращает true и сдвигает указатель на следующую строку результат запроса
                        {
                            string mwcoIdentifier = reader["MWCO_IDENTIFIER"].ToString();
                            vsatInfo.MWCO_IDENTIFIER.Add(mwcoIdentifier);
                        }
                    }
                }


                //Позиция в КНБК
                string queryMWRC_POSITION = @"SELECT MWRC_POSITION, MWCO_IDENTIFIER FROM MWD_RUN_TO_COMPONENT WHERE MWRU_IDENTIFIER = @MWRU_IDENTIFIER";
                Dictionary<string, int> mwrcPositionDictionary = new Dictionary<string, int>(); // пришлось создать новый временный словарь для соблюдения атомарности асинхронного кода
                using (var command = new SqlCommand(queryMWRC_POSITION, connection)) //@MWRU_IDENTIFIER это переменная которая была определена выше
                {
                    command.Parameters.AddWithValue("@MWRU_IDENTIFIER", vsatInfo.MWRU_IDENTIFIER); //отправляем запрос в базу данных заменяем параметр на реальный код с помощью .Add

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync()) //каждый цикл ReadAsync возвращает true и сдвигает указатель на следующую строку результат запроса
                        {
                            int mwrcPosition = Convert.ToInt32(reader["MWRC_POSITION"]);
                            string mwcoIdentifier = reader["MWCO_IDENTIFIER"].ToString();
                            mwrcPositionDictionary[mwcoIdentifier] = mwrcPosition;
                        }
                    }
                }
                vsatInfo.MWRC_POSITION = mwrcPositionDictionary; //в конце присвоил временный словарь словарю из модели

                //Непромер от низа долота
                string queryMWRC_OFFSET_FROM_BIT = @"SELECT MWRC_OFFSET_FROM_BIT, MWCO_IDENTIFIER FROM MWD_RUN_TO_COMPONENT WHERE MWRU_IDENTIFIER = @MWRU_IDENTIFIER";
                Dictionary<string, float> mwrcOfssetFromBitDictionary = new Dictionary<string, float>();
                using (var command = new SqlCommand(queryMWRC_OFFSET_FROM_BIT, connection)) //@MWRU_IDENTIFIER это переменная которая была определена выше
                {
                    command.Parameters.AddWithValue("@MWRU_IDENTIFIER", vsatInfo.MWRU_IDENTIFIER); //отправляем запрос в базу данных заменяем параметр на реальный код с помощью .Add

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync()) //каждый цикл ReadAsync возвращает true и сдвигает указатель на следующую строку результат запроса
                        {
                            float mwrcOffsetFromBit = Convert.ToSingle(reader["MWRC_OFFSET_FROM_BIT"]);
                            string mwcoIdentifierOffset = reader["MWCO_IDENTIFIER"].ToString();
                            mwrcOfssetFromBitDictionary[mwcoIdentifierOffset] = mwrcOffsetFromBit;
                        }
                    }

                }
                vsatInfo.MWRC_OFFSET_FROM_BIT = mwrcOfssetFromBitDictionary;




                // Получение серийных номеров из списка ID компонентов
                string queryMWCO_SN = "SELECT MWCO_SN, MWCO_IDENTIFIER FROM MWD_COMPONENT WHERE MWCO_IDENTIFIER IN (";
                for (int i = 0; i < vsatInfo.MWCO_IDENTIFIER.Count; i++)
                {
                    queryMWCO_SN += $"@MWCO_IDENTIFIER{i}";
                    if (i < vsatInfo.MWCO_IDENTIFIER.Count - 1)
                    {
                        queryMWCO_SN += ", ";
                    }
                }
                queryMWCO_SN += ")";

                Dictionary<string, string> mwcoSNDictionary = new Dictionary<string, string>();
                using (var command = new SqlCommand(queryMWCO_SN, connection))
                {
                    // Добавление параметров к команде
                    for (int i = 0; i < vsatInfo.MWCO_IDENTIFIER.Count; i++)
                    {
                        command.Parameters.AddWithValue($"@MWCO_IDENTIFIER{i}", vsatInfo.MWCO_IDENTIFIER[i]);
                    }

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            string mwCoSn = reader["MWCO_SN"].ToString();
                            string mwCoIDSn = reader["MWCO_IDENTIFIER"].ToString();
                            mwcoSNDictionary[mwCoIDSn] = mwCoSn;
                        }
                    }
                }
                vsatInfo.MWCO_SN = mwcoSNDictionary;


                // Получение определителя КНБК по коду 
                string queryMWCT_IDENTIFIER = "SELECT MWCT_IDENTIFIER, MWCO_IDENTIFIER, TOCO_IDENTIFIER FROM MWD_COMPONENT WHERE MWCO_IDENTIFIER IN (";
                for (int i = 0; i < vsatInfo.MWCO_IDENTIFIER.Count; i++)
                {
                    queryMWCT_IDENTIFIER += $"@MWCO_IDENTIFIER{i}";
                    if (i < vsatInfo.MWCO_IDENTIFIER.Count - 1)
                    {
                        queryMWCT_IDENTIFIER += ", ";
                    }
                }
                queryMWCT_IDENTIFIER += ")";

                Dictionary<string, int> mwrCtDictionary = new Dictionary<string, int>();
                using (var command = new SqlCommand(queryMWCT_IDENTIFIER, connection))
                {
                    // Добавление параметров к команде
                    for (int i = 0; i < vsatInfo.MWCO_IDENTIFIER.Count; i++)
                    {
                        command.Parameters.AddWithValue($"@MWCO_IDENTIFIER{i}", vsatInfo.MWCO_IDENTIFIER[i]);
                    }

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            string mwctIdentifier = reader["MWCO_IDENTIFIER"].ToString();
                            int mwctID;

                            if (reader["MWCT_IDENTIFIER"] == DBNull.Value || string.IsNullOrEmpty(reader["MWCT_IDENTIFIER"].ToString())) // DBNull.Value это специальное значение в .NET для определения NULL - далее определение если ячейка пустая
                            {
                                mwctID = Convert.ToInt32(reader["TOCO_IDENTIFIER"]);

                            }
                            else
                            {
                                mwctID = Convert.ToInt32(reader["MWCT_IDENTIFIER"]);
                            }

                            mwrCtDictionary[mwctIdentifier] = mwctID;
                            Console.WriteLine(mwrCtDictionary);

                        }
                    }
                    List<string> listMWCOID = mwrCtDictionary.Keys.ToList();   // Использование списка MWCO_IDENTIFIER для дальнейшей обработки

                    vsatInfo.MWCT_IDENTIFIER = mwrCtDictionary;



                    //словарь сопоставления названия компонента и ID
                    Dictionary<int, string> mwcoRealNameDictionary = new Dictionary<int, string>();
                    foreach (int tocoID in vsatInfo.MWCT_IDENTIFIER.Values)
                    {
                        if (vsatInfo.componentID.TryGetValue(tocoID, out string componentName))
                        {
                            int newKey = tocoID;
                            while (mwcoRealNameDictionary.ContainsKey(newKey))
                            {
                                newKey += 100; // Изменение ключа, чтобы избежать повторений
                            }

                            mwcoRealNameDictionary[newKey] = componentName;
                        }

                    }
                    vsatInfo.MWCO_REAL_NAME = mwcoRealNameDictionary;
                    List<string> listREALNAMES = mwcoRealNameDictionary.Values.ToList();



                    //Создал словарь и объединил два списка в словарь 
                    Dictionary<string, string> newREALNAME = new Dictionary<string, string>();
                    if (listMWCOID.Count == listREALNAMES.Count)
                    {
                        for (int i = 0; i < listMWCOID.Count; i++)
                        {
                            string mwcoIdentifier = listMWCOID[i];
                            string realName = listREALNAMES[i];

                            // Добавляем элементы в новый словарь
                            newREALNAME[mwcoIdentifier] = realName;
                        }
                    }
                    else
                    {
                        int indexORD = listREALNAMES.IndexOf("ORD");
                        int indexCCN = listREALNAMES.IndexOf("CCN");
                        //listREALNAMES.Insert(indexORD, "");


                        for (int i = 0; i < listMWCOID.Count - 1; i++)
                        {
                            string mwcoIdentifier = listMWCOID[i];
                            string realName = listREALNAMES[i];
                            newREALNAME[mwcoIdentifier] = realName;
                        }

                    }

                    vsatInfo.NEW_REAL_NAME = newREALNAME;




                }

                return vsatInfo;


            }
        }
    }
}

