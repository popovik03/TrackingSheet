using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

public class PassportFolderIndexerService
{
    private readonly string _rootPath;
    private readonly string _outputPath;

    public PassportFolderIndexerService(string rootPath, string outputPath)
    {
        _rootPath = rootPath;
        _outputPath = outputPath;
    }

    public async Task IndexFolderAsync()
    {
        var folders = Directory.GetDirectories(_rootPath, "*", SearchOption.AllDirectories);
        var folderData = new List<string>();

        foreach (var folder in folders)
        {
            folderData.Add(folder);
        }

        var json = JsonSerializer.Serialize(folderData);
        await File.WriteAllTextAsync(_outputPath, json);
    }
}
