using System;
using System.Collections.Generic;

namespace TrackingSheet.Models.VSATdata
{
    public class VsatInfoRun
    {
        // Примитивные переменные из базы 
        public string WellName { get; set; }
        public string WellIdentifier { get; set; }
        public string FctyName { get; set; }
        public string CpnmIdentifier { get; set; }
        public string CpnmName { get; set; }
        public string OoinName { get; set; }

        // Свойства из MWD_RUN
        public int MwruNumber { get; set; }
        public string MwruIdentifier { get; set; }
        public DateTime MwruDatetimeStart { get; set; }
        public DateTime MwruDatetimeEnd { get; set; }
        public float MwruHoleDiameter { get; set; }
        public string MwruFse1 { get; set; }
        public string MwruFse2 { get; set; }

        // Коллекция компонентов рейса
        public List<VsatComponent> Components { get; set; } = new List<VsatComponent>();
    }

    public class ComponentRealNames
    {
        //Словарь для сравнения MWCO с их наименованием
        public Dictionary<int, string> componentRunID = new Dictionary<int, string>
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
    }
}
