//В разработке

using Microsoft.AspNetCore.Mvc;

namespace TrackingSheet.Controllers

{
    public class MapController : Controller
    {
        //Сервис для получения корневого пути (wwwroot)
        private readonly IWebHostEnvironment _env;

        public MapController(IWebHostEnvironment env)
        {
            _env = env;
        }

        //Загрузка первичной страницы
        [HttpGet]
        public async Task<IActionResult> FieldMap()
        {
            return View();
        }

        //Загрузка страницы с подгруженной картой
        [HttpGet]
        public IActionResult ViewMap(string fileName)
        {
            //Передача пути к файлу в представлении через модель
            ViewBag.MapPath = Url.Content("~/img/maps/" + fileName);
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> UploadMap(IFormFile mapFile)
        {
            if (mapFile != null && mapFile.Length > 0)
            {
                var fileName = Path.GetFileName(mapFile.FileName);
                var path = Path.Combine(_env.WebRootPath, "img", "maps", fileName);

                // Создаём директорию, если её нет
                Directory.CreateDirectory(Path.GetDirectoryName(path));

                // Фактически сохраняем файл в папку
                using (var stream = new FileStream(path, FileMode.Create))
                {
                    await mapFile.CopyToAsync(stream);
                }

                return RedirectToAction("ViewMap", new { fileName = fileName });
            }

            // Если файл не выбран или пуст
            ModelState.AddModelError("mapFile", "Файл не выбран или он пуст.");
            return View("FieldMap");

        }


    }
}
