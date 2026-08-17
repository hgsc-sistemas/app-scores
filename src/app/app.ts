import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
 
export type ScoreType = 'news2' | 'saps2';
 
export interface News2Values {
  respiratoryRate: number;
  oxygenSaturation: number;
  systolicBp: number;
  heartRate: number;
  temperature: number;
  consciousness: 'A' | 'V' | 'P' | 'U';
  oxygenSupplement: boolean;
}
 
export interface Saps2Values {
  age: number;
  heartRate: number;
  systolicBp: number;
  temperature: number;
  gcs: number;
  sodium: number;
  potassium: number;
  bicarbonate: number;
  bilirubin: number;
  leukocytes: number;
  mechanicalVentilation: boolean;
  pao2Fio2: number;
  urineOutput: number;
  bun: number;
  admissionType: 'scheduledSurgical' | 'medical' | 'unscheduledSurgical';
  metastaticCancer: boolean;
  hematologicMalignancy: boolean;
  aids: boolean;
}
 
export interface ScoreResult {
  total: number;
  label: string;
  tone: 'low' | 'medium' | 'high' | 'critical';
  guidance: string;
  estimate: string;
}
 
export interface ScoreOption {
  label: string;
  value: number | string | boolean;
}
 
const NEWS2_DEFAULT: News2Values = {
  respiratoryRate: 16,
  oxygenSaturation: 96,
  systolicBp: 150,
  heartRate: 70,
  temperature: 37,
  consciousness: 'A',
  oxygenSupplement: false,
};
 
const SAPS2_DEFAULT: Saps2Values = {
  // Dados Vitais e Demográficos
  age: 35,
  heartRate: 95,
  systolicBp: 140,
  temperature: 37.5,
  gcs: 15,
  
  // Laboratório
  sodium: 140,
  potassium: 4.2,
  bicarbonate: 22,
  bilirubin: 3.5,
  leukocytes: 12,
  
  // Variáveis específicas do SAPS 2 (Novas)
  mechanicalVentilation: false,
  pao2Fio2: 400, // Relação PaO2/FiO2 normal (só pontua se mechanicalVentilation for true)
  urineOutput: 1500, // Débito urinário em mL/24h (Normal ≥ 1000)
  bun: 15, // Ureia / Blood Urea Nitrogen em mg/dL (Normal < 28)
  
  // Admissão e Comorbidades Específicas do SAPS 2
  admissionType: 'scheduledSurgical', // Cirurgia programada pontua 0
  metastaticCancer: false,
  hematologicMalignancy: false,
  aids: false,
};
 
export function calculateNews2Score(values: News2Values): number {
  let total = 0;
 
  total += getRangeScore(values.respiratoryRate, [
    { max: 8, score: 3 },
    { min: 9, max: 11, score: 1 },
    { min: 12, max: 20, score: 0 },
    { min: 21, max: 24, score: 2 },
    { min: 25, score: 3 },
  ]);
 
  total += getRangeScore(values.oxygenSaturation, [
    { max: 90, score: 3 },
    { min: 91, max: 93, score: 2 },
    { min: 94, max: 95, score: 1 },
    { min: 96, score: 0 },
  ]);
 
  total += getRangeScore(values.systolicBp, [
    { max: 90, score: 3 },
    { min: 91, max: 100, score: 2 },
    { min: 101, max: 110, score: 1 },
    { min: 111, max: 219, score: 0 },
    { min: 220, score: 3 },
  ]);
 
  total += getRangeScore(values.heartRate, [
    { max: 40, score: 3 },
    { min: 41, max: 50, score: 1 },
    { min: 51, max: 90, score: 0 },
    { min: 91, max: 110, score: 1 },
    { min: 111, max: 130, score: 2 },
    { min: 131, score: 3 },
  ]);
 
  total += getRangeScore(values.temperature, [
    { max: 35, score: 3 },
    { min: 35.1, max: 36, score: 1 },
    { min: 36.1, max: 38, score: 0 },
    { min: 38.1, max: 39, score: 1 },
    { min: 39.1, score: 2 },
  ]);
 
  total += getRangeScore(values.consciousness === 'A' ? 0 : 1, [
    { max: 0, score: 0 },
    { min: 1, score: 3 },
  ]);
 
  total += values.oxygenSupplement ? 2 : 0;
 
  return total;
}
 
