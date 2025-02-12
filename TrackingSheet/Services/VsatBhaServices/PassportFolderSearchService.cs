using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

public class PassportFolderSearchService
{
    private readonly string _outputPath;

    public PassportFolderSearchService(string outputPath)
    {
        _outputPath = outputPath;
    }

    public async Task<List<string>> SearchPassportFoldersAsync(string folderName)
    {
        if (!File.Exists(_outputPath))
        {
            return new List<string>();
        }

        try
        {
            var json = await File.ReadAllTextAsync(_outputPath);
            var folderData = JsonSerializer.Deserialize<List<string>>(json); //читаем файл json и записок его значений в список 

            if (folderData == null)
            {
                Console.WriteLine("Файл json пустой");
                return new List<string>();
            }

            var result = new List<string>();
            foreach (var folder in folderData)
            {
                if (folder.Contains(folderName, StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine(folder);
                    result.Add(folder);
                }
            }
           
            return result;
           
        }
        catch (Exception ex)
        {
            // Логируем ошибку или обрабатываем её другим образом
            Console.WriteLine($"Ошибка при чтении или десериализации файла: {ex.Message}");
            return new List<string>();
        }
    }
}
