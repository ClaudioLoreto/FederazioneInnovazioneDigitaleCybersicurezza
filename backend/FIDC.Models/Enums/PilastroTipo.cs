// =============================================================================
//  FIDC.Models » Enums » PilastroTipo.cs
//  I 4 pilastri istituzionali della Federazione.
// =============================================================================

namespace FIDC.Models.Enums;

/// <summary>
/// I quattro pilastri fondanti della FIDC. Usati per categorizzare
/// attività, eventi, contenuti formativi e ricerche.
/// </summary>
public enum PilastroTipo
{
    /// <summary>Attività: iniziative, progetti e tavoli di lavoro della Federazione.</summary>
    Attivita = 1,

    /// <summary>Eventi: conferenze, workshop, hackathon e incontri pubblici.</summary>
    Eventi = 2,

    /// <summary>Formazione: corsi, percorsi e certificazioni su digitale e cybersicurezza.</summary>
    Formazione = 3,

    /// <summary>Ricerca: studi, white paper e osservatori su innovazione e sicurezza.</summary>
    Ricerca = 4
}
