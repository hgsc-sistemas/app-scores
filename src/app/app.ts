import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { HospitalPresentation } from './hospital-presentation/hospital-presentation';
import { HospitalBanner } from './hospital-banner/hospital-banner';

/* ============================================================================
 * TYPES
 * ========================================================================== */

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
  admissionType:
    | 'scheduledSurgical'
    | 'medical'
    | 'unscheduledSurgical';
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
  color: string;
}


interface ScoreRange {
  min?: number;
  max?: number;
  score: number;
}

/* ============================================================================
 * SCORE RULES
 *
 * Centralized source of truth.
 * If a medical scoring rule changes, change it here.
 * ========================================================================== */

/* ---------------------------------------------------------------------------
 * NEWS2
 * ------------------------------------------------------------------------- */

const NEWS2_RULES = {
  respiratoryRate: [
    { max: 8, score: 3 },
    { min: 9, max: 11, score: 1 },
    { min: 12, max: 20, score: 0 },
    { min: 21, max: 24, score: 2 },
    { min: 25, score: 3 },
  ],

  oxygenSaturation: [
    { max: 91, score: 3 },
    { min: 92, max: 93, score: 2 },
    { min: 94, max: 95, score: 1 },
    { min: 96, score: 0 },
  ],

  systolicBp: [
    { max: 90, score: 3 },
    { min: 91, max: 100, score: 2 },
    { min: 101, max: 110, score: 1 },
    { min: 111, max: 219, score: 0 },
    { min: 220, score: 3 },
  ],

  heartRate: [
    { max: 40, score: 3 },
    { min: 41, max: 50, score: 1 },
    { min: 51, max: 90, score: 0 },
    { min: 91, max: 110, score: 1 },
    { min: 111, max: 130, score: 2 },
    { min: 131, score: 3 },
  ],

  temperature: [
    { max: 35, score: 3 },
    { min: 35.1, max: 36, score: 1 },
    { min: 36.1, max: 38, score: 0 },
    { min: 38.1, max: 39, score: 1 },
    { min: 39.1, score: 2 },
  ],
} satisfies Record<
  'respiratoryRate'
  | 'oxygenSaturation'
  | 'systolicBp'
  | 'heartRate'
  | 'temperature',
  readonly ScoreRange[]
>;

/* ---------------------------------------------------------------------------
 * SAPS II
 * ------------------------------------------------------------------------- */

const SAPS2_RULES = {
  age: [
    { max: 39, score: 0 },
    { min: 40, max: 59, score: 7 },
    { min: 60, max: 69, score: 12 },
    { min: 70, max: 74, score: 15 },
    { min: 75, max: 79, score: 16 },
    { min: 80, score: 18 },
  ],

  heartRate: [
    { max: 39, score: 11 },
    { min: 40, max: 69, score: 2 },
    { min: 70, max: 119, score: 0 },
    { min: 120, max: 159, score: 4 },
    { min: 160, score: 7 },
  ],

  systolicBp: [
    { max: 69, score: 13 },
    { min: 70, max: 99, score: 5 },
    { min: 100, max: 199, score: 0 },
    { min: 200, score: 2 },
  ],

  temperature: [
    { max: 38.9, score: 0 },
    { min: 39, score: 3 },
  ],

  gcs: [
    { max: 5, score: 26 },
    { min: 6, max: 8, score: 13 },
    { min: 9, max: 10, score: 7 },
    { min: 11, max: 13, score: 5 },
    { min: 14, max: 15, score: 0 },
  ],

  pao2Fio2: [
    { max: 99, score: 11 },
    { min: 100, max: 199, score: 9 },
    { min: 200, score: 6 },
  ],

  urineOutput: [
    { max: 499, score: 11 },
    { min: 500, max: 999, score: 4 },
    { min: 1000, score: 0 },
  ],

  bun: [
    { max: 27.9, score: 0 },
    { min: 28, max: 83.9, score: 6 },
    { min: 84, score: 10 },
  ],

  leukocytes: [
    { max: 0.9, score: 12 },
    { min: 1, max: 19.9, score: 0 },
    { min: 20, score: 3 },
  ],

  sodium: [
    { max: 124, score: 5 },
    { min: 125, max: 144, score: 0 },
    { min: 145, score: 1 },
  ],

  potassium: [
    { max: 2.9, score: 3 },
    { min: 3, max: 4.9, score: 0 },
    { min: 5, score: 3 },
  ],

  bicarbonate: [
    { max: 14.9, score: 6 },
    { min: 15, max: 19.9, score: 3 },
    { min: 20, score: 0 },
  ],

  bilirubin: [
    { max: 3.9, score: 0 },
    { min: 4, max: 5.9, score: 4 },
    { min: 6, score: 9 },
  ],
} satisfies Record<
  | 'age'
  | 'heartRate'
  | 'systolicBp'
  | 'temperature'
  | 'gcs'
  | 'pao2Fio2'
  | 'urineOutput'
  | 'bun'
  | 'leukocytes'
  | 'sodium'
  | 'potassium'
  | 'bicarbonate'
  | 'bilirubin',
  readonly ScoreRange[]