export function calculateSaps2Score(values: Saps2Values): number {
  let total = 0;

  total += getRangeScore(values.age, [
    { max: 39, score: 0 },
    { min: 40, max: 59, score: 7 },
    { min: 60, max: 69, score: 12 },
    { min: 70, max: 74, score: 15 },
    { min: 75, max: 79, score: 16 },
    { min: 80, score: 18 },
  ]);

  total += getRangeScore(values.heartRate, [
    { max: 39, score: 11 },
    { min: 40, max: 69, score: 2 },
    { min: 70, max: 119, score: 0 },
    { min: 120, max: 159, score: 4 },
    { min: 160, score: 7 },
  ]);

  total += getRangeScore(values.systolicBp, [
    { max: 69, score: 13 },
    { min: 70, max: 99, score: 5 },
    { min: 100, max: 199, score: 0 },
    { min: 200, score: 2 },
  ]);

  total += getRangeScore(values.temperature, [
    { max: 37.5, score: 0 },
    { min: 39, score: 3 },
  ]);

  total += getRangeScore(values.gcs, [
    { max: 5, score: 26 },
    { min: 6, max: 8, score: 13 },
    { min: 9, max: 10, score: 7 },
    { min: 11, max: 13, score: 5 },
    { min: 14, max: 15, score: 0 },
  ]);

  // A oxigenação só pontua se o paciente estiver em ventilação mecânica
  if (values.mechanicalVentilation) {
    total += getRangeScore(values.pao2Fio2, [
      { max: 99, score: 11 },
      { min: 100, max: 199, score: 9 },
      { min: 200, score: 0 },
    ]);
  }

  // Débito urinário (mL/24h)
  total += getRangeScore(values.urineOutput, [
    { max: 499, score: 11 },
    { min: 500, max: 999, score: 4 },
    { min: 1000, score: 0 },
  ]);

  // Ureia / BUN (mg/dL)
  total += getRangeScore(values.bun, [
    { max: 27.9, score: 0 },
    { min: 28, max: 83.9, score: 6 },
    { min: 84, score: 10 },
  ]);

  total += getRangeScore(values.leukocytes, [
    { max: 0.9, score: 12 },
    { min: 1, max: 19.9, score: 0 },
    { min: 20, score: 3 },
  ]);

  total += getRangeScore(values.sodium, [
    { max: 124, score: 5 },
    { min: 125, max: 144, score: 0 },
    { min: 145, score: 1 },
  ]);

  total += getRangeScore(values.potassium, [
    { max: 2.9, score: 3 },
    { min: 3, max: 4.9, score: 0 },
    { min: 5, score: 3 },
  ]);

  total += getRangeScore(values.bicarbonate, [
    { max: 14.9, score: 6 },
    { min: 15, max: 19.9, score: 3 },
    { min: 20, score: 0 },
  ]);

  total += getRangeScore(values.bilirubin, [
    { max: 3.9, score: 0 },
    { min: 4, max: 5.9, score: 4 },
    { min: 6, score: 9 },
  ]);

  // Tipo de Admissão
  if (values.admissionType === 'medical') {
    total += 6;
  } else if (values.admissionType === 'unscheduledSurgical') {
    total += 8;
  }
  // 'scheduledSurgical' pontua 0, portanto não precisa de condicional

  // Comorbidades específicas do SAPS 2
  if (values.metastaticCancer) total += 9;
  if (values.hematologicMalignancy) total += 10;
  if (values.aids) total += 17;

  return total;
}
 
function getRangeScore(value: number, ranges: Array<{ min?: number; max?: number; score: number }>): number {
  return ranges.find((range) => {
    const minOk = range.min === undefined || value >= range.min;
    const maxOk = range.max === undefined || value <= range.max;
    return minOk && maxOk;
  })?.score ?? 0;
}
 
