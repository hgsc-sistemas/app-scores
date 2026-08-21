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
import { MatIcon } from '@angular/material/icon';

export interface HospitalServiceItem {
  icon: string;
  title: string;
  description: string;
  tag: string;
  image?: string;
  highlight?: boolean;
}

export interface HospitalValue {
  icon: string;
  title: string;
  description: string;
}

export interface HospitalManagementPillar {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-hospital-presentation',
  standalone: true,
  imports: [MatIcon],
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

  /** Serviços principais com imagens reais do hospital e do ITGA */
  protected readonly featuredServices: readonly HospitalServiceItem[] = [
    {
      icon: 'local_hospital',
      title: 'Gestão Hospitalar & Pronto Atendimento 24h',
      description:
        'Administração hospitalar e gestão em saúde pelo ITGA com atendimento humanizado, triagem qualificada, leitos de enfermaria e suporte integral ao SUS.',
      tag: 'Plantão 24h • SUS',
      image: 'images/fachada-hospital.jpeg',
      highlight: true,
    },
    {
      icon: 'medical_services',
      title: 'Centro Cirúrgico & Procedimentos de Alta Complexidade',
      description:
        'Mais de 35.000 cirurgias entregues com excelência técnica: cirurgia geral, ortopédica, oftalmológica, urológica, ginecológica e vascular.',
      tag: '+35.000 Cirurgias',
      image: 'images/medicos-fazendo-cirurgia.jpeg',
      highlight: true,
    },
    {
      icon: 'radiology',
      title: 'Centro de Diagnóstico por Imagem & Métodos Gráficos',
      description:
        'Tomografia computadorizada, ultrassonografia com e sem Doppler, endoscopia digestiva alta, colonoscopia, biópsias guiadas e histeroscopias.',
      tag: 'Diagnóstico de Precisão',
      image: 'images/equipamento-ressonancia-magnetica.jpeg',
      highlight: true,
    },
  ];

  /** Outros serviços hospitalares complementares */
  protected readonly additionalServices: readonly HospitalServiceItem[] = [
    {
      icon: 'monitor_heart',
      title: 'Unidade de Terapia Intensiva (UTI)',
      description:
        'Leitos equipados com monitorização multiparamétrica contínua e equipe de intensivistas especializados em cuidados críticos.',
      tag: 'Alta Complexidade',
    },
    {
      icon: 'stethoscope',
      title: 'Ambulatório de Especialidades Médicas',
      description:
        'Consultas clínicas especializadas em cardiologia, ortopedia, ginecologia, pediatria, clínica geral e neurologia.',
      tag: 'Corpo Clínico',
    },
    {
      icon: 'medication',
      title: 'Internação Humanizada & Enfermarias',
      description:
        'Milhares de diárias de internação clínica executadas com foco na recuperação segura e no acolhimento familiar.',
      tag: 'Cuidado Contínuo',
    },
  ];

  /** Especialidades médicas do corpo clínico multidisciplinar (conforme o PDF) */
  protected readonly medicalSpecialties: readonly string[] = [
    'Cirurgia Geral',
    'Ortopedia & Cirurgiões Ortopedistas',
    'Médicos Cardiologistas',
    'Médicos Intensivistas (UTI)',
    'Médicos Pediatras',
    'Ginecologia e Obstetrícia',
    'Cirurgia Vascular',
    'Cirurgia Urológica',
    'Cirurgia Oftalmológica',
    'Anestesistas',
    'Médicos Clínicos Generalistas',
    'Cirurgia Bucomaxilofacial',
  ];

  /** Valores institucionais do ITGA */
  protected readonly institutionalValues: readonly HospitalValue[] = [
    {
      icon: 'volunteer_activism',
      title: 'Humanização',
      description: 'Acolhimento empático com foco no bem-estar integral.',
    },
    {
      icon: 'person',
      title: 'Respeito à Individualidade',
      description: 'Atenção personalizada às necessidades de cada paciente.',
    },
    {
      icon: 'policy',
      title: 'Transparência no Exercício',
      description: 'Ética rigorosa, compliance e prestação de contas pública.',
    },
    {
      icon: 'favorite',
      title: 'Comprometimento com a Saúde',
      description: 'Dedicação diária com qualidade técnica e resolutividade.',
    },
    {
      icon: 'balance',
      title: 'Ética e Moral',
      description: 'Princípios sólidos em todas as condutas assistenciais.',
    },
    {
      icon: 'public',
      title: 'Responsabilidade Social & Pública',
      description: 'Compromisso com o acesso universal e equitativo à saúde.',
    },
  ];

  /** Pilares de gestão e governança do ITGA (conforme o PDF) */
  protected readonly managementPillars: readonly HospitalManagementPillar[] = [
    {
      icon: 'account_balance',
      title: 'Governança & Contrato de Gestão',
      description:
        'Qualificação como Organização Social (Lei Federal nº 9.637/98), com Compliance, Balancete Mensal, Planejamento Trimestral e Auditoria Anual.',
    },
    {
      icon: 'terminal',
      title: 'Sistemas de Informação & LGPD',
      description:
        'Prontuário eletrônico, telemedicina, aplicativos de saúde e monitoramento contínuo para suporte e precisão nas decisões clínicas.',
    },
    {
      icon: 'groups',
      title: 'Recursos Humanos & Educação',
      description:
        'Investimento permanente na capacitação, educação continuada e ambiente saudável para os profissionais de saúde.',
    },
    {
      icon: 'eco',
      title: 'Gestão em Meio Ambiente',
      description:
        'Práticas de interdisciplinaridade voltadas para a sustentabilidade, preservação e utilização racional dos recursos naturais.',
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
