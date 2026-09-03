// =============================================================================
//  FIDC.Models » Entities » Iscrizione.cs
//  Tabella di relazione N:N tra Utente ed Evento (con dati propri).
// =============================================================================

namespace FIDC.Models.Entities;

/// <summary>
/// Iscrizione di un utente a un evento. Modella la relazione molti-a-molti
/// tra <see cref="Utente"/> ed <see cref="Evento"/> arricchita da attributi propri.
/// </summary>
public class Iscrizione : BaseEntity
{
    /// <summary>FK verso l'evento.</summary>
    public int EventoId { get; set; }

    /// <summary>Evento di riferimento (navigazione).</summary>
    public Evento? Evento { get; set; }

    /// <summary>FK verso l'utente iscritto.</summary>
    public int UtenteId { get; set; }

    /// <summary>Utente iscritto (navigazione).</summary>
    public Utente? Utente { get; set; }

    /// <summary>Indica se è stata inviata la mail di conferma iscrizione (Resend).</summary>
    public bool EmailConfermaInviata { get; set; }

    /// <summary>Indica se l'iscritto ha effettivamente partecipato (check-in).</summary>
    public bool Presente { get; set; }
}
