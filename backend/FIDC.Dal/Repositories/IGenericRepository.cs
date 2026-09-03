// =============================================================================
//  FIDC.Dal » Repositories » IGenericRepository.cs
//  Contratto generico del pattern Repository. Astrae l'accesso ai dati
//  dal layer di business (BLL), che NON deve conoscere EF Core direttamente.
// =============================================================================

using System.Linq.Expressions;
using FIDC.Models.Entities;

namespace FIDC.Dal.Repositories;

/// <summary>
/// Repository generico per le operazioni CRUD comuni a tutte le entità.
/// </summary>
/// <typeparam name="T">Entità che deriva da <see cref="BaseEntity"/>.</typeparam>
public interface IGenericRepository<T> where T : BaseEntity
{
    /// <summary>Restituisce tutte le entità (soft-deleted escluse dal filtro globale).</summary>
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);

    /// <summary>Restituisce le entità che soddisfano il predicato indicato.</summary>
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);

    /// <summary>Recupera una singola entità per chiave primaria, o null.</summary>
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);

    /// <summary>Aggiunge una nuova entità (persistenza al SaveChanges).</summary>
    Task AddAsync(T entity, CancellationToken ct = default);

    /// <summary>Marca un'entità come modificata.</summary>
    void Update(T entity);

    /// <summary>Soft-delete: imposta IsDeleted = true anziché rimuovere fisicamente.</summary>
    void SoftDelete(T entity);

    /// <summary>Persiste le modifiche pendenti sul database.</summary>
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