>;

/* ============================================================================
 * DEFAULT VALUES
 * ========================================================================== */

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
  temperature: 37.5,
  gcs: 15,

  sodium: 140,
  potassium: 4.2,
  bicarbonate: 22,
  bilirubin: 3.5,
  leukocytes: 12,

  mechanicalVentilation: false,
  pao2Fio2: 400,
  urineOutput: 1500,
  bun: 15,

  admissionType: 'scheduledSurgical',

  metastaticCancer: false,
  hematologicMalignancy: false,
  aids: false,
};

/* ============================================================================
 * GENERIC HELPERS
 * ========================================================================== */

function getRangeScore(
  value: number,
  ranges: readonly ScoreRange[],
): number {
  return (
    ranges.find((range) => {
      const meetsMin = range.min === undefined || value >= range.min;
      const meetsMax = range.max === undefined || value <= range.max;

      return meetsMin && meetsMax;
    })?.score ?? 0
  );
}

function getBooleanScore(
  value: boolean,
  scoreWhenTrue: number,
): number {
  return value ? scoreWhenTrue : 0;
}

/* ============================================================================
 * NEWS2 SCORE CALCULATION
 * ========================================================================== */

export function calculateNews2Score(values: News2Values): number {
  const scores = [
    getRangeScore(
      values.respiratoryRate,
      NEWS2_RULES.respiratoryRate,
    ),

    getRangeScore(
      values.oxygenSaturation,
      NEWS2_RULES.oxygenSaturation,
    ),

    getRangeScore(
      values.systolicBp,
      NEWS2_RULES.systolicBp,
    ),

    getRangeScore(
      values.heartRate,
      NEWS2_RULES.heartRate,
    ),

    getRangeScore(
      values.temperature,
      NEWS2_RULES.temperature,
    ),

    getConsciousnessScore(values.consciousness),

    getBooleanScore(values.oxygenSupplement, 2),
  ];

  return sumScores(scores);
}

function getConsciousnessScore(
  consciousness: News2Values['consciousness'],
): number {
  return consciousness === 'A' ? 0 : 3;
}

/* ============================================================================
 * SAPS II SCORE CALCULATION
 * ========================================================================== */

export function calculateSaps2Score(values: Saps2Values): number {
  const physiologicalScore = calculateSaps2PhysiologicalScore(values);
  const admissionScore = getSaps2AdmissionScore(values.admissionType);
  const comorbidityScore = getSaps2ComorbidityScore(values);

  return physiologicalScore + admissionScore + comorbidityScore;
}

function calculateSaps2PhysiologicalScore(
  values: Saps2Values,
): number {
  const scores = [
    getRangeScore(values.age, SAPS2_RULES.age),

    getRangeScore(
      values.heartRate,
      SAPS2_RULES.heartRate,
    ),

    getRangeScore(
      values.systolicBp,
      SAPS2_RULES.systolicBp,
    ),

    getRangeScore(
      values.temperature,
      SAPS2_RULES.temperature,
    ),

    getRangeScore(
      values.gcs,
      SAPS2_RULES.gcs,
    ),

    getSaps2OxygenationScore(values),

    getRangeScore(
      values.urineOutput,
      SAPS2_RULES.urineOutput,
    ),

    getRangeScore(
      values.bun,
      SAPS2_RULES.bun,
    ),

    getRangeScore(
      values.leukocytes,
      SAPS2_RULES.leukocytes,
    ),

    getRangeScore(
      values.sodium,
      SAPS2_RULES.sodium,
    ),

    getRangeScore(
      values.potassium,
      SAPS2_RULES.potassium,
    ),

    getRangeScore(
      values.bicarbonate,
      SAPS2_RULES.bicarbonate,
    ),

    getRangeScore(
      values.bilirubin,
      SAPS2_RULES.bilirubin,
    ),
  ];

  return sumScores(scores);
}

