namespace TrackingSheet.Models.Kanban
{
    using Newtonsoft.Json;
    using System;

    public class ByteArrayToBase64Converter : JsonConverter<byte[]>
    {
        public override void WriteJson(JsonWriter writer, byte[] value, JsonSerializer serializer)
        {
            writer.WriteValue(Convert.ToBase64String(value));
        }

        public override byte[] ReadJson(JsonReader reader, Type objectType, byte[] existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            var base64String = reader.Value as string;
            return string.IsNullOrEmpty(base64String) ? null : Convert.FromBase64String(base64String);
        }
    }

}