export function summarizeNews2(total: number): ScoreResult {
  if (total <= 4) {
    return {
      total,
      label: 'Baixo risco',
      tone: 'low',
      guidance: 'Monitorizar e repetir avaliação em até 12 horas.',
      estimate: 'Observação clínica regular',
    };
  }
 
  if (total <= 6) {
    return {
      total,
      label: 'Risco moderado',
      tone: 'medium',
      guidance: 'Reavaliação em 1 hora e aumento da frequência de monitorização.',
      estimate: 'Sinais de alerta em progressão',
    };
  }
 
  if (total <= 8) {
    return {
      total,
      label: 'Risco alto',
      tone: 'high',
      guidance: 'Ativar suporte imediato do médico responsável e considerar elevação de nível de cuidado.',
      estimate: 'Necessita atenção urgente',
    };
  }
 
  return {
    total,
    label: 'Risco crítico',
    tone: 'critical',
    guidance: 'Avaliação urgente e resposta de emergência; priorizar intervenção e suporte avançado.',
    estimate: 'Potencial deterioração rápida',
  };
}
 
export function summarizeSaps2(total: number): ScoreResult {
  // Equação oficial do SAPS 2 para estimativa de mortalidade hospitalar
  const logit = -7.7631 + 0.0737 * total + 0.9971 * Math.log(total + 1);
  const probability = Math.exp(logit) / (1 + Math.exp(logit));
  const mortalityPercent = (probability * 100).toFixed(1); // Formata para 1 casa decimal

  const estimateText = `Estimativa de mortalidade: ${mortalityPercent}%`;

  if (total <= 29) {
    // Até ~20% de mortalidade estimada
    return {
      total,
      label: 'Baixa gravidade',
      tone: 'low',
      guidance: 'Acompanhamento contínuo e reavaliação clínica de rotina.',
      estimate: estimateText,
    };
  }

  if (total <= 40) {
    // ~20% a ~31% de mortalidade estimada
    return {
      total,
      label: 'Gravidade moderada',
      tone: 'medium',
      guidance: 'Monitorização intensiva e revisão clínica em curto prazo.',
      estimate: estimateText,
    };
  }

  if (total <= 52) {
    // ~31% a ~50% de mortalidade estimada
    return {
      total,
      label: 'Gravidade alta',
      tone: 'high',
      guidance: 'Ajustar nível de cuidado e priorizar suporte terapêutico intensivo.',
      estimate: estimateText,
    };
  }

  // > 52 pontos (Mortalidade > 50%)
  return {
    total,
    label: 'Gravidade extrema',
    tone: 'critical',
    guidance: 'Atendimento crítico imediato com revisão multidisciplinar e suporte avançado.',
    estimate: estimateText,
  };
}
 
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly selectedScore = signal<ScoreType>('news2');
  protected readonly news2Values = signal<News2Values>(NEWS2_DEFAULT);
  protected readonly saps2Values = signal<Saps2Values>(SAPS2_DEFAULT);
 
  protected readonly news2Result = computed(() => summarizeNews2(calculateNews2Score(this.news2Values())));
  protected readonly saps2Result = computed(() => summarizeSaps2(calculateSaps2Score(this.saps2Values())));
 
  protected readonly scoreOptions = [
    { key: 'news2' as const, label: 'Enfermaria • NEWS2' },
    { key: 'saps2' as const, label: 'UTI • SAPS 2' },
  ];
 
  protected readonly news2FieldOptions = {
    respiratoryRate: [
      { label: '≤ 8', value: 8, color: 'vermelho' }, // Score 3
      { label: '9–11', value: 10, color: 'amarelo' }, // Score 1
      { label: '12–20', value: 16, color: 'verde' }, // Score 0
      { label: '21–24', value: 22, color: 'laranja' }, // Score 2
      { label: '≥ 25', value: 25, color: 'vermelho' }, // Score 3
    ],
    oxygenSaturation: [
      { label: '≤ 91', value: 88, color: 'vermelho' }, // Score 3
      { label: '92–93', value: 92, color: 'laranja' }, // Score 2
      { label: '94–95', value: 95, color: 'amarelo' }, // Score 1
      { label: '≥ 96', value: 96, color: 'verde' }, // Score 0
    ],
    systolicBp: [
      { label: '≤ 90', value: 88, color: 'vermelho' }, // Score 3
      { label: '91–100', value: 95, color: 'laranja' }, // Score 2
      { label: '101–110', value: 105, color: 'amarelo' }, // Score 1
      { label: '111–219', value: 150, color: 'verde' }, // Score 0
      { label: '≥ 220', value: 220, color: 'vermelho' }, // Score 3
    ],
    heartRate: [
      { label: '≤ 40', value: 38, color: 'vermelho' }, // Score 3
      { label: '41–50', value: 45, color: 'amarelo' }, // Score 1
      { label: '51–90', value: 70, color: 'verde' }, // Score 0
      { label: '91–110', value: 100, color: 'amarelo' }, // Score 1
      { label: '111–130', value: 120, color: 'laranja' }, // Score 2
      { label: '≥ 131', value: 135, color: 'vermelho' }, // Score 3
    ],
    temperature: [
      { label: '≤ 35', value: 34.9, color: 'vermelho' }, // Score 3
      { label: '35.1–36', value: 35.5, color: 'amarelo' }, // Score 1
      { label: '36.1–38', value: 37, color: 'verde' }, // Score 0
      { label: '38.1–39', value: 38.5, color: 'amarelo' }, // Score 1
      { label: '≥ 39.1', value: 39.5, color: 'laranja' }, // Score 2 (NEWS2 dá 2 pontos para febre alta)
    ],
    consciousness: [
      { label: 'A', value: 'A', color: 'verde' }, // Alerta (Score 0)
      { label: 'V', value: 'V', color: 'vermelho' }, // Responde a Voz (Score 3)
      { label: 'P', value: 'P', color: 'vermelho-escuro' }, // Responde a Dor (Score 3 - piora clínica)
      { label: 'U', value: 'U', color: 'vermelho-escuro' }, // Não responde (Score 3 - coma/inconsciente)
    ],
    oxygenSupplement: [
      { label: 'Não', value: false, color: 'verde' }, // Score 0
      { label: 'Sim', value: true, color: 'laranja' }, // Score 2 no NEWS2
    ],
  } as const;
 
