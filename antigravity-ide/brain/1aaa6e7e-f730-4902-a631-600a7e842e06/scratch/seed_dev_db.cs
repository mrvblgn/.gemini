using BCSMS.Domain.Entities;
using BCSMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var options = new DbContextOptionsBuilder<BcsmsDbContext>()
    .UseSqlite("Data Source=src/BCSMS.API/bcsms.db")
    .Options;

using var db = new BcsmsDbContext(options);
db.Database.EnsureCreated();

var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == "Road and Infrastructure");
if (category == null)
{
    category = new Category(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "Road and Infrastructure",
        "Road maintenance, potholes, and traffic signs.",
        DateTime.UtcNow);
    db.Categories.Add(category);
    await db.SaveChangesAsync();
    Console.WriteLine($"Category created: {category.Id} - {category.Name}");
}
else
{
    Console.WriteLine($"Category already exists: {category.Id} - {category.Name}");
}