function getSaps2OxygenationScore(
  values: Saps2Values,
): number {
  if (!values.mechanicalVentilation) {
    return 0;
  }

  return getRangeScore(
    values.pao2Fio2,
    SAPS2_RULES.pao2Fio2,
  );
}

function getSaps2AdmissionScore(
  admissionType: Saps2Values['admissionType'],
): number {
  switch (admissionType) {
    case 'medical':
      return 6;

    case 'unscheduledSurgical':
      return 8;

    case 'scheduledSurgical':
    default:
      return 0;
  }
}

function getSaps2ComorbidityScore(
  values: Saps2Values,
): number {
  return sumScores([
    getBooleanScore(values.metastaticCancer, 9),
    getBooleanScore(values.hematologicMalignancy, 10),
    getBooleanScore(values.aids, 17),
  ]);
}

function sumScores(scores: readonly number[]): number {
  return scores.reduce((total, score) => total + score, 0);
}

/* ============================================================================
 * NEWS2 SUMMARY
 * ========================================================================== */

export function summarizeNews2(
  total: number,
): ScoreResult {
  if (total <= 4) {
    return {
      total,
      label: 'Baixo risco',
      tone: 'low',
      guidance:
        'Monitorizar e repetir avaliação em até 12 horas.',
      estimate: 'Observação clínica regular',
    };
  }

  if (total <= 6) {
    return {
      total,
      label: 'Risco moderado',
      tone: 'medium',
      guidance:
        'Reavaliação em 1 hora e aumento da frequência de monitorização.',
      estimate: 'Sinais de alerta em progressão',
    };
  }

  if (total <= 8) {
    return {
      total,
      label: 'Risco alto',
      tone: 'high',
      guidance:
        'Ativar suporte imediato do médico responsável e considerar elevação de nível de cuidado.',
      estimate: 'Necessita atenção urgente',
    };
  }

  return {
    total,
    label: 'Risco crítico',
    tone: 'critical',
    guidance:
      'Avaliação urgente e resposta de emergência; priorizar intervenção e suporte avançado.',
    estimate: 'Potencial deterioração rápida',
  };
}

/* ============================================================================
 * SAPS II SUMMARY
 * ========================================================================== */

export function summarizeSaps2(
  total: number,
): ScoreResult {
  const mortalityPercent = calculateSaps2Mortality(total);
  const estimate = `Estimativa de mortalidade: ${mortalityPercent}%`;

  if (total <= 29) {
    return {
      total,
      label: 'Baixa gravidade',
      tone: 'low',
      guidance:
        'Acompanhamento contínuo e reavaliação clínica de rotina.',
      estimate,
    };
  }

  if (total <= 40) {
    return {
      total,
      label: 'Gravidade moderada',
      tone: 'medium',
      guidance:
        'Monitorização intensiva e revisão clínica em curto prazo.',
      estimate,
    };
  }

  if (total <= 52) {
    return {
      total,
      label: 'Gravidade alta',
      tone: 'high',
      guidance:
        'Ajustar nível de cuidado e priorizar suporte terapêutico intensivo.',
      estimate,
    };
  }

  return {
    total,
    label: 'Gravidade extrema',
    tone: 'critical',
    guidance:
      'Atendimento crítico imediato com revisão multidisciplinar e suporte avançado.',
    estimate,
  };
}