protected readonly saps2FieldOptions = {
      age: [
        { label: '≤ 39', value: 35, color: 'verde' }, // 0 pts
        { label: '40–59', value: 50, color: 'laranja' }, // 7 pts
        { label: '60–69', value: 65, color: 'vermelho' }, // 12 pts
        { label: '70–74', value: 72, color: 'vermelho-escuro' }, // 15 pts
        { label: '75–79', value: 77, color: 'vermelho-escuro' }, // 16 pts
        { label: '≥ 80', value: 82, color: 'vermelho-escuro' }, // 18 pts
      ],
      heartRate: [
        { label: '≤ 39', value: 35, color: 'vermelho' }, // 11 pts
        { label: '40–69', value: 55, color: 'amarelo' }, // 2 pts
        { label: '70–119', value: 95, color: 'verde' }, // 0 pts
        { label: '120–159', value: 140, color: 'amarelo' }, // 4 pts
        { label: '≥ 160', value: 165, color: 'laranja' }, // 7 pts
      ],
      systolicBp: [
        { label: '≤ 69', value: 65, color: 'vermelho' }, // 13 pts
        { label: '70–99', value: 85, color: 'laranja' }, // 5 pts
        { label: '100–199', value: 140, color: 'verde' }, // 0 pts
        { label: '≥ 200', value: 210, color: 'amarelo' }, // 2 pts
      ],
      temperature: [
        { label: '< 39.0', value: 37.5, color: 'verde' }, // 0 pts
        { label: '≥ 39.0', value: 39.5, color: 'amarelo' }, // 3 pts
      ],
      gcs: [
        { label: '3–5', value: 4, color: 'vermelho-escuro' }, // 26 pts
        { label: '6–8', value: 7, color: 'vermelho' }, // 13 pts
        { label: '9–10', value: 9, color: 'laranja' }, // 7 pts
        { label: '11–13', value: 12, color: 'laranja' }, // 5 pts
        { label: '14–15', value: 15, color: 'verde' }, // 0 pts
      ],
      mechanicalVentilation: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'amarelo' }, // O uso em si não pontua direto, mas abre a PaO2/FiO2
      ],
      pao2Fio2: [
        { label: '≥ 200 (ou não ventilado)', value: 400, color: 'verde' }, // 0 pts
        { label: '100–199', value: 150, color: 'vermelho' }, // 9 pts
        { label: '< 100', value: 80, color: 'vermelho' }, // 11 pts
      ],
      urineOutput: [
        { label: '≥ 1000', value: 1500, color: 'verde' }, // 0 pts
        { label: '500–999', value: 750, color: 'amarelo' }, // 4 pts
        { label: '< 500', value: 300, color: 'vermelho' }, // 11 pts
      ],
      bun: [
        { label: '< 28', value: 15, color: 'verde' }, // 0 pts
        { label: '28–83', value: 50, color: 'laranja' }, // 6 pts
        { label: '≥ 84', value: 90, color: 'vermelho' }, // 10 pts
      ],
      leukocytes: [
        { label: '< 1.0', value: 0.8, color: 'vermelho' }, // 12 pts
        { label: '1.0–19.9', value: 12, color: 'verde' }, // 0 pts
        { label: '≥ 20.0', value: 25, color: 'amarelo' }, // 3 pts
      ],
      sodium: [
        { label: '< 125', value: 120, color: 'laranja' }, // 5 pts
        { label: '125–144', value: 140, color: 'verde' }, // 0 pts
        { label: '≥ 145', value: 150, color: 'amarelo' }, // 1 pt
      ],
      potassium: [
        { label: '< 3.0', value: 2.8, color: 'amarelo' }, // 3 pts
        { label: '3.0–4.9', value: 4.2, color: 'verde' }, // 0 pts
        { label: '≥ 5.0', value: 5.5, color: 'amarelo' }, // 3 pts
      ],
      bicarbonate: [
        { label: '< 15', value: 12, color: 'laranja' }, // 6 pts
        { label: '15–19', value: 17, color: 'amarelo' }, // 3 pts
        { label: '≥ 20', value: 22, color: 'verde' }, // 0 pts
      ],
      bilirubin: [
        { label: '< 4.0', value: 3.5, color: 'verde' }, // 0 pts
        { label: '4.0–5.9', value: 5.0, color: 'amarelo' }, // 4 pts
        { label: '≥ 6.0', value: 7.0, color: 'vermelho' }, // 9 pts
      ],
      admissionType: [
        { label: 'Cirurgia Programada', value: 'scheduledSurgical', color: 'verde' }, // 0 pts
        { label: 'Clínica', value: 'medical', color: 'laranja' }, // 6 pts
        { label: 'Cirurgia de Urgência', value: 'unscheduledSurgical', color: 'laranja' }, // 8 pts
      ],
      metastaticCancer: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho' }, // 9 pts
      ],
      hematologicMalignancy: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho' }, // 10 pts
      ],
      aids: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho-escuro' }, // 17 pts
      ],
  } as const;
 
  protected setNews2Value<K extends keyof News2Values>(field: K, value: News2Values[K]): void {
    this.news2Values.update((current) => ({ ...current, [field]: value }));
  }
 
  protected setSaps2Value<K extends keyof Saps2Values>(field: K, value: Saps2Values[K]): void {
    this.saps2Values.update((current) => ({ ...current, [field]: value }));
  }
 
  protected toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
 
    return Number(value);
  }
 
  protected resetNews2(): void {
    this.news2Values.set(NEWS2_DEFAULT);
  }
 
  protected resetSaps2(): void {
    this.saps2Values.set(SAPS2_DEFAULT);
  }
 
  protected formatNumber(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  }
 
  protected getNews2FieldScore(field: keyof News2Values): number {
    const value = this.news2Values()[field];
 
    if (field === 'respiratoryRate') {
      return getRangeScore(value as number, [
        { max: 8, score: 3 },
        { min: 9, max: 11, score: 1 },
        { min: 12, max: 20, score: 0 },
        { min: 21, max: 24, score: 2 },
        { min: 25, score: 3 },
      ]);
    }
 
    if (field === 'oxygenSaturation') {
      // Ajustado para refletir a SpO2 Scale 1 da tabela
      return getRangeScore(value as number, [
        { max: 91, score: 3 },       // Correção: de 90 para 91
        { min: 92, max: 93, score: 2 }, // Correção: min de 91 para 92
        { min: 94, max: 95, score: 1 },
        { min: 96, score: 0 },
      ]);
    }
 
    if (field === 'systolicBp') {
      return getRangeScore(value as number, [
        { max: 90, score: 3 },
        { min: 91, max: 100, score: 2 },
        { min: 101, max: 110, score: 1 },
        { min: 111, max: 219, score: 0 },
        { min: 220, score: 3 },
      ]);
    }
 
    if (field === 'heartRate') {
      return getRangeScore(value as number, [
        { max: 40, score: 3 },
        { min: 41, max: 50, score: 1 },
        { min: 51, max: 90, score: 0 },
        { min: 91, max: 110, score: 1 },
        { min: 111, max: 130, score: 2 },
        { min: 131, score: 3 },
      ]);
    }
 
    if (field === 'temperature') {
      return getRangeScore(value as number, [
        { max: 35, score: 3 },
        { min: 35.1, max: 36, score: 1 }, // Correção: score de 0 para 1
        { min: 36.1, max: 38, score: 0 },
        { min: 38.1, max: 39, score: 1 },
        { min: 39.1, score: 2 },
      ]);
    }
 
    if (field === 'consciousness') {
      return getRangeScore((value as string) === 'A' ? 0 : 1, [
        { max: 0, score: 0 },
        { min: 1, score: 3 },
      ]);
    }
 
    if (field === 'oxygenSupplement') {
      return (value as boolean) ? 2 : 0;
    }
 
    return 0;
  }
 
  protected getSaps2FieldScore(field: keyof Saps2Values): number {
    const allValues = this.saps2Values();
    const value = allValues[field];

    if (field === 'age') {
      return getRangeScore(value as number, [
        { max: 39, score: 0 },
        { min: 40, max: 59, score: 7 },
        { min: 60, max: 69, score: 12 },
        { min: 70, max: 74, score: 15 },
        { min: 75, max: 79, score: 16 },
        { min: 80, score: 18 },
      ]);
    }

    if (field === 'heartRate') {
      return getRangeScore(value as number, [
        { max: 39, score: 11 },
        { min: 40, max: 69, score: 2 },
        { min: 70, max: 119, score: 0 },
        { min: 120, max: 159, score: 4 },
        { min: 160, score: 7 },
      ]);
    }

    if (field === 'systolicBp') {
      return getRangeScore(value as number, [
        { max: 69, score: 13 },
        { min: 70, max: 99, score: 5 },
        { min: 100, max: 199, score: 0 },
        { min: 200, score: 2 },
      ]);
    }

    if (field === 'temperature') {
      return getRangeScore(value as number, [
        { max: 37.5, score: 0 },
        { min: 39, score: 3 },
      ]);
    }

    if (field === 'gcs') {
      return getRangeScore(value as number, [
        { max: 5, score: 26 },
        { min: 6, max: 8, score: 13 },
        { min: 9, max: 10, score: 7 },
        { min: 11, max: 13, score: 5 },
        { min: 14, max: 15, score: 0 },
      ]);
    }

    if (field === 'mechanicalVentilation') {
      return 0; // A ventilação em si não soma pontos diretamente, mas habilita a PaO2/FiO2
    }

    if (field === 'pao2Fio2') {
      // Só pontua se o paciente estiver em ventilação mecânica
      if (!allValues.mechanicalVentilation) return 0;
      
      return getRangeScore(value as number, [
        { max: 99, score: 11 },
        { min: 100, max: 199, score: 9 },
        { min: 200, score: 0 },
      ]);
    }

    if (field === 'urineOutput') {
      return getRangeScore(value as number, [
        { max: 499, score: 11 },
        { min: 500, max: 999, score: 4 },
        { min: 1000, score: 0 },
      ]);
    }

    if (field === 'bun') {
      return getRangeScore(value as number, [
        { max: 27.9, score: 0 },
        { min: 28, max: 83.9, score: 6 },
        { min: 84, score: 10 },
      ]);
    }

    if (field === 'leukocytes') {
      return getRangeScore(value as number, [
        { max: 0.9, score: 12 },
        { min: 1, max: 19.9, score: 0 },
        { min: 20, score: 3 },
      ]);
    }

    if (field === 'sodium') {
      return getRangeScore(value as number, [
        { max: 124, score: 5 },
        { min: 125, max: 144, score: 0 },
        { min: 145, score: 1 },
      ]);
    }

    if (field === 'potassium') {
      return getRangeScore(value as number, [
        { max: 2.9, score: 3 },
        { min: 3, max: 4.9, score: 0 },
        { min: 5, score: 3 },
      ]);
    }

    if (field === 'bicarbonate') {
      return getRangeScore(value as number, [
        { max: 14.9, score: 6 },
        { min: 15, max: 19.9, score: 3 },
        { min: 20, score: 0 },
      ]);
    }

    if (field === 'bilirubin') {
      return getRangeScore(value as number, [
        { max: 3.9, score: 0 },
        { min: 4, max: 5.9, score: 4 },
        { min: 6, score: 9 },
      ]);
    }

    if (field === 'admissionType') {
      if (value === 'medical') return 6;
      if (value === 'unscheduledSurgical') return 8;
      return 0; // 'scheduledSurgical' pontua 0
    }

    if (field === 'metastaticCancer') {
      return (value as boolean) ? 9 : 0;
    }

    if (field === 'hematologicMalignancy') {
      return (value as boolean) ? 10 : 0;
    }

    if (field === 'aids') {
      return (value as boolean) ? 17 : 0;
    }

    return 0;
  }
 
  protected getNews2OptionScore(field: keyof News2Values, value: any): number {
    if (field === 'respiratoryRate') {
      return getRangeScore(value as number, [
        { max: 8, score: 3 },
        { min: 9, max: 11, score: 1 },
        { min: 12, max: 20, score: 0 },
        { min: 21, max: 24, score: 2 },
        { min: 25, score: 3 },
      ]);
    }
 
    if (field === 'oxygenSaturation') {
      return getRangeScore(value as number, [
        { max: 90, score: 3 },
        { min: 91, max: 93, score: 2 },
        { min: 94, max: 95, score: 1 },
        { min: 96, score: 0 },
      ]);
    }
 
    if (field === 'systolicBp') {
      return getRangeScore(value as number, [
        { max: 90, score: 3 },
        { min: 91, max: 100, score: 2 },
        { min: 101, max: 110, score: 1 },
        { min: 111, max: 219, score: 0 },
        { min: 220, score: 3 },
      ]);
    }
 
    if (field === 'heartRate') {
      return getRangeScore(value as number, [
        { max: 40, score: 3 },
        { min: 41, max: 50, score: 1 },
        { min: 51, max: 90, score: 0 },
        { min: 91, max: 110, score: 1 },
        { min: 111, max: 130, score: 2 },
        { min: 131, score: 3 },
      ]);
    }
 
    if (field === 'temperature') {
      return getRangeScore(value as number, [
        { max: 35, score: 1 },
        { min: 35.1, max: 36, score: 0 },
        { min: 36.1, max: 38, score: 0 },
        { min: 38.1, max: 39, score: 1 },
        { min: 39.1, score: 2 },
      ]);
    }
 
    if (field === 'consciousness') {
      return getRangeScore((value as string) === 'A' ? 0 : 1, [
        { max: 0, score: 0 },
        { min: 1, score: 3 },
      ]);
    }
 
    if (field === 'oxygenSupplement') {
      return (value as boolean) ? 2 : 0;
    }
 
    return 0;
  }
 
