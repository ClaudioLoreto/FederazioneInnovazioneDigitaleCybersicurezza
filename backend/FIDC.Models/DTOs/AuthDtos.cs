// =============================================================================
//  FIDC.Models » DTOs » AuthDtos.cs
//  Data Transfer Object per autenticazione e registrazione.
//  I DTO NON contengono logica: solo trasporto dati tra API e client.
// =============================================================================

using FIDC.Models.Enums;

namespace FIDC.Models.DTOs;

/// <summary>Payload inviato dal client per registrare un nuovo utente.</summary>
/// <param name="Nome">Nome dell'utente.</param>
/// <param name="Cognome">Cognome dell'utente.</param>
/// <param name="Email">Email univoca (sarà lo username).</param>
/// <param name="Password">Password in chiaro (verrà hashata lato server, mai persistita).</param>
public record RegisterRequest(string Nome, string Cognome, string Email, string Password);

/// <summary>Payload di login.</summary>
/// <param name="Email">Email/username.</param>
/// <param name="Password">Password in chiaro.</param>
public record LoginRequest(string Email, string Password);

/// <summary>Risposta di autenticazione con token JWT e dati minimi utente.</summary>
/// <param name="Token">JSON Web Token firmato da usare nell'header Authorization.</param>
/// <param name="NomeCompleto">Nome completo dell'utente.</param>
/// <param name="Ruolo">Ruolo RBAC dell'utente.</param>
public record AuthResponse(string Token, string NomeCompleto, UserRole Ruolo);

/// <summary>Payload per la conferma dell'email tramite token.</summary>
/// <param name="Email">Email dell'utente da confermare.</param>
/// <param name="Token">Token monouso ricevuto via email Resend.</param>
public record ConfermaEmailRequest(string Email, string Token);
