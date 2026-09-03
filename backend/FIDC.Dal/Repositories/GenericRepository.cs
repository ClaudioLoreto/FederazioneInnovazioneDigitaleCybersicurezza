// =============================================================================
//  FIDC.Dal » Repositories » GenericRepository.cs
//  Implementazione EF Core del repository generico. È l'UNICO punto in cui
//  si parla direttamente con il DbContext per le operazioni CRUD base.
// =============================================================================

using System.Linq.Expressions;
using FIDC.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FIDC.Dal.Repositories;

/// <summary>
/// Implementazione concreta di <see cref="IGenericRepository{T}"/> basata su EF Core.
/// Funziona identicamente su SQL Server e PostgreSQL (provider iniettato a runtime).
/// </summary>
/// <typeparam name="T">Entità che deriva da <see cref="BaseEntity"/>.</typeparam>
public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    /// <summary>Contesto EF Core condiviso (scoped per request).</summary>
    protected readonly FidcDbContext Db;

    /// <summary>DbSet tipizzato dell'entità gestita.</summary>
    protected readonly DbSet<T> Set;

    /// <summary>Inietta il DbContext e ricava il DbSet corrispondente a T.</summary>
    public GenericRepository(FidcDbContext db)
    {
        Db = db;
        Set = db.Set<T>();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await Set.AsNoTracking().ToListAsync(ct);

    /// <inheritdoc />
    public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await Set.AsNoTracking().Where(predicate).ToListAsync(ct);

    /// <inheritdoc />
    public async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        => await Set.FirstOrDefaultAsync(e => e.Id == id, ct);

    /// <inheritdoc />
    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await Set.AddAsync(entity, ct);

    /// <inheritdoc />
    public void Update(T entity) => Set.Update(entity);

    /// <inheritdoc />
    public void SoftDelete(T entity)
    {
        // Soft-delete: non rimuoviamo la riga, alziamo solo il flag.
        entity.IsDeleted = true;
        Set.Update(entity);
    }

    /// <inheritdoc />
    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => Db.SaveChangesAsync(ct);
}
