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
  oxygenSaturation: number;
  pH: number;
  sodium: number;
  potassium: number;
  bicarbonate: number;
  bilirubin: number;
  creatinine: number;
  hematocrit: number;
  leukocytes: number;
  mechanicalVentilation: boolean;
  chronicDisease: boolean;
  cancer: boolean;
  dialysis: boolean;
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
  age: 35,
  heartRate: 95,
  systolicBp: 140,
  temperature: 37.2,
  gcs: 15,
  oxygenSaturation: 98,
  pH: 7.4,
  sodium: 140,
  potassium: 4.2,
  bicarbonate: 22,
  bilirubin: 3.5,
  creatinine: 0.9,
  hematocrit: 40,
  leukocytes: 12,
  mechanicalVentilation: false,
  chronicDisease: false,
  cancer: false,
  dialysis: false,
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
    { max: 35, score: 1 },
    { min: 35.1, max: 36, score: 0 },
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
    { min: 40, max: 59, score: 2 },
    { min: 60, max: 69, score: 3 },
    { min: 70, max: 74, score: 5 },
    { min: 75, max: 79, score: 6 },
    { min: 80, score: 7 },
  ]);

  total += getRangeScore(values.heartRate, [
    { max: 39, score: 4 },
    { min: 40, max: 54, score: 2 },
    { min: 55, max: 69, score: 0 },
    { min: 70, max: 119, score: 0 },
    { min: 120, max: 154, score: 2 },
    { min: 155, score: 4 },
  ]);

  total += getRangeScore(values.systolicBp, [
    { max: 69, score: 4 },
    { min: 70, max: 99, score: 2 },
    { min: 100, max: 119, score: 1 },
    { min: 120, max: 159, score: 0 },
    { min: 160, max: 179, score: 1 },
    { min: 180, score: 2 },
  ]);

  total += getRangeScore(values.temperature, [
    { max: 34.9, score: 4 },
    { min: 35, max: 35.9, score: 1 },
    { min: 36, max: 38.4, score: 0 },
    { min: 38.5, max: 38.9, score: 1 },
    { min: 39, score: 2 },
  ]);

  total += getRangeScore(values.gcs, [
    { max: 3, score: 26 },
    { min: 4, max: 5, score: 23 },
    { min: 6, max: 7, score: 14 },
    { min: 8, max: 10, score: 11 },
    { min: 11, max: 13, score: 5 },
    { min: 14, max: 15, score: 0 },
  ]);

  total += getRangeScore(values.oxygenSaturation, [
    { max: 89, score: 6 },
    { min: 90, max: 95, score: 3 },
    { min: 96, score: 0 },
  ]);

  total += getRangeScore(values.pH, [
    { max: 7.19, score: 10 },
    { min: 7.2, max: 7.24, score: 6 },
    { min: 7.25, max: 7.31, score: 3 },
    { min: 7.32, max: 7.49, score: 0 },
    { min: 7.5, max: 7.54, score: 1 },
    { min: 7.55, score: 3 },
  ]);

  total += getRangeScore(values.sodium, [
    { max: 124, score: 5 },
    { min: 125, max: 129, score: 3 },
    { min: 130, max: 149, score: 0 },
    { min: 150, max: 154, score: 1 },
    { min: 155, max: 159, score: 2 },
    { min: 160, score: 3 },
  ]);

  total += getRangeScore(values.potassium, [
    { max: 2.9, score: 3 },
    { min: 3, max: 3.4, score: 0 },
    { min: 3.5, max: 4.9, score: 0 },
    { min: 5, max: 5.4, score: 1 },
    { min: 5.5, max: 5.9, score: 2 },
    { min: 6, score: 3 },
  ]);

  total += getRangeScore(values.bicarbonate, [
    { max: 14, score: 6 },
    { min: 15, max: 19, score: 3 },
    { min: 20, max: 24, score: 0 },
    { min: 25, max: 29, score: 1 },
    { min: 30, max: 34, score: 2 },
    { min: 35, score: 4 },
  ]);

  total += getRangeScore(values.bilirubin, [
    { max: 3.9, score: 0 },
    { min: 4, max: 5.9, score: 2 },
    { min: 6, max: 7.9, score: 3 },
    { min: 8, score: 5 },
  ]);

  total += getRangeScore(values.creatinine, [
    { max: 0.5, score: 0 },
    { min: 0.6, max: 1.1, score: 0 },
    { min: 1.2, max: 1.9, score: 2 },
    { min: 2, max: 3.9, score: 3 },
    { min: 4, score: 6 },
  ]);

  total += getRangeScore(values.hematocrit, [
    { max: 19, score: 7 },
    { min: 20, max: 29, score: 1 },
    { min: 30, max: 49, score: 0 },
    { min: 50, score: 2 },
  ]);

  total += getRangeScore(values.leukocytes, [
    { max: 0.9, score: 4 },
    { min: 1, max: 4.9, score: 2 },
    { min: 5, max: 19.9, score: 0 },
    { min: 20, max: 29.9, score: 1 },
    { min: 30, score: 2 },
  ]);

  total += values.mechanicalVentilation ? 11 : 0;
  total += values.chronicDisease ? 6 : 0;
  total += values.cancer ? 9 : 0;
  total += values.dialysis ? 7 : 0;

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
  if (total <= 15) {
    return {
      total,
      label: 'Baixa gravidade',
      tone: 'low',
      guidance: 'Acompanhamento contínuo e reavaliação clínica de rotina.',
      estimate: 'Estimativa de mortalidade: ~2–5%',
    };
  }

  if (total <= 30) {
    return {
      total,
      label: 'Gravidade moderada',
      tone: 'medium',
      guidance: 'Monitorização intensiva e revisão clínica em curto prazo.',
      estimate: 'Estimativa de mortalidade: ~10–25%',
    };
  }

  if (total <= 45) {
    return {
      total,
      label: 'Gravidade alta',
      tone: 'high',
      guidance: 'Ajustar nível de cuidado e priorizar suporte terapêutico intensivo.',
      estimate: 'Estimativa de mortalidade: ~25–50%',
    };
  }

  return {
    total,
    label: 'Gravidade extrema',
    tone: 'critical',
    guidance: 'Atendimento crítico imediato com revisão multidisciplinar e suporte avançado.',
    estimate: 'Estimativa de mortalidade: >50%',
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
      { label: '≤ 90', value: 88, color: 'vermelho' }, // Score 3
      { label: '91–93', value: 92, color: 'laranja' }, // Score 2
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
        { label: '≤ 39', value: 35, color: 'verde' },
        { label: '40–59', value: 50, color: 'amarelo' },
        { label: '60–69', value: 65, color: 'laranja' },
        { label: '70–74', value: 72, color: 'vermelho' },
        { label: '75–79', value: 77, color: 'vermelho-escuro' },
        { label: '≥ 80', value: 82, color: 'vermelho-escuro' },
      ],
      heartRate: [
        { label: '≤ 39', value: 35, color: 'vermelho' },
        { label: '40–54', value: 47, color: 'laranja' },
        { label: '55–69', value: 62, color: 'amarelo' },
        { label: '70–119', value: 95, color: 'verde' },
        { label: '120–154', value: 138, color: 'laranja' },
        { label: '≥ 155', value: 160, color: 'vermelho' },
      ],
      systolicBp: [
        { label: '≤ 69', value: 65, color: 'vermelho-escuro' },
        { label: '70–99', value: 85, color: 'laranja' },
        { label: '100–119', value: 110, color: 'verde' },
        { label: '120–159', value: 140, color: 'verde' },
        { label: '160–179', value: 170, color: 'amarelo' },
        { label: '≥ 180', value: 185, color: 'vermelho' },
      ],
      temperature: [
        { label: '≤ 34.9', value: 34.5, color: 'vermelho' },
        { label: '35–35.9', value: 35.5, color: 'amarelo' },
        { label: '36–38.4', value: 37.2, color: 'verde' },
        { label: '38.5–38.9', value: 38.7, color: 'amarelo' },
        { label: '≥ 39', value: 39.5, color: 'vermelho' },
      ],
      gcs: [
        { label: '3', value: 3, color: 'vermelho-escuro' },
        { label: '4–5', value: 5, color: 'vermelho-escuro' },
        { label: '6–7', value: 7, color: 'vermelho' },
        { label: '8–10', value: 9, color: 'laranja' },
        { label: '11–13', value: 12, color: 'amarelo' },
        { label: '14–15', value: 15, color: 'verde' },
      ],
      oxygenSaturation: [
        { label: '≤ 89', value: 88, color: 'vermelho' },
        { label: '90–95', value: 92, color: 'amarelo' },
        { label: '≥ 96', value: 98, color: 'verde' },
      ],
      pH: [
        { label: '≤ 7.19', value: 7.18, color: 'vermelho' },
        { label: '7.20–7.24', value: 7.22, color: 'laranja' },
        { label: '7.25–7.31', value: 7.28, color: 'amarelo' },
        { label: '7.32–7.49', value: 7.4, color: 'verde' },
        { label: '7.50–7.54', value: 7.52, color: 'amarelo' },
        { label: '≥ 7.55', value: 7.6, color: 'vermelho' },
      ],
      sodium: [
        { label: '≤ 124', value: 122, color: 'vermelho' },
        { label: '125–129', value: 127, color: 'amarelo' },
        { label: '130–149', value: 140, color: 'verde' },
        { label: '150–154', value: 152, color: 'amarelo' },
        { label: '155–159', value: 157, color: 'laranja' },
        { label: '≥ 160', value: 162, color: 'vermelho' },
      ],
      potassium: [
        { label: '≤ 2.9', value: 2.8, color: 'vermelho' },
        { label: '3.0–3.4', value: 3.2, color: 'amarelo' },
        { label: '3.5–4.9', value: 4.2, color: 'verde' },
        { label: '5.0–5.4', value: 5.2, color: 'amarelo' },
        { label: '5.5–5.9', value: 5.7, color: 'laranja' },
        { label: '≥ 6.0', value: 6.2, color: 'vermelho' },
      ],
      bicarbonate: [
        { label: '≤ 14', value: 13, color: 'vermelho' },
        { label: '15–19', value: 17, color: 'amarelo' },
        { label: '20–24', value: 22, color: 'verde' },
        { label: '25–29', value: 27, color: 'verde' },
        { label: '30–34', value: 32, color: 'amarelo' },
        { label: '≥ 35', value: 36, color: 'vermelho' },
      ],
      bilirubin: [
        { label: '≤ 3.9', value: 3.5, color: 'verde' },
        { label: '4.0–5.9', value: 5, color: 'amarelo' },
        { label: '6.0–7.9', value: 7, color: 'laranja' },
        { label: '≥ 8', value: 9, color: 'vermelho' },
      ],
      creatinine: [
        { label: '≤ 0.5', value: 0.4, color: 'verde' },
        { label: '0.6–1.1', value: 0.9, color: 'verde' },
        { label: '1.2–1.9', value: 1.5, color: 'amarelo' },
        { label: '2.0–3.9', value: 3, color: 'laranja' },
        { label: '≥ 4', value: 5, color: 'vermelho' },
      ],
      hematocrit: [
        { label: '≤ 19', value: 18, color: 'vermelho' },
        { label: '20–29', value: 25, color: 'laranja' },
        { label: '30–49', value: 40, color: 'verde' },
        { label: '≥ 50', value: 55, color: 'amarelo' },
      ],
      leukocytes: [
        { label: '≤ 0.9', value: 0.8, color: 'vermelho' },
        { label: '1.0–4.9', value: 3, color: 'amarelo' },
        { label: '5.0–19.9', value: 12, color: 'verde' },
        { label: '20–29.9', value: 24, color: 'laranja' },
        { label: '≥ 30', value: 32, color: 'vermelho' },
      ],
      mechanicalVentilation: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho' },
      ],
      chronicDisease: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho' },
      ],
      cancer: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho' },
      ],
      dialysis: [
        { label: 'Não', value: false, color: 'verde' },
        { label: 'Sim', value: true, color: 'vermelho' },
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
    const value = this.saps2Values()[field];

    if (field === 'age') {
      return getRangeScore(value as number, [
        { max: 39, score: 0 },
        { min: 40, max: 59, score: 2 },
        { min: 60, max: 69, score: 3 },
        { min: 70, max: 74, score: 5 },
        { min: 75, max: 79, score: 6 },
        { min: 80, score: 7 },
      ]);
    }

    if (field === 'heartRate') {
      return getRangeScore(value as number, [
        { max: 39, score: 4 },
        { min: 40, max: 54, score: 2 },
        { min: 55, max: 69, score: 0 },
        { min: 70, max: 119, score: 0 },
        { min: 120, max: 154, score: 2 },
        { min: 155, score: 4 },
      ]);
    }

    if (field === 'systolicBp') {
      return getRangeScore(value as number, [
        { max: 69, score: 4 },
        { min: 70, max: 99, score: 2 },
        { min: 100, max: 119, score: 1 },
        { min: 120, max: 159, score: 0 },
        { min: 160, max: 179, score: 1 },
        { min: 180, score: 2 },
      ]);
    }

    if (field === 'temperature') {
      return getRangeScore(value as number, [
        { max: 34.9, score: 4 },
        { min: 35, max: 35.9, score: 1 },
        { min: 36, max: 38.4, score: 0 },
        { min: 38.5, max: 38.9, score: 1 },
        { min: 39, score: 2 },
      ]);
    }

    if (field === 'gcs') {
      return getRangeScore(value as number, [
        { max: 3, score: 26 },
        { min: 4, max: 5, score: 23 },
        { min: 6, max: 7, score: 14 },
        { min: 8, max: 10, score: 11 },
        { min: 11, max: 13, score: 5 },
        { min: 14, max: 15, score: 0 },
      ]);
    }

    if (field === 'oxygenSaturation') {
      return getRangeScore(value as number, [
        { max: 89, score: 6 },
        { min: 90, max: 95, score: 3 },
        { min: 96, score: 0 },
      ]);
    }

    if (field === 'pH') {
      return getRangeScore(value as number, [
        { max: 7.19, score: 10 },
        { min: 7.2, max: 7.24, score: 6 },
        { min: 7.25, max: 7.31, score: 3 },
        { min: 7.32, max: 7.49, score: 0 },
        { min: 7.5, max: 7.54, score: 1 },
        { min: 7.55, score: 3 },
      ]);
    }

    if (field === 'sodium') {
      return getRangeScore(value as number, [
        { max: 124, score: 5 },
        { min: 125, max: 129, score: 3 },
        { min: 130, max: 149, score: 0 },
        { min: 150, max: 154, score: 1 },
        { min: 155, max: 159, score: 2 },
        { min: 160, score: 3 },
      ]);
    }

    if (field === 'potassium') {
      return getRangeScore(value as number, [
        { max: 2.9, score: 3 },
        { min: 3, max: 3.4, score: 0 },
        { min: 3.5, max: 4.9, score: 0 },
        { min: 5, max: 5.4, score: 1 },
        { min: 5.5, max: 5.9, score: 2 },
        { min: 6, score: 3 },
      ]);
    }

    if (field === 'bicarbonate') {
      return getRangeScore(value as number, [
        { max: 14, score: 6 },
        { min: 15, max: 19, score: 3 },
        { min: 20, max: 24, score: 0 },
        { min: 25, max: 29, score: 1 },
        { min: 30, max: 34, score: 2 },
        { min: 35, score: 4 },
      ]);
    }

    if (field === 'bilirubin') {
      return getRangeScore(value as number, [
        { max: 3.9, score: 0 },
        { min: 4, max: 5.9, score: 2 },
        { min: 6, max: 7.9, score: 3 },
        { min: 8, score: 5 },
      ]);
    }

    if (field === 'creatinine') {
      return getRangeScore(value as number, [
        { max: 0.5, score: 0 },
        { min: 0.6, max: 1.1, score: 0 },
        { min: 1.2, max: 1.9, score: 2 },
        { min: 2, max: 3.9, score: 3 },
        { min: 4, score: 6 },
      ]);
    }

    if (field === 'hematocrit') {
      return getRangeScore(value as number, [
        { max: 19, score: 7 },
        { min: 20, max: 29, score: 1 },
        { min: 30, max: 49, score: 0 },
        { min: 50, score: 2 },
      ]);
    }

    if (field === 'leukocytes') {
      return getRangeScore(value as number, [
        { max: 0.9, score: 4 },
        { min: 1, max: 4.9, score: 2 },
        { min: 5, max: 19.9, score: 0 },
        { min: 20, max: 29.9, score: 1 },
        { min: 30, score: 2 },
      ]);
    }

    if (field === 'mechanicalVentilation') {
      return (value as boolean) ? 11 : 0;
    }

    if (field === 'chronicDisease') {
      return (value as boolean) ? 6 : 0;
    }

    if (field === 'cancer') {
      return (value as boolean) ? 9 : 0;
    }

    if (field === 'dialysis') {
      return (value as boolean) ? 7 : 0;
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
        { min: 40, max: 59, score: 2 },
        { min: 60, max: 69, score: 3 },
        { min: 70, max: 74, score: 5 },
        { min: 75, max: 79, score: 6 },
        { min: 80, score: 7 },
      ]);
    }

    if (field === 'heartRate') {
      return getRangeScore(value as number, [
        { max: 39, score: 4 },
        { min: 40, max: 54, score: 2 },
        { min: 55, max: 69, score: 0 },
        { min: 70, max: 119, score: 0 },
        { min: 120, max: 154, score: 2 },
        { min: 155, score: 4 },
      ]);
    }

    if (field === 'systolicBp') {
      return getRangeScore(value as number, [
        { max: 69, score: 4 },
        { min: 70, max: 99, score: 2 },
        { min: 100, max: 119, score: 1 },
        { min: 120, max: 159, score: 0 },
        { min: 160, max: 179, score: 1 },
        { min: 180, score: 2 },
      ]);
    }

    if (field === 'temperature') {
      return getRangeScore(value as number, [
        { max: 34.9, score: 4 },
        { min: 35, max: 35.9, score: 1 },
        { min: 36, max: 38.4, score: 0 },
        { min: 38.5, max: 38.9, score: 1 },
        { min: 39, score: 2 },
      ]);
    }

    if (field === 'gcs') {
      return getRangeScore(value as number, [
        { max: 3, score: 26 },
        { min: 4, max: 5, score: 23 },
        { min: 6, max: 7, score: 14 },
        { min: 8, max: 10, score: 11 },
        { min: 11, max: 13, score: 5 },
        { min: 14, max: 15, score: 0 },
      ]);
    }

    if (field === 'oxygenSaturation') {
      return getRangeScore(value as number, [
        { max: 89, score: 6 },
        { min: 90, max: 95, score: 3 },
        { min: 96, score: 0 },
      ]);
    }

    if (field === 'pH') {
      return getRangeScore(value as number, [
        { max: 7.19, score: 10 },
        { min: 7.2, max: 7.24, score: 6 },
        { min: 7.25, max: 7.31, score: 3 },
        { min: 7.32, max: 7.49, score: 0 },
        { min: 7.5, max: 7.54, score: 1 },
        { min: 7.55, score: 3 },
      ]);
    }

    if (field === 'sodium') {
      return getRangeScore(value as number, [
        { max: 124, score: 5 },
        { min: 125, max: 129, score: 3 },
        { min: 130, max: 149, score: 0 },
        { min: 150, max: 154, score: 1 },
        { min: 155, max: 159, score: 2 },
        { min: 160, score: 3 },
      ]);
    }

    if (field === 'potassium') {
      return getRangeScore(value as number, [
        { max: 2.9, score: 3 },
        { min: 3, max: 3.4, score: 0 },
        { min: 3.5, max: 4.9, score: 0 },
        { min: 5, max: 5.4, score: 1 },
        { min: 5.5, max: 5.9, score: 2 },
        { min: 6, score: 3 },
      ]);
    }

    if (field === 'bicarbonate') {
      return getRangeScore(value as number, [
        { max: 14, score: 6 },
        { min: 15, max: 19, score: 3 },
        { min: 20, max: 24, score: 0 },
        { min: 25, max: 29, score: 1 },
        { min: 30, max: 34, score: 2 },
        { min: 35, score: 4 },
      ]);
    }

    if (field === 'bilirubin') {
      return getRangeScore(value as number, [
        { max: 3.9, score: 0 },
        { min: 4, max: 5.9, score: 2 },
        { min: 6, max: 7.9, score: 3 },
        { min: 8, score: 5 },
      ]);
    }

    if (field === 'creatinine') {
      return getRangeScore(value as number, [
        { max: 0.5, score: 0 },
        { min: 0.6, max: 1.1, score: 0 },
        { min: 1.2, max: 1.9, score: 2 },
        { min: 2, max: 3.9, score: 3 },
        { min: 4, score: 6 },
      ]);
    }

    if (field === 'hematocrit') {
      return getRangeScore(value as number, [
        { max: 19, score: 7 },
        { min: 20, max: 29, score: 1 },
        { min: 30, max: 49, score: 0 },
        { min: 50, score: 2 },
      ]);
    }

    if (field === 'leukocytes') {
      return getRangeScore(value as number, [
        { max: 0.9, score: 4 },
        { min: 1, max: 4.9, score: 2 },
        { min: 5, max: 19.9, score: 0 },
        { min: 20, max: 29.9, score: 1 },
        { min: 30, score: 2 },
      ]);
    }

    if (field === 'mechanicalVentilation') {
      return (value as boolean) ? 11 : 0;
    }

    if (field === 'chronicDisease') {
      return (value as boolean) ? 6 : 0;
    }

    if (field === 'cancer') {
      return (value as boolean) ? 9 : 0;
    }

    if (field === 'dialysis') {
      return (value as boolean) ? 7 : 0;
    }

    return 0;
  }
}