protected getSaps2OptionScore(field: keyof Saps2Values, value: any): number {
    if (field === 'age') {
      return getRangeScore(value as number, [
        { max: 39, score: 0 },
        { min: 40, max: 59, score: 7 },
        { min: 60, max: 69, score: 12 },
        { min: 70, max: 74, score: 15 },
        { min: 75, max: 79, score: 16 },
        { min: 80, score: 18 },
      ]);
    }

    if (field === 'heartRate') {
      return getRangeScore(value as number, [
        { max: 39, score: 11 },
        { min: 40, max: 69, score: 2 },
        { min: 70, max: 119, score: 0 },
        { min: 120, max: 159, score: 4 },
        { min: 160, score: 7 },
      ]);
    }

    if (field === 'systolicBp') {
      return getRangeScore(value as number, [
        { max: 69, score: 13 },
        { min: 70, max: 99, score: 5 },
        { min: 100, max: 199, score: 0 },
        { min: 200, score: 2 },
      ]);
    }

    if (field === 'temperature') {
      return getRangeScore(value as number, [
        { max: 37.5, score: 0 },
        { min: 39, score: 3 },
      ]);
    }

    if (field === 'gcs') {
      return getRangeScore(value as number, [
        { max: 5, score: 26 },
        { min: 6, max: 8, score: 13 },
        { min: 9, max: 10, score: 7 },
        { min: 11, max: 13, score: 5 },
        { min: 14, max: 15, score: 0 },
      ]);
    }

    if (field === 'mechanicalVentilation') {
      return 0; // A ventilação em si não pontua
    }

    if (field === 'pao2Fio2') {
      // Verifica se o paciente está em ventilação mecânica para poder pontuar
      if (!this.saps2Values().mechanicalVentilation) return 0;
      
      return getRangeScore(value as number, [
        { max: 99, score: 11 },
        { min: 100, max: 199, score: 9 },
        { min: 200, score: 0 },
      ]);
    }

    if (field === 'urineOutput') {
      return getRangeScore(value as number, [
        { max: 499, score: 11 },
        { min: 500, max: 999, score: 4 },
        { min: 1000, score: 0 },
      ]);
    }

    if (field === 'bun') {
      return getRangeScore(value as number, [
        { max: 27.9, score: 0 },
        { min: 28, max: 83.9, score: 6 },
        { min: 84, score: 10 },
      ]);
    }

    if (field === 'leukocytes') {
      return getRangeScore(value as number, [
        { max: 0.9, score: 12 },
        { min: 1, max: 19.9, score: 0 },
        { min: 20, score: 3 },
      ]);
    }

    if (field === 'sodium') {
      return getRangeScore(value as number, [
        { max: 124, score: 5 },
        { min: 125, max: 144, score: 0 },
        { min: 145, score: 1 },
      ]);
    }

    if (field === 'potassium') {
      return getRangeScore(value as number, [
        { max: 2.9, score: 3 },
        { min: 3, max: 4.9, score: 0 },
        { min: 5, score: 3 },
      ]);
    }

    if (field === 'bicarbonate') {
      return getRangeScore(value as number, [
        { max: 14.9, score: 6 },
        { min: 15, max: 19.9, score: 3 },
        { min: 20, score: 0 },
      ]);
    }

    if (field === 'bilirubin') {
      return getRangeScore(value as number, [
        { max: 3.9, score: 0 },
        { min: 4, max: 5.9, score: 4 },
        { min: 6, score: 9 },
      ]);
    }

    if (field === 'admissionType') {
      if (value === 'medical') return 6;
      if (value === 'unscheduledSurgical') return 8;
      return 0; // 'scheduledSurgical' pontua 0
    }

    if (field === 'metastaticCancer') {
      return (value as boolean) ? 9 : 0;
    }

    if (field === 'hematologicMalignancy') {
      return (value as boolean) ? 10 : 0;
    }

    if (field === 'aids') {
      return (value as boolean) ? 17 : 0;
    }

    return 0;
  }
}