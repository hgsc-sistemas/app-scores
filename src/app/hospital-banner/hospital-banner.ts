import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export interface BannerSlide {
  id: number;
  icon: string;
  tag: string;
  title: string;
  subtitle: string;
  isCta?: boolean;
  durationMs: number;
}

@Component({
  selector: 'app-hospital-banner',
  standalone: true,
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hospital-banner.html',
  styleUrl: './hospital-banner.css',
})
export class HospitalBanner implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private timerHandle?: ReturnType<typeof setTimeout>;

  /** Evento disparado quando o usuário clica para abrir a tela de apresentação completa */
  public readonly open = output<void>();

  public readonly slides: readonly BannerSlide[] = [
    {
      id: 0,
      icon: 'emergency',
      tag: 'Plantão 24h',
      title: 'Pronto Atendimento & Emergência 24h',
      subtitle:
        'Equipe médica de prontidão com triagem ágil e suporte avançado à vida.',
      durationMs: 3500,
    },
    {
      id: 1,
      icon: 'monitor_heart',
      tag: 'Alta Complexidade',
      title: 'UTI Adulto & Pediátrica',
      subtitle:
        'Leitos modernos com monitorização multiparamétrica ininterrupta.',
      durationMs: 3500,
    },
    {
      id: 2,
      icon: 'medical_services',
      tag: 'Centro Cirúrgico',
      title: 'Centro Cirúrgico Avançado',
      subtitle:
        'Salas preparadas para cirurgias eletivas, urgências e recuperação segura.',
      durationMs: 3500,
    },
    {
      id: 3,
      icon: 'radiology',
      tag: 'Diagnóstico Ágil',
      title: 'Diagnóstico & Laboratório',
      subtitle:
        'Tomografia, ultrassom, raio-X digital e análises clínicas com laudos rápidos.',
      durationMs: 3500,
    },
    {
      id: 4,
      icon: 'groups',
      tag: 'Especialidades',
      title: 'Ambulatório de Especialidades',
      subtitle:
        'Cardiologia, neurologia, pneumologia, clínica médica e ortopedia.',
      durationMs: 3500,
    },
    {
      id: 5,
      icon: 'local_hospital',
      tag: 'Institucional',
      title: 'Conheça o Nosso Hospital',
      subtitle:
        'Infraestrutura completa, atendimento humanizado e compromisso com a vida.',
      isCta: true,
      durationMs: 7000,
    },
  ];

  public readonly currentSlideIndex = signal<number>(0);
  public readonly isAnimating = signal<boolean>(false);

  public readonly currentSlide = computed(
    () => this.slides[this.currentSlideIndex()],
  );

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.scheduleNextSlide();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  public goToSlide(index: number): void {
    this.clearTimer();
    this.currentSlideIndex.set(index);
    if (isPlatformBrowser(this.platformId)) {
      this.scheduleNextSlide();
    }
  }

  public nextSlide(): void {
    this.clearTimer();
    this.isAnimating.set(true);

    setTimeout(() => {
      this.currentSlideIndex.update(
        (index) => (index + 1) % this.slides.length,
      );
      this.isAnimating.set(false);

      if (isPlatformBrowser(this.platformId)) {
        this.scheduleNextSlide();
      }
    }, 200);
  }

  private scheduleNextSlide(): void {
    this.clearTimer();
    const duration = this.currentSlide().durationMs;

    this.timerHandle = setTimeout(() => {
      this.nextSlide();
    }, duration);
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }
  }

  public handleOpenPresentation(): void {
    this.open.emit();
  }
}
