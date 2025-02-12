using System.Collections.Generic;

namespace TrackingSheet.Models.VSATdata
{
    public class VsatInfo
    {

        //Словарь для сравнения MWCO с их наименованием
        public Dictionary<int, string> componentID = new Dictionary<int, string>
        {
            {0, "APR" },
            {1, "OTK DAS"},
            {2, "DAS"},
            {3, "Gamma"},
            {4, "Gamma"},
            {5, "Gamma"},
            {6, "Gamma"},
            {7, "Gamma"},
            {8, "Gamma"},
            {9, "Gamma"},
            {10, "SRIG"},
            {11, "Resistivity"},
            {12, "Resistivity"},
            {13, "APR"},
            {14, "Multi-Resistivity"},
            {15, "USMPR"},
            {16, "MPR"},
            {17, "Multi-Resistivity"},
            {18, ""},
            {19, "ORD"},
            {20, ""},
            {21, "CCN"},
            {22, "Dynamics"},
            {23, "Dynamics"},
            {24, "Copilot"},
            {25, "Dynamics"},
            {26, "Neutron"},
            {27, "Neutron"},
            {28, "Stabiliser"},
            {29, "Flex Sub"},
            {30, "Pulser"},
            {31, "Pulser"},
            {32, "Pulser"},
            {33, "Pulser"},
            {34, "Probe Pieces"},
            {35, "SNT"},
            {36, "SDM"},
            {37, "Probe Pieces"},
            {38, "EEJ"},
            {39, "Battery"},
            {40, "Monel"},
            {41, "AT Probe"},
            {42, "Directional"},
            {43, "Directional"},
            {44, ""},
            {45, "Gyro"},
            {46, "Acoustic"},
            {47, "Gamma"},
            {48, "OTK GAM"},
            {49, "OTK MPR"},
            {50, "Memory"},
            {51, "Memory"},
            {52, "Memory"},
            {53, "Memory"},
            {54, ""},
            {55, "Monel"},
            {56, "Probe Piece"},
            {57, "Dynamics"},
            {58, "Multi-Resistivity"},
            {59, "Directional"},
            {60, "BCPM"},
            {61, "Tool"},
            {62, "OnTrak"},
            {63, "OTK Press"},
            {64, "Dynamics"},
            {65, "Stabiliser"},
            {66, "Monel"},
            {67, "Directional"},
            {68, "Monel"},
            {69, "Monel"},
            {70, "Directional"},
            {71, "Steering Unit"},
            {72, "ATK GT"},
            {73, "Top Stop Sub"},
            {74, "Monel"},
            {75, "Bottom Stop Sub"},
            {76, "Monel"},
            {77, "Monel"},
            {78, "Casing Collar Locator"},
            {79, "Dynamics"},
            {80, "Gamma"},
            {81, "Directional"},
            {82, "Directional"},
            {83, "Dynamics"},
            {84, "Monel"},
            {85, ""},
            {86, "Dynamics"},
            {87, ""},
            {88, ""},
            {89, ""},
            {90, ""},
            {91, ""},
            {92, ""},
            {93, ""},
            {94, ""},
            {95, ""},
            {96, "Pulser"},
            {410, "Exact"},
            {128, "Exact"},
            {228, "Exact"},
            {328, "Exact"},
            {428, "Exact"},

        };

        //Примитивные переменные из базы 
        public string WELL_NAME { get; set; } //в таблице WELL_TAB, последняя строка
        public string WELL_IDENTIFIER  { get; set; } //в таблице WELL_TAB, последняя строка
        public int MWRU_NUMBER {get; set; } //в таблице MWD_RUN
        public string MWRU_IDENTIFIER { get; set; } // в таблице MWD_RUN в строке с номером рейса
        public float MWRU_HOLE_DIAMETER { get; set; } //в таблице MWD_RUN
        public string FCTY_NAME { get; set; } //таблица FACILITY_TAB, последняя строка
        public string CPNM_IDENTIFIER { get; set; } //таблица FACILITY_TAB, последняя строка
        public string CPNM_NAME { get; set; } //таблица COMPANY_NAME по номеру CPNM_ID
        public string OOIN_NAME  { get; set; } //название месторождения в таблице OBJECT_OF_INTEREST_TAB, последняя строка

        


        // Далее идут элементы КНБК в виде списокв
        public Dictionary<string, int> MWRC_POSITION { get; set; } // в таблице MWD_RUN_TO_COMPONENT по MWRU_IDENTIFIER
        
        public Dictionary<string, float> MWRC_OFFSET_FROM_BIT { get; set; } // в таблице MWD_RUN_TO_COMPONENT по MWRU_IDENTIFIER

        //Список рейсов в базе данных

        public List<int> ALL_MWRU_NUMBER { get; set; }

        //// в таблице MWD_RUN_TO_COMPONENT по MWRU_IDENTIFIER
        public List<string> MWCO_IDENTIFIER { get; set; }
        
        public Dictionary<string, int> MWCT_IDENTIFIER {  get; set; } // в таблице MWD_COMPONENT в зависимости от MWCO_IDENTIFIER
        public Dictionary<string, string> MWCO_SN { get; set; } //// в таблице MWD_COMPONENT по MWCO_IDENTIFIER
        public Dictionary<int, string> MWCO_REAL_NAME { get; set; }
        public Dictionary<string, string> NEW_REAL_NAME { get; set; }
        public VsatInfo()
        {
            MWCO_IDENTIFIER = new List<string>(); // Инициализация списка (конструктор класса) обязателен т.к. списки умолчанию инициализируются со значением NULL
            MWRC_POSITION = new Dictionary<string, int>();
            MWRC_OFFSET_FROM_BIT = new Dictionary<string, float>();
            MWCT_IDENTIFIER = new Dictionary<string, int>();
            MWCO_SN = new Dictionary<string, string>();
            MWCO_REAL_NAME = new Dictionary<int, string>();
            NEW_REAL_NAME = new Dictionary<string, string>();
            ALL_MWRU_NUMBER = new List<int>();

        }

    }
}
