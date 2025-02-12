//using System.Collections.Generic;
//using System.Data.SqlClient;
//using System;
//using System.Threading.Tasks;
//using Microsoft.Extensions.Configuration;
//using NuGet.Packaging.Signing;
//using TrackingSheet.Models.WellInspector;
//using System.Data;
//using SciChart.Data.Model;


//namespace TrackingSheet.Services.WellInspectorServices

//{
//    public class WellInspectorService
//    {
        
//        private string _connectionString;

//        public WellInspectorService(IConfiguration configuration)
//        {
//            _connectionString = configuration.GetConnectionString("CDACollector");
//        }

//        public async Task<WellInspectorInfo> GetWellInspectorInfoAsync()
//        {
//            var  datalist = new WellInspectorInfo();

//            using (SqlConnection connection = new SqlConnection(_connectionString))
//            {
//                await connection.OpenAsync();

//                string query = 
//            }
//        }
//    }
//}
