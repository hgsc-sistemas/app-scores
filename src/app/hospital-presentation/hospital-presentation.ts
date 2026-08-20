import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';

export interface HospitalServiceItem {
  icon: string;
  title: string;
  description: string;
  tag: string;
  highlight?: boolean;
}

export interface HospitalDifferential {
  icon: string;
  title: string;
  description: string;
}

export interface HospitalInfrastructure {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-hospital-presentation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hospital-presentation.html',
  styleUrl: './hospital-presentation.css',
})
export class HospitalPresentation implements OnInit, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Quando `true` (modo de entrada/recarregamento inicial do site):
   * O usuário deve rolar até o final da página para que a barra atinja 100% e libere o botão para a calculadora.
   *
   * Quando `false` (quando o usuário clica em "Conhecer o Hospital" na calculadora):
   * A tela funciona como uma página normal livre, com botão de voltar no topo e no rodapé liberados a qualquer momento.
   */
  public readonly isInitialOnboarding = input<boolean>(true);

  /** Evento disparado quando o usuário fecha/sai da apresentação */
  public readonly closed = output<void>();

  /** Percentual de rolagem da página (0 a 100) */
  public readonly scrollProgress = signal<number>(0);

  /** Indica se o usuário já atingiu o final da página no modo de rolagem */
  public readonly hasReachedBottom = signal<boolean>(false);

  /** No modo livre é sempre true; no modo onboarding precisa ter chegado ao fim */
  public readonly canClose = computed(
    () =>
      !this.isInitialOnboarding() ||
      this.hasReachedBottom() ||
      this.scrollProgress() >= 100,
  );

  protected readonly hospitalServices: readonly HospitalServiceItem[] = [
    {
      icon: '🚨',
      title: 'Pronto Atendimento & Emergência 24h',
      description:
        'Atendimento médico ininterrupto para casos de urgência e emergência, com triagem protocolar ágil e suporte imediato à vida.',
      tag: 'Plantão 24h',
      highlight: true,
    },
    {
      icon: '🩺',
      title: 'Unidade de Terapia Intensiva (UTI)',
      description:
        'Leitos de alta complexidade com monitorização multiparamétrica contínua, suporte ventilatório avançado e equipe de intensivistas.',
      tag: 'Alta Complexidade',
      highlight: true,
    },
    {
      icon: '🔬',
      title: 'Centro Cirúrgico Avançado',
      description:
        'Salas cirúrgicas modernas e seguras para cirurgias eletivas, procedimentos de urgência e recuperação pós-anestésica completa.',
      tag: 'Segurança Cirúrgica',
    },
    {
      icon: '🧪',
      title: 'Centro de Diagnóstico por Imagem & Laboratório',
      description:
        'Exames de tomografia computadorizada, raio-X digital, ultrassonografia e análises clínicas laboratoriais com laudos rápidos.',
      tag: 'Diagnóstico Ágil',
    },
    {
      icon: '👨‍⚕️',
      title: 'Ambulatório de Especialidades Médicas',
      description:
        'Consultas com especialistas em cardiologia, pneumologia, clínica médica, neurologia, ortopedia e cirurgia geral.',
      tag: 'Corpo Clínico',
    },
    {
      icon: '💊',
      title: 'Internação & Enfermarias Humanizadas',
      description:
        'Acomodações acolhedoras com foco na segurança do paciente, prevenção de riscos assistenciais e plano terapêutico individualizado.',
      tag: 'Cuidado Contínuo',
    },
  ];

  protected readonly hospitalDifferentials: readonly HospitalDifferential[] = [
    {
      icon: '⭐',
      title: 'Atendimento Humanizado 24h',
      description:
        'Acolhimento empático com foco no bem-estar integral de cada paciente e de sua família.',
    },
    {
      icon: '🛡️',
      title: 'Protocolos Clínicos Validados',
      description:
        'Adoção rigorosa de escores internacionais validados (como NEWS2 e SAPS II) para decisões terapêuticas seguras.',
    },
    {
      icon: '🤝',
      title: 'Equipe Multidisciplinar Integrada',
      description:
        'Médicos, enfermeiros, fisioterapeutas, nutricionistas e farmacêuticos atuando em total sintonia.',
    },
  ];

  protected readonly hospitalInfrastructure: readonly HospitalInfrastructure[] = [
    {
      icon: '🏢',
      title: 'Instalações Modernas',
      description:
        'Ambientes climatizados, acessíveis e projetados de acordo com os mais rigorosos padrões de segurança hospitalar.',
    },
    {
      icon: '⚡',
      title: 'Tecnologia de Ponta',
      description:
        'Equipamentos biomédicos de última geração para monitorização em tempo real e diagnósticos de alta precisão.',
    },
    {
      icon: '🚑',
      title: 'Suporte de Transferência & Resgate',
      description:
        'Ambulâncias UTI móvel preparadas para suporte avançado à vida e remoções inter-hospitalares seguras.',
    },
  ];

  ngOnInit(): void {
    if (this.isInitialOnboarding()) {
      this.updateScrollProgress();
    }
  }

  ngAfterViewInit(): void {
    if (this.isInitialOnboarding()) {
      this.updateScrollProgress();
    }
  }

  @HostListener('window:scroll')
  public onWindowScroll(): void {
    if (this.isInitialOnboarding()) {
      this.updateScrollProgress();
    }
  }

  @HostListener('window:resize')
  public onWindowResize(): void {
    if (this.isInitialOnboarding()) {
      this.updateScrollProgress();
    }
  }

  public updateScrollProgress(): void {
    if (!this.isInitialOnboarding()) {
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.scrollProgress.set(100);
      this.hasReachedBottom.set(true);
      return;
    }

    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight,
    );

    const maxScroll = documentHeight - viewportHeight;

    if (viewportHeight > 0 && documentHeight > 0 && maxScroll <= 15) {
      this.scrollProgress.set(100);
      this.hasReachedBottom.set(true);
      return;
    }

    if (maxScroll > 15) {
      const rawPercent = (scrollY / maxScroll) * 100;
      const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

      if (percent > this.scrollProgress()) {
        this.scrollProgress.set(percent);
      }

      if (scrollY + viewportHeight >= documentHeight - 30 || percent >= 98) {
        this.scrollProgress.set(100);
        this.hasReachedBottom.set(true);
      }
    }
  }

  public handleClose(): void {
    if (this.canClose()) {
      this.closed.emit();
    }
  }
}