function calculateSaps2Mortality(
  total: number,
): string {
  const logit =
    -7.7631 +
    0.0737 * total +
    0.9971 * Math.log(total + 1);

  const probability =
    Math.exp(logit) /
    (1 + Math.exp(logit));

  return (probability * 100).toFixed(1);
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HospitalPresentation, HospitalBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /* ==========================================================================
   * PRESENTATION STATE
   * ======================================================================== */

  public readonly showPresentation = signal<boolean>(true);
  public readonly presentationMode = signal<'onboarding' | 'free'>('onboarding');

  public closePresentation(): void {
    this.showPresentation.set(false);
  }

  public openPresentation(): void {
    this.presentationMode.set('free');
    this.showPresentation.set(true);
  }

  /* ==========================================================================
   * CLINICAL SCORE STATE
   * ======================================================================== */
  protected readonly selectedScore =
    signal<ScoreType>('news2');

  protected readonly news2Values =
    signal<News2Values>(NEWS2_DEFAULT);

  protected readonly saps2Values =
    signal<Saps2Values>(SAPS2_DEFAULT);

  protected readonly news2Result = computed(() =>
    summarizeNews2(
      calculateNews2Score(
        this.news2Values(),
      ),
    ),
  );

  protected readonly saps2Result = computed(() =>
    summarizeSaps2(
      calculateSaps2Score(
        this.saps2Values(),
      ),
    ),
  );

  protected readonly scoreOptions = [
    {
      key: 'news2' as const,
      label: 'Enfermaria • NEWS2',
    },
    {
      key: 'saps2' as const,
      label: 'UTI • SAPS 2',
    },
  ];

  /* ==========================================================================
   * NEWS2 OPTIONS
   * ======================================================================== */

  protected readonly news2FieldOptions = {
    respiratoryRate: [
      {
        label: '≤ 8',
        value: 8,
        color: 'vermelho',
      },
      {
        label: '9–11',
        value: 10,
        color: 'amarelo',
      },
      {
        label: '12–20',
        value: 16,
        color: 'verde',
      },
      {
        label: '21–24',
        value: 22,
        color: 'laranja',
      },
      {
        label: '≥ 25',
        value: 25,
        color: 'vermelho',
      },
    ],

    oxygenSaturation: [
      {
        label: '≤ 91',
        value: 91,
        color: 'vermelho',
      },
      {
        label: '92–93',
        value: 92,
        color: 'laranja',
      },
      {
        label: '94–95',
        value: 95,
        color: 'amarelo',
      },
      {
        label: '≥ 96',
        value: 96,
        color: 'verde',
      },
    ],

    systolicBp: [
      {
        label: '≤ 90',
        value: 88,
        color: 'vermelho',
      },
      {
        label: '91–100',
        value: 95,
        color: 'laranja',
      },
      {
        label: '101–110',
        value: 105,
        color: 'amarelo',
      },
      {
        label: '111–219',
        value: 150,
        color: 'verde',
      },
      {
        label: '≥ 220',
        value: 220,
        color: 'vermelho',
      },
    ],

    heartRate: [
      {
        label: '≤ 40',
        value: 38,
        color: 'vermelho',
      },
      {
        label: '41–50',
        value: 45,
        color: 'amarelo',
      },
      {
        label: '51–90',
        value: 70,
        color: 'verde',
      },
      {
        label: '91–110',
        value: 100,
        color: 'amarelo',
      },
      {
        label: '111–130',
        value: 120,
        color: 'laranja',
      },
      {
        label: '≥ 131',
        value: 135,
        color: 'vermelho',
      },
    ],

    temperature: [
      {
        label: '≤ 35',
        value: 34.9,
        color: 'vermelho',
      },
      {
        label: '35.1–36',
        value: 35.5,
        color: 'amarelo',
      },
      {
        label: '36.1–38',
        value: 37,
        color: 'verde',
      },
      {
        label: '38.1–39',
        value: 38.5,
        color: 'amarelo',
      },
      {
        label: '≥ 39.1',
        value: 39.5,
        color: 'laranja',
      },
    ],

    consciousness: [
      {
        label: 'A',
        value: 'A',
        color: 'verde',
      },
      {
        label: 'V',
        value: 'V',
        color: 'vermelho',
      },
      {
        label: 'P',
        value: 'P',
        color: 'vermelho-escuro',
      },
      {
        label: 'U',
        value: 'U',
        color: 'vermelho-escuro',
      },
    ],

    oxygenSupplement: [
      {
        label: 'Não',
        value: false,
        color: 'verde',
      },
      {
        label: 'Sim',
        value: true,
        color: 'laranja',
      },
    ],
  } as const;

  /* ==========================================================================
   * SAPS2 OPTIONS
   * ======================================================================== */

  protected readonly saps2FieldOptions = {
    age: [
      {
        label: '≤ 39',
        value: 35,
        color: 'verde',
      },
      {
        label: '40–59',
        value: 50,
        color: 'amarelo',
      },
      {
        label: '60–69',
        value: 65,
        color: 'laranja',
      },
      {
        label: '70–74',
        value: 72,
        color: 'vermelho',
      },
      {
        label: '75–79',
        value: 77,
        color: 'vermelho-escuro',
      },
      {
        label: '≥ 80',
        value: 82,
        color: 'vermelho-escuro',
      },
    ],

    heartRate: [
      {
        label: '≤ 39',
        value: 35,
        color: 'vermelho',
      },
      {
        label: '40–69',
        value: 55,
        color: 'amarelo',
      },
      {
        label: '70–119',
        value: 95,
        color: 'verde',
      },
      {
        label: '120–159',
        value: 140,
        color: 'amarelo',
      },
      {
        label: '≥ 160',
        value: 165,
        color: 'laranja',
      },
    ],

    systolicBp: [
      {
        label: '≤ 69',
        value: 65,
        color: 'vermelho',
      },
      {
        label: '70–99',
        value: 85,
        color: 'laranja',
      },
      {
        label: '100–199',
        value: 140,
        color: 'verde',
      },
      {
        label: '≥ 200',
        value: 210,
        color: 'amarelo',
      },
    ],

    temperature: [
      {
        label: '< 39.0',
        value: 37.5,
        color: 'verde',
      },
      {
        label: '≥ 39.0',
        value: 39.5,
        color: 'amarelo',
      },
    ],

    gcs: [
      {
        label: '3–5',
        value: 4,
        color: 'vermelho-escuro',
      },
      {
        label: '6–8',
        value: 7,
        color: 'vermelho',
      },
      {
        label: '9–10',
        value: 9,
        color: 'laranja',
      },
      {
        label: '11–13',
        value: 12,
        color: 'laranja',
      },
      {
        label: '14–15',
        value: 15,
        color: 'verde',
      },
    ],

    mechanicalVentilation: [
      {
        label: 'Não',
        value: false,
        color: 'verde',
      },
      {
        label: 'Sim',
        value: true,
        color: 'amarelo',
      },
    ],

    pao2Fio2: [
      {
        label: '≥ 200',
        value: 400,
        color: 'amarelo',
      },
      {
        label: '100–199',
        value: 150,
        color: 'laranja',
      },
      {
        label: '< 100',
        value: 80,
        color: 'vermelho',
      },
    ],

    urineOutput: [
      {
        label: '≥ 1000',
        value: 1500,
        color: 'verde',
      },
      {
        label: '500–999',
        value: 750,
        color: 'amarelo',
      },
      {
        label: '< 500',
        value: 300,
        color: 'vermelho',
      },
    ],

    bun: [
      {
        label: '< 28',
        value: 15,
        color: 'verde',
      },
      {
        label: '28–83',
        value: 50,
        color: 'laranja',
      },
      {
        label: '≥ 84',
        value: 90,
        color: 'vermelho',
      },
    ],

    leukocytes: [
      {
        label: '< 1.0',
        value: 0.8,
        color: 'vermelho',
      },
      {
        label: '1.0–19.9',
        value: 12,
        color: 'verde',
      },
      {
        label: '≥ 20.0',
        value: 25,
        color: 'amarelo',
      },
    ],

    sodium: [
      {
        label: '< 125',
        value: 120,
        color: 'laranja',
      },
      {
        label: '125–144',
        value: 140,
        color: 'verde',
      },
      {
        label: '≥ 145',
        value: 150,
        color: 'amarelo',
      },
    ],

    potassium: [
      {
        label: '< 3.0',
        value: 2.8,
        color: 'amarelo',
      },
      {
        label: '3.0–4.9',
        value: 4.2,
        color: 'verde',
      },
      {
        label: '≥ 5.0',
        value: 5.5,
        color: 'amarelo',
      },
    ],

    bicarbonate: [
      {
        label: '< 15',
        value: 12,
        color: 'laranja',
      },
      {
        label: '15–19',
        value: 17,
        color: 'amarelo',
      },
      {
        label: '≥ 20',
        value: 22,
        color: 'verde',
      },
    ],

    bilirubin: [
      {
        label: '< 4.0',
        value: 3.5,
        color: 'verde',
      },
      {
        label: '4.0–5.9',
        value: 5,
        color: 'amarelo',
      },
      {
        label: '≥ 6.0',
        value: 7,
        color: 'vermelho',
      },
    ],

    admissionType: [
      {
        label: 'Cirurgia Programada',
        value: 'scheduledSurgical',
        color: 'verde',
      },
      {
        label: 'Clínica',
        value: 'medical',
        color: 'laranja',
      },
      {
        label: 'Cirurgia de Urgência',
        value: 'unscheduledSurgical',
        color: 'laranja',
      },
    ],

    metastaticCancer: [
      {
        label: 'Não',
        value: false,
        color: 'verde',
      },
      {
        label: 'Sim',
        value: true,
        color: 'vermelho',
      },
    ],

    hematologicMalignancy: [
      {
        label: 'Não',
        value: false,
        color: 'verde',
      },
      {
        label: 'Sim',
        value: true,
        color: 'vermelho',
      },
    ],

    aids: [
      {
        label: 'Não',
        value: false,
        color: 'verde',
      },
      {
        label: 'Sim',
        value: true,
        color: 'vermelho-escuro',
      },
    ],
  } as const;

  /* ==========================================================================
   * VALUE SETTERS
   * ======================================================================== */

  protected setNews2Value<K extends keyof News2Values>(
    field: K,
    value: News2Values[K],
  ): void {
    this.news2Values.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  protected setSaps2Value<K extends keyof Saps2Values>(
    field: K,
    value: Saps2Values[K],
  ): void {
    this.saps2Values.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ==========================================================================
   * GENERAL HELPERS
   * ======================================================================== */

  protected toNumber(
    value: string | number | null | undefined,
  ): number {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
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
    return Number.isInteger(value)
      ? value.toString()
      : value.toFixed(1);
  }

  /* ==========================================================================
   * FIELD SCORE - NEWS2
   * ======================================================================== */

  protected getNews2FieldScore(
    field: keyof News2Values,
  ): number {
    const values = this.news2Values();

    switch (field) {
      case 'respiratoryRate':
        return getRangeScore(
          values.respiratoryRate,
          NEWS2_RULES.respiratoryRate,
        );

      case 'oxygenSaturation':
        return getRangeScore(
          values.oxygenSaturation,
          NEWS2_RULES.oxygenSaturation,
        );

      case 'systolicBp':
        return getRangeScore(
          values.systolicBp,
          NEWS2_RULES.systolicBp,
        );

      case 'heartRate':
        return getRangeScore(
          values.heartRate,
          NEWS2_RULES.heartRate,
        );

      case 'temperature':
        return getRangeScore(
          values.temperature,
          NEWS2_RULES.temperature,
        );

      case 'consciousness':
        return getConsciousnessScore(
          values.consciousness,
        );

      case 'oxygenSupplement':
        return getBooleanScore(
          values.oxygenSupplement,
          2,
        );

      default:
        return 0;
    }
  }

  /* ==========================================================================
   * FIELD SCORE - SAPS2
   * ======================================================================== */

  protected getSaps2FieldScore(
    field: keyof Saps2Values,
  ): number {
    const values = this.saps2Values();

    switch (field) {
      case 'age':
        return getRangeScore(
          values.age,
          SAPS2_RULES.age,
        );

      case 'heartRate':
        return getRangeScore(
          values.heartRate,
          SAPS2_RULES.heartRate,
        );

      case 'systolicBp':
        return getRangeScore(
          values.systolicBp,
          SAPS2_RULES.systolicBp,
        );

      case 'temperature':
        return getRangeScore(
          values.temperature,
          SAPS2_RULES.temperature,
        );

      case 'gcs':
        return getRangeScore(
          values.gcs,
          SAPS2_RULES.gcs,
        );

      case 'mechanicalVentilation':
        return 0;

      case 'pao2Fio2':
        return getSaps2OxygenationScore(values);

      case 'urineOutput':
        return getRangeScore(
          values.urineOutput,
          SAPS2_RULES.urineOutput,
        );

      case 'bun':
        return getRangeScore(
          values.bun,
          SAPS2_RULES.bun,
        );

      case 'leukocytes':
        return getRangeScore(
          values.leukocytes,
          SAPS2_RULES.leukocytes,
        );

      case 'sodium':
        return getRangeScore(
          values.sodium,
          SAPS2_RULES.sodium,
        );

      case 'potassium':
        return getRangeScore(
          values.potassium,
          SAPS2_RULES.potassium,
        );

      case 'bicarbonate':
        return getRangeScore(
          values.bicarbonate,
          SAPS2_RULES.bicarbonate,
        );

      case 'bilirubin':
        return getRangeScore(
          values.bilirubin,
          SAPS2_RULES.bilirubin,
        );

      case 'admissionType':
        return getSaps2AdmissionScore(
          values.admissionType,
        );

      case 'metastaticCancer':
        return getBooleanScore(
          values.metastaticCancer,
          9,
        );

      case 'hematologicMalignancy':
        return getBooleanScore(
          values.hematologicMalignancy,
          10,
        );

      case 'aids':
        return getBooleanScore(
          values.aids,
          17,
        );

      default:
        return 0;
    }
  }

  /* ==========================================================================
   * OPTION SCORE
   *
   * These methods intentionally delegate to the same field-score methods.
   * This prevents the UI option score from becoming different from the
   * actual score calculation.
   * ======================================================================== */

  protected getNews2OptionScore(
    field: keyof News2Values,
    value: News2Values[keyof News2Values],
  ): number {
    switch (field) {
      case 'respiratoryRate':
        return getRangeScore(
          value as number,
          NEWS2_RULES.respiratoryRate,
        );

      case 'oxygenSaturation':
        return getRangeScore(
          value as number,
          NEWS2_RULES.oxygenSaturation,
        );

      case 'systolicBp':
        return getRangeScore(
          value as number,
          NEWS2_RULES.systolicBp,
        );

      case 'heartRate':
        return getRangeScore(
          value as number,
          NEWS2_RULES.heartRate,
        );

      case 'temperature':
        return getRangeScore(
          value as number,
          NEWS2_RULES.temperature,
        );

      case 'consciousness':
        return getConsciousnessScore(
          value as News2Values['consciousness'],
        );

      case 'oxygenSupplement':
        return getBooleanScore(
          value as boolean,
          2,
        );

      default:
        return 0;
    }
  }

  protected getSaps2OptionScore(
    field: keyof Saps2Values,
    value: Saps2Values[keyof Saps2Values],
  ): number {
    switch (field) {
      case 'age':
        return getRangeScore(
          value as number,
          SAPS2_RULES.age,
        );

      case 'heartRate':
        return getRangeScore(
          value as number,
          SAPS2_RULES.heartRate,
        );

      case 'systolicBp':
        return getRangeScore(
          value as number,
          SAPS2_RULES.systolicBp,
        );

      case 'temperature':
        return getRangeScore(
          value as number,
          SAPS2_RULES.temperature,
        );

      case 'gcs':
        return getRangeScore(
          value as number,
          SAPS2_RULES.gcs,
        );

      case 'mechanicalVentilation':
        return 0;

      case 'pao2Fio2':
        if (!this.saps2Values().mechanicalVentilation) {
          return 0;
        }

        return getRangeScore(
          value as number,
          SAPS2_RULES.pao2Fio2,
        );

      case 'urineOutput':
        return getRangeScore(
          value as number,
          SAPS2_RULES.urineOutput,
        );

      case 'bun':
        return getRangeScore(
          value as number,
          SAPS2_RULES.bun,
        );

      case 'leukocytes':
        return getRangeScore(
          value as number,
          SAPS2_RULES.leukocytes,
        );

      case 'sodium':
        return getRangeScore(
          value as number,
          SAPS2_RULES.sodium,
        );

      case 'potassium':
        return getRangeScore(
          value as number,
          SAPS2_RULES.potassium,
        );

      case 'bicarbonate':
        return getRangeScore(
          value as number,
          SAPS2_RULES.bicarbonate,
        );

      case 'bilirubin':
        return getRangeScore(
          value as number,
          SAPS2_RULES.bilirubin,
        );

      case 'admissionType':
        return getSaps2AdmissionScore(
          value as Saps2Values['admissionType'],
        );

      case 'metastaticCancer':
        return getBooleanScore(
          value as boolean,
          9,
        );

      case 'hematologicMalignancy':
        return getBooleanScore(
          value as boolean,
          10,
        );

      case 'aids':
        return getBooleanScore(
          value as boolean,
          17,
        );

      default:
        return 0;
    }
  }
}