import { ChangeDetectionStrategy, Component, output } from '@angular/core';

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
export class HospitalPresentation {
  /** Evento disparado quando o usuário clica para voltar para a calculadora */
  public readonly closed = output<void>();

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

  public handleClose(): void {
    this.closed.emit();
  }
}
