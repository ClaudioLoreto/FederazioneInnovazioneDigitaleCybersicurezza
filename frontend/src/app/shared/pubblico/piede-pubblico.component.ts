// =============================================================================
//  frontend/src/app/shared/pubblico/piede-pubblico.component.ts
//  PIÈ DI PAGINA PUBBLICO — marchio, contatti istituzionali, social e
//  collegamenti per i soci. Condiviso da home e pagine interne.
// =============================================================================

import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AnimatedLogoComponent } from '../animated-logo/animated-logo.component';
import { ContenutiService } from '../../services/contenuti.service';

@Component({
  selector: 'fidc-piede-pubblico',
  standalone: true,
  imports: [RouterLink, AnimatedLogoComponent],
  templateUrl: './piede-pubblico.component.html',
  styleUrl: './piede-pubblico.component.scss'
})
export class PiedePubblicoComponent {
  private readonly router = inject(Router);

  @Input() home = false;
  @Output() vai = new EventEmitter<string>();

  private readonly servizio = inject(ContenutiService);
  readonly identita = computed(() => this.servizio.attuali().identita);
  readonly contatti = computed(() => this.servizio.attuali().contatti);
  /** Social con un indirizzo compilato. */
  readonly social = computed(() => this.contatti().social.filter((x) => x.url.trim()));
  /** La colonna Contatti compare solo se c'è almeno un recapito. */
  readonly haContatti = computed(() => {
    const k = this.contatti();
    return !!(k.sede || k.email || k.pec || k.telefono || k.whatsapp || k.orari);
  });
  readonly anno = new Date().getFullYear();

  naviga(id: string, ev?: Event): void {
    ev?.preventDefault();
    if (this.home) this.vai.emit(id);
    else this.router.navigate(['/'], id === 'inizio' ? {} : { fragment: id });
  }

  /** Solo cifre per i collegamenti tel: e wa.me. */
  soloCifre(numero: string): string { return numero.replace(/[^\d+]/g, '').replace(/^\+/, ''); }
}
