import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { HospitalPresentation } from './hospital-presentation/hospital-presentation';
import { HospitalBanner } from './hospital-banner/hospital-banner';

/* ============================================================================
 * TYPES & ENUMS
 * ========================================================================== */

export type ScoreType = 'news2' | 'saps3';

/* ---------------------------------------------------------------------------
 * NEWS2 TYPES
 * ------------------------------------------------------------------------- */

export interface News2Values {
  respiratoryRate: number;
  oxygenSaturation: number;
  systolicBp: number;
  heartRate: number;
  temperature: number;
  consciousness: 'A' | 'V' | 'P' | 'U';
  oxygenSupplement: boolean;
}

/* ---------------------------------------------------------------------------
 * SAPS 3 TYPES (ALGORITMO OFICIAL SAPS 3 OUTCOMES RESEARCH GROUP)
 * ------------------------------------------------------------------------- */

export type Saps3PreIcuLocation =
  | 'operativeRoom'
  | 'emergencyRoom'
  | 'otherIcu'
  | 'other';

export type Saps3SurgicalStatus =
  | 'scheduledSurgery'
  | 'noSurgery'
  | 'emergencySurgery';

export type Saps3SurgerySite =
  | 'otherOrNone'
  | 'transplantation'
  | 'trauma'
  | 'cabgWithoutValvularRepair'
  | 'neurosurgeryForStroke';

export type Saps3AcuteInfection =
  | 'none'
  | 'nosocomial'
  | 'respiratory';

export interface Saps3AdmissionReasons {
  /* Cardiovascular */
  cardiacRhythmDisturbance?: boolean;
  hypovolemicShockHemorrhagic?: boolean;
  hypovolemicShockNonHemorrhagic?: boolean;
  septicShock?: boolean;
  anaphylacticOrMixedShock?: boolean;

  /* Hepático */
  liverFailure?: boolean;

  /* Digestivo */
  severePancreatitis?: boolean;
  acuteAbdomenOrOtherDigestive?: boolean;

  /* Neurológico */
  seizures?: boolean;
  comaStuporConfusionDelirium?: boolean;
  focalNeurologicalDeficit?: boolean;
  intracranialMassEffect?: boolean;
}

export interface Saps3Values {
  /* Box I — Características do Paciente Pré-UTI */
  age: number;
  hospitalStayBeforeIcuDays: number;
  preIcuLocation: Saps3PreIcuLocation;
  cancerTherapy: boolean;
  metastaticCancer: boolean;
  hematologicCancer: boolean;
  chronicHeartFailureNYHA4: boolean;
  cirrhosis: boolean;
  aids: boolean;
  vasoactiveDrugsBeforeIcu: boolean;

  /* Box II — Circunstâncias da Admissão na UTI */
  plannedIcuAdmission: boolean;
  admissionReasons: Saps3AdmissionReasons;
  surgicalStatus: Saps3SurgicalStatus;
  surgerySite: Saps3SurgerySite;
  acuteInfection: Saps3AcuteInfection;

  /* Box III — Fisiologia Aguda (Piores valores na 1ª hora na UTI) */
  gcs: number;
  bilirubin: number;
  temperature: number;
  creatinine: number;
  heartRate: number;
  leukocytes: number;
  ph: number;
  platelets: number;
  systolicBp: number;

  /* Oxigenação */
  mechanicalVentilation: boolean;
  pao2Fio2?: number;
  pao2?: number;
}

export interface ScoreResult {
  total: number;
  label: string;
  tone: 'low' | 'medium' | 'high' | 'critical';
  guidance: string;
  estimate: string;
  mortalityLatAm?: string;
  mortalityGlobal?: string;
}

export interface ContinuousRange {
  min?: number;
  minInclusive?: boolean;
  max?: number;
  maxInclusive?: boolean;
  score: number;
}

/* ============================================================================
 * SCORE RULES (FONTE DA VERDADE)
 * ========================================================================== */

/* ---------------------------------------------------------------------------
 * NEWS2 RULES
 * ------------------------------------------------------------------------- */

export const NEWS2_RULES = {
  respiratoryRate: [
    { max: 8, maxInclusive: true, score: 3 },
    { min: 9, minInclusive: true, max: 11, maxInclusive: true, score: 1 },
    { min: 12, minInclusive: true, max: 20, maxInclusive: true, score: 0 },
    { min: 21, minInclusive: true, max: 24, maxInclusive: true, score: 2 },
    { min: 25, minInclusive: true, score: 3 },
  ],

  oxygenSaturation: [
    { max: 91, maxInclusive: true, score: 3 },
    { min: 92, minInclusive: true, max: 93, maxInclusive: true, score: 2 },
    { min: 94, minInclusive: true, max: 95, maxInclusive: true, score: 1 },
    { min: 96, minInclusive: true, score: 0 },
  ],

  systolicBp: [
    { max: 90, maxInclusive: true, score: 3 },
    { min: 91, minInclusive: true, max: 100, maxInclusive: true, score: 2 },
    { min: 101, minInclusive: true, max: 110, maxInclusive: true, score: 1 },
    { min: 111, minInclusive: true, max: 219, maxInclusive: true, score: 0 },
    { min: 220, minInclusive: true, score: 3 },
  ],

  heartRate: [
    { max: 40, maxInclusive: true, score: 3 },
    { min: 41, minInclusive: true, max: 50, maxInclusive: true, score: 1 },
    { min: 51, minInclusive: true, max: 90, maxInclusive: true, score: 0 },
    { min: 91, minInclusive: true, max: 110, maxInclusive: true, score: 1 },
    { min: 111, minInclusive: true, max: 130, maxInclusive: true, score: 2 },
    { min: 131, minInclusive: true, score: 3 },
  ],

  temperature: [
    { max: 35.0, maxInclusive: true, score: 3 },
    { min: 35.0, minInclusive: false, max: 36.0, maxInclusive: true, score: 1 },
    { min: 36.0, minInclusive: false, max: 38.0, maxInclusive: true, score: 0 },
    { min: 38.0, minInclusive: false, max: 39.0, maxInclusive: true, score: 1 },
    { min: 39.0, minInclusive: false, score: 2 },
  ],
} as const;

/* ---------------------------------------------------------------------------
 * SAPS 3 CONSTANTS & RULES (ALGORITMO OFICIAL SAPS 3)
 * ------------------------------------------------------------------------- */

export const SAPS3_BASELINE_OFFSET = 16;

export const SAPS3_RULES = {
  /* Box I — Idade */
  age: [
    { max: 40, maxInclusive: false, score: 0 },
    { min: 40, minInclusive: true, max: 60, maxInclusive: false, score: 5 },
    { min: 60, minInclusive: true, max: 70, maxInclusive: false, score: 9 },
    { min: 70, minInclusive: true, max: 75, maxInclusive: false, score: 13 },
    { min: 75, minInclusive: true, max: 80, maxInclusive: false, score: 15 },
    { min: 80, minInclusive: true, score: 18 },
  ],

  /* Box I — Tempo de permanência hospitalar antes da UTI */
  hospitalStayBeforeIcuDays: [
    { max: 14, maxInclusive: false, score: 0 },
    { min: 14, minInclusive: true, max: 28, maxInclusive: false, score: 6 },
    { min: 28, minInclusive: true, score: 7 },
  ],

  /* Box I — Localização imediatamente antes da UTI */
  preIcuLocation: {
    operativeRoom: 0,
    emergencyRoom: 5,
    otherIcu: 7,
    other: 8,
  },

  /* Box I — Comorbidades (Cumulativas no modelo multivariado oficial do SAPS 3) */
  comorbidities: {
    cancerTherapy: 3,
    hematologicCancer: 6,
    chronicHeartFailureNYHA4: 6,
    cirrhosis: 8,
    aids: 8,
    metastaticCancer: 11,
  },

  /* Box I — Terapia vasoativa antes da UTI */
  vasoactiveDrugsBeforeIcu: 3,

  /* Box II — Tipo de admissão */
  plannedIcuAdmission: {
    planned: 0,
    unplanned: 3,
  },

  /* Box II — Motivos de admissão individuais e combinações oficiais */
  admissionReasons: {
    cardiacRhythmDisturbance: -5,
    seizures: -4,
    rhythmAndSeizuresCombined: -4, // Regra oficial: ritmo + convulsões juntos = -4 (não -9)
    hypovolemicShockHemorrhagic: 3,
    hypovolemicShockNonHemorrhagic: 3,
    septicShock: 5,
    anaphylacticOrMixedShock: 5,
    liverFailure: 6,
    acuteAbdomenOrOtherDigestive: 3,
    severePancreatitis: 9,
    comaStuporConfusionDelirium: 4,
    focalNeurologicalDeficit: 7,
    intracranialMassEffect: 10,
  },

  /* Box II — Status cirúrgico */
  surgicalStatus: {
    scheduledSurgery: 0,
    noSurgery: 5,
    emergencySurgery: 6,
  },

  /* Box II — Local anatômico da cirurgia */
  surgerySite: {
    transplantation: -11,
    trauma: -8,
    cabgWithoutValvularRepair: -6,
    neurosurgeryForStroke: 5,
    otherOrNone: 0,
  },

  /* Box II — Infecção aguda na admissão */
  acuteInfection: {
    none: 0,
    nosocomial: 4,
    respiratory: 5,
  },

  /* Box III — Fisiologia: Glasgow Coma Scale */
  gcs: [
    { min: 13, minInclusive: true, max: 15, maxInclusive: true, score: 0 },
    { min: 7, minInclusive: true, max: 12, maxInclusive: true, score: 2 },
    { min: 6, minInclusive: true, max: 6, maxInclusive: true, score: 7 },
    { min: 5, minInclusive: true, max: 5, maxInclusive: true, score: 10 },
    { max: 4, maxInclusive: true, score: 15 },
  ],

  /* Box III — Fisiologia: Bilirrubina (mg/dL) */
  bilirubin: [
    { max: 2.0, maxInclusive: false, score: 0 },
    { min: 2.0, minInclusive: true, max: 6.0, maxInclusive: false, score: 4 },
    { min: 6.0, minInclusive: true, score: 5 },
  ],

  /* Box III — Fisiologia: Temperatura (°C) */
  temperature: [
    { max: 35.0, maxInclusive: false, score: 7 },
    { min: 35.0, minInclusive: true, score: 0 },
  ],

  /* Box III — Fisiologia: Creatinina (mg/dL) */
  creatinine: [
    { max: 1.2, maxInclusive: false, score: 0 },
    { min: 1.2, minInclusive: true, max: 2.0, maxInclusive: false, score: 2 },
    { min: 2.0, minInclusive: true, max: 3.5, maxInclusive: false, score: 7 },
    { min: 3.5, minInclusive: true, score: 8 },
  ],

  /* Box III — Fisiologia: Frequência cardíaca (bpm) */
  heartRate: [
    { max: 120, maxInclusive: false, score: 0 },
    { min: 120, minInclusive: true, max: 160, maxInclusive: false, score: 5 },
    { min: 160, minInclusive: true, score: 7 },
  ],

  /* Box III — Fisiologia: Leucócitos (G/L) */
  leukocytes: [
    { max: 15.0, maxInclusive: false, score: 0 },
    { min: 15.0, minInclusive: true, score: 2 },
  ],

  /* Box III — Fisiologia: pH */
  ph: [
    { max: 7.25, maxInclusive: true, score: 3 },
    { min: 7.25, minInclusive: false, score: 0 },
  ],

  /* Box III — Fisiologia: Plaquetas (G/L) */
  platelets: [
    { max: 20, maxInclusive: false, score: 13 },
    { min: 20, minInclusive: true, max: 50, maxInclusive: false, score: 8 },
    { min: 50, minInclusive: true, max: 100, maxInclusive: false, score: 5 },
    { min: 100, minInclusive: true, score: 0 },
  ],

  /* Box III — Fisiologia: Pressão arterial sistólica (mmHg) */
  systolicBp: [
    { max: 40, maxInclusive: false, score: 11 },
    { min: 40, minInclusive: true, max: 70, maxInclusive: false, score: 8 },
    { min: 70, minInclusive: true, max: 120, maxInclusive: false, score: 3 },
    { min: 120, minInclusive: true, score: 0 },
  ],

  /* Box III — Fisiologia: Oxigenação */
  oxygenation: {
    mechanicalVentilation: {
      lt100: 11, // PaO2/FiO2 < 100
      gte100: 7, // PaO2/FiO2 >= 100
    },
    spontaneous: {
      lt60: 5, // PaO2 < 60 mmHg
      gte60: 0, // PaO2 >= 60 mmHg
    },
  },
} as const;

/* ============================================================================
 * DEFAULT VALUES
 * ========================================================================== */

export const NEWS2_DEFAULT: News2Values = {
  respiratoryRate: 16,
  oxygenSaturation: 96,
  systolicBp: 150,
  heartRate: 70,
  temperature: 37.0,
  consciousness: 'A',
  oxygenSupplement: false,
};

export const SAPS3_DEFAULT: Saps3Values = {
  /* Box I */
  age: 35,
  hospitalStayBeforeIcuDays: 2,
  preIcuLocation: 'operativeRoom',
  cancerTherapy: false,
  metastaticCancer: false,
  hematologicCancer: false,
  chronicHeartFailureNYHA4: false,
  cirrhosis: false,
  aids: false,
  vasoactiveDrugsBeforeIcu: false,

  /* Box II */
  plannedIcuAdmission: true,
  admissionReasons: {},
  surgicalStatus: 'scheduledSurgery',
  surgerySite: 'otherOrNone',
  acuteInfection: 'none',

  /* Box III */
  gcs: 15,
  bilirubin: 1.0,
  temperature: 36.8,
  creatinine: 0.9,
  heartRate: 80,
  leukocytes: 8.0,
  ph: 7.4,
  platelets: 250,
  systolicBp: 130,

  /* Oxigenação */
  mechanicalVentilation: false,
  pao2: 90,
  pao2Fio2: 350,
};

/* ============================================================================
 * GENERIC EVALUATION HELPERS
 * ========================================================================== */

/**
 * Avalia faixas numéricas de forma estrita, sem gaps e sem números mágicos de arredondamento.
 */
export function getRangeScore(
  value: number,
  ranges: readonly ContinuousRange[],
): number {
  if (value === undefined || value === null || isNaN(value)) {
    return 0;
  }

  for (const range of ranges) {
    const minSatisfied =
      range.min === undefined ||
      (range.minInclusive ? value >= range.min : value > range.min);

    const maxSatisfied =
      range.max === undefined ||
      (range.maxInclusive ? value <= range.max : value < range.max);

    if (minSatisfied && maxSatisfied) {
      return range.score;
    }
  }

  return 0;
}

export function sumScores(scores: readonly number[]): number {
  return scores.reduce((total, score) => total + score, 0);
}

/* ============================================================================
 * NEWS2 SCORE CALCULATION (PROTOCOLO OFICIAL ROYAL COLLEGE OF PHYSICIANS)
 * ========================================================================== */

export interface News2CalculationResult {
  total: number;
  hasRedScore: boolean;
}

export function calculateNews2Score(values: News2Values): News2CalculationResult {
  const scores = [
    getRangeScore(values.respiratoryRate, NEWS2_RULES.respiratoryRate),
    getRangeScore(values.oxygenSaturation, NEWS2_RULES.oxygenSaturation),
    getRangeScore(values.systolicBp, NEWS2_RULES.systolicBp),
    getRangeScore(values.heartRate, NEWS2_RULES.heartRate),
    getRangeScore(values.temperature, NEWS2_RULES.temperature),
    values.consciousness === 'A' ? 0 : 3,
    values.oxygenSupplement ? 2 : 0,
  ];

  return {
    total: sumScores(scores),
    hasRedScore: scores.includes(3),
  };
}

export function summarizeNews2(result: News2CalculationResult): ScoreResult {
  const { total, hasRedScore } = result;

  if (total <= 4 && !hasRedScore) {
    return {
      total,
      label: 'Baixo risco',
      tone: 'low',
      guidance: 'Monitorização clínica regular na enfermaria; reavaliar a cada 12 horas.',
      estimate: 'Observação clínica regular',
    };
  }

  if (total <= 4 && hasRedScore) {
    return {
      total,
      label: 'Risco baixo-médio (Parâmetro Vermelho)',
      tone: 'medium',
      guidance: 'Alerta de parâmetro extremo isolado (3 pontos). Avaliação urgente pela equipe e reavaliação mínima a cada 1 hora.',
      estimate: 'Gatilho clínico por valor extremo',
    };
  }

  if (total === 5 || total === 6) {
    return {
      total,
      label: 'Risco moderado',
      tone: 'medium',
      guidance: 'Avaliação médica urgente em no máximo 1 hora e aumento da frequência de monitorização.',
      estimate: 'Sinais de alerta em progressão',
    };
  }

  return {
    total,
    label: 'Risco alto',
    tone: 'high',
    guidance: 'Resposta de emergência; avaliação médica imediata e considerar transferência para leito de monitorização contínua ou UTI.',
    estimate: 'Necessita intervenção médica de emergência',
  };
}

/* ============================================================================
 * SAPS 3 MODULAR SCORE CALCULATION (ALGORITMO OFICIAL)
 * ========================================================================== */

/**
 * Função principal do cálculo do SAPS 3:
 * SAPS 3 Total = 16 (offset fixo) + Box I + Box II + Box III
 */
export function calculateSaps3Score(values: Saps3Values): number {
  return (
    SAPS3_BASELINE_OFFSET +
    calculateSaps3Box1(values) +
    calculateSaps3Box2(values) +
    calculateSaps3Box3(values)
  );
}

/**
 * Box I — Características Pré-UTI
 */
export function calculateSaps3Box1(values: Saps3Values): number {
  const ageScore = getRangeScore(values.age, SAPS3_RULES.age);
  const stayScore = getRangeScore(
    values.hospitalStayBeforeIcuDays,
    SAPS3_RULES.hospitalStayBeforeIcuDays,
  );
  const locationScore = getSaps3PreIcuLocationScore(values.preIcuLocation);
  const comorbidityScore = getSaps3ComorbidityScore(values);
  const vasoactiveScore = values.vasoactiveDrugsBeforeIcu
    ? SAPS3_RULES.vasoactiveDrugsBeforeIcu
    : 0;

  return ageScore + stayScore + locationScore + comorbidityScore + vasoactiveScore;
}

/**
 * Box II — Circunstâncias da Admissão na UTI
 */
export function calculateSaps3Box2(values: Saps3Values): number {
  const admissionTypeScore = values.plannedIcuAdmission
    ? SAPS3_RULES.plannedIcuAdmission.planned
    : SAPS3_RULES.plannedIcuAdmission.unplanned;

  const reasonScore = getSaps3AdmissionReasonScore(values.admissionReasons);
  const surgicalStatusScore = getSaps3SurgicalStatusScore(values.surgicalStatus);
  const surgerySiteScore = getSaps3SurgerySiteScore(values.surgerySite);
  const infectionScore = getSaps3InfectionScore(values.acuteInfection);

  return (
    admissionTypeScore +
    reasonScore +
    surgicalStatusScore +
    surgerySiteScore +
    infectionScore
  );
}

/**
 * Box III — Fisiologia Aguda (Piores valores na 1ª hora na UTI)
 */
export function calculateSaps3Box3(values: Saps3Values): number {
  const gcsScore = getRangeScore(values.gcs, SAPS3_RULES.gcs);
  const bilirubinScore = getRangeScore(values.bilirubin, SAPS3_RULES.bilirubin);
  const tempScore = getRangeScore(values.temperature, SAPS3_RULES.temperature);
  const creatinineScore = getRangeScore(values.creatinine, SAPS3_RULES.creatinine);
  const hrScore = getRangeScore(values.heartRate, SAPS3_RULES.heartRate);
  const leukocytesScore = getRangeScore(values.leukocytes, SAPS3_RULES.leukocytes);
  const phScore = getRangeScore(values.ph, SAPS3_RULES.ph);
  const plateletsScore = getRangeScore(values.platelets, SAPS3_RULES.platelets);
  const sbpScore = getRangeScore(values.systolicBp, SAPS3_RULES.systolicBp);
  const oxygenationScore = getSaps3OxygenationScore(values);

  return (
    gcsScore +
    bilirubinScore +
    tempScore +
    creatinineScore +
    hrScore +
    leukocytesScore +
    phScore +
    plateletsScore +
    sbpScore +
    oxygenationScore
  );
}

/* ---------------------------------------------------------------------------
 * HELPERS ESPECÍFICOS DO SAPS 3
 * ------------------------------------------------------------------------- */

export function getSaps3PreIcuLocationScore(
  location: Saps3PreIcuLocation,
): number {
  return SAPS3_RULES.preIcuLocation[location] ?? 0;
}

/**
 * No SAPS 3, as comorbidades crônicas entram como variáveis binárias independentes
 * no modelo multivariado, acumulando (somando) os seus pontos no score do paciente.
 */
export function getSaps3ComorbidityScore(values: Saps3Values): number {
  let score = 0;

  if (values.cancerTherapy) {
    score += SAPS3_RULES.comorbidities.cancerTherapy;
  }
  if (values.hematologicCancer) {
    score += SAPS3_RULES.comorbidities.hematologicCancer;
  }
  if (values.chronicHeartFailureNYHA4) {
    score += SAPS3_RULES.comorbidities.chronicHeartFailureNYHA4;
  }
  if (values.cirrhosis) {
    score += SAPS3_RULES.comorbidities.cirrhosis;
  }
  if (values.aids) {
    score += SAPS3_RULES.comorbidities.aids;
  }
  if (values.metastaticCancer) {
    score += SAPS3_RULES.comorbidities.metastaticCancer;
  }

  return score;
}

/**
 * Cálculo Oficial dos Motivos de Admissão no SAPS 3:
 * 1. Regra Especial de Combinação:
 *    - Se o paciente apresentar Distúrbio do Ritmo E Convulsões juntos => -4 pontos (e não -9).
 *    - Distúrbio do Ritmo isolado => -5 pontos.
 *    - Convulsões isoladas => -4 pontos.
 * 2. Choque Hipovolêmico:
 *    - Hemorrágico (+3) e Não hemorrágico (+3) acumulam-se (+6 se ambos).
 * 3. Demais motivos acumulam por acometimento sistêmico (Cardiovascular, Hepático, Digestivo, Neurológico).
 */
export function getSaps3AdmissionReasonScore(
  reasons: Saps3AdmissionReasons,
): number {
  let score = 0;

  const hasRhythm = !!reasons.cardiacRhythmDisturbance;
  const hasSeizures = !!reasons.seizures;

  if (hasRhythm && hasSeizures) {
    score += SAPS3_RULES.admissionReasons.rhythmAndSeizuresCombined; // -4
  } else if (hasRhythm) {
    score += SAPS3_RULES.admissionReasons.cardiacRhythmDisturbance; // -5
  } else if (hasSeizures) {
    score += SAPS3_RULES.admissionReasons.seizures; // -4
  }

  if (reasons.hypovolemicShockHemorrhagic) {
    score += SAPS3_RULES.admissionReasons.hypovolemicShockHemorrhagic; // +3
  }
  if (reasons.hypovolemicShockNonHemorrhagic) {
    score += SAPS3_RULES.admissionReasons.hypovolemicShockNonHemorrhagic; // +3
  }
  if (reasons.septicShock) {
    score += SAPS3_RULES.admissionReasons.septicShock; // +5
  }
  if (reasons.anaphylacticOrMixedShock) {
    score += SAPS3_RULES.admissionReasons.anaphylacticOrMixedShock; // +5
  }

  if (reasons.liverFailure) {
    score += SAPS3_RULES.admissionReasons.liverFailure; // +6
  }

  if (reasons.severePancreatitis) {
    score += SAPS3_RULES.admissionReasons.severePancreatitis; // +9
  }
  if (reasons.acuteAbdomenOrOtherDigestive) {
    score += SAPS3_RULES.admissionReasons.acuteAbdomenOrOtherDigestive; // +3
  }

  if (reasons.intracranialMassEffect) {
    score += SAPS3_RULES.admissionReasons.intracranialMassEffect; // +10
  }
  if (reasons.focalNeurologicalDeficit) {
    score += SAPS3_RULES.admissionReasons.focalNeurologicalDeficit; // +7
  }
  if (reasons.comaStuporConfusionDelirium) {
    score += SAPS3_RULES.admissionReasons.comaStuporConfusionDelirium; // +4
  }

  return score;
}

export function getSaps3SurgicalStatusScore(
  status: Saps3SurgicalStatus,
): number {
  return SAPS3_RULES.surgicalStatus[status] ?? 0;
}

export function getSaps3SurgerySiteScore(
  site: Saps3SurgerySite,
): number {
  return SAPS3_RULES.surgerySite[site] ?? 0;
}

export function getSaps3InfectionScore(
  infection: Saps3AcuteInfection,
): number {
  return SAPS3_RULES.acuteInfection[infection] ?? 0;
}

/**
 * Cálculo oficial da Oxigenação no SAPS 3 com validação estrita:
 * - Se em ventilação mecânica: PaO2/FiO2 é OBRIGATÓRIO (PaO2/FiO2 < 100 => 11 pts; PaO2/FiO2 >= 100 => 7 pts).
 * - Se sem ventilação mecânica: PaO2 é OBRIGATÓRIO (PaO2 < 60 mmHg => 5 pts; PaO2 >= 60 mmHg => 0 pts).
 * Impede fallbacks silenciosos que possam mascarar ausência de dados clínicos.
 */
export function getSaps3OxygenationScore(
  values: Pick<Saps3Values, 'mechanicalVentilation' | 'pao2Fio2' | 'pao2'>,
): number {
  if (values.mechanicalVentilation) {
    if (
      values.pao2Fio2 === undefined ||
      values.pao2Fio2 === null ||
      isNaN(values.pao2Fio2)
    ) {
      return 0;
    }
    return values.pao2Fio2 < 100
      ? SAPS3_RULES.oxygenation.mechanicalVentilation.lt100
      : SAPS3_RULES.oxygenation.mechanicalVentilation.gte100;
  }

  if (
    values.pao2 === undefined ||
    values.pao2 === null ||
    isNaN(values.pao2)
  ) {
    return 0;
  }

  return values.pao2 < 60
    ? SAPS3_RULES.oxygenation.spontaneous.lt60
    : SAPS3_RULES.oxygenation.spontaneous.gte60;
}

/* ---------------------------------------------------------------------------
 * REGRESSÃO LOGÍSTICA OFICIAL DO SAPS 3 PARA MORTALIDADE HOSPITALAR
 * ------------------------------------------------------------------------- */

/**
 * Equação Customizada Oficial do SAPS 3 para América Central e do Sul (Central and South America):
 * Logit = -64.5990 + ln(SAPS3 + 71.0599) * 13.2322
 * Probabilidade = e^logit / (1 + e^logit)
 */
export function calculateSaps3MortalityCentralSouthAmerica(total: number): string {
  const safeTotal = Math.max(0, total);
  const logit = -64.599 + Math.log(safeTotal + 71.0599) * 13.2322;
  const probability = Math.exp(logit) / (1 + Math.exp(logit));
  return (probability * 100).toFixed(1);
}

// Alias para compatibilidade semântica
export const calculateSaps3MortalityLatAm = calculateSaps3MortalityCentralSouthAmerica;

/**
 * Equação Padrão Global do SAPS 3 (Global Standard Model):
 * Logit = -32.6659 + ln(SAPS3 + 20.5958) * 7.3068
 * Probabilidade = e^logit / (1 + e^logit)
 */
export function calculateSaps3MortalityGlobal(total: number): string {
  const safeTotal = Math.max(0, total);
  const logit = -32.6659 + Math.log(safeTotal + 20.5958) * 7.3068;
  const probability = Math.exp(logit) / (1 + Math.exp(logit));
  return (probability * 100).toFixed(1);
}

/**
 * Sumarização do SAPS 3.
 * NOTA DE AUDITORIA: O SAPS 3 original NÃO define faixas categóricas arbitrárias de gravidade.
 * As categorias visuais ('low', 'medium', 'high', 'critical') e faixas de pontuação são
 * convenções internas de triagem visual da interface da aplicação, enquanto o prognóstico
 * oficial é dado exclusivamente pela estimativa de mortalidade hospitalar calibrada.
 */
export function summarizeSaps3(total: number): ScoreResult {
  const mortalityLatAm = calculateSaps3MortalityCentralSouthAmerica(total);
  const mortalityGlobal = calculateSaps3MortalityGlobal(total);
  const estimate = `Mortalidade estimada: ${mortalityLatAm}% (América Central e do Sul) | ${mortalityGlobal}% (Global)`;

  // Triagem visual interna da aplicação para cores de alerta da interface
  let tone: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let guidance = 'Monitorização contínua na UTI e reavaliação clínica regular.';

  if (total <= 45) {
    tone = 'low';
    guidance = 'Monitorização contínua na UTI e reavaliação clínica regular.';
  } else if (total <= 60) {
    tone = 'medium';
    guidance = 'Monitorização hemodinâmica intensiva e suporte clínico direcionado.';
  } else if (total <= 75) {
    tone = 'high';
    guidance = 'Suporte avançado a órgãos, vigilância contínua e intervenção médica intensiva.';
  } else {
    tone = 'critical';
    guidance = 'Risco crítico iminente; suporte orgânico múltiplo e revisão multidisciplinar imediata.';
  }

  return {
    total,
    label: `Score SAPS 3: ${total} pts`,
    tone,
    guidance,
    estimate,
    mortalityLatAm,
    mortalityGlobal,
  };
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
  public readonly selectedScore = signal<ScoreType>('news2');
  public readonly news2Values = signal<News2Values>(NEWS2_DEFAULT);
  public readonly saps3Values = signal<Saps3Values>(SAPS3_DEFAULT);

  public readonly news2Result = computed(() =>
    summarizeNews2(calculateNews2Score(this.news2Values())),
  );

  public readonly saps3Result = computed(() =>
    summarizeSaps3(calculateSaps3Score(this.saps3Values())),
  );

  public readonly scoreOptions = [
    { key: 'news2' as const, label: 'Enfermaria • NEWS2' },
    { key: 'saps3' as const, label: 'UTI • SAPS 3' },
  ];

  /* ==========================================================================
   * NEWS2 OPTIONS
   * ======================================================================== */

  public readonly news2FieldOptions = {
    respiratoryRate: [
      { label: '≤ 8', value: 8, color: 'vermelho' },
      { label: '9–11', value: 10, color: 'amarelo' },
      { label: '12–20', value: 16, color: 'verde' },
      { label: '21–24', value: 22, color: 'laranja' },
      { label: '≥ 25', value: 25, color: 'vermelho' },
    ],
    oxygenSaturation: [
      { label: '≤ 91', value: 91, color: 'vermelho' },
      { label: '92–93', value: 92, color: 'laranja' },
      { label: '94–95', value: 95, color: 'amarelo' },
      { label: '≥ 96', value: 96, color: 'verde' },
    ],
    systolicBp: [
      { label: '≤ 90', value: 88, color: 'vermelho' },
      { label: '91–100', value: 95, color: 'laranja' },
      { label: '101–110', value: 105, color: 'amarelo' },
      { label: '111–219', value: 150, color: 'verde' },
      { label: '≥ 220', value: 220, color: 'vermelho' },
    ],
    heartRate: [
      { label: '≤ 40', value: 38, color: 'vermelho' },
      { label: '41–50', value: 45, color: 'amarelo' },
      { label: '51–90', value: 70, color: 'verde' },
      { label: '91–110', value: 100, color: 'amarelo' },
      { label: '111–130', value: 120, color: 'laranja' },
      { label: '≥ 131', value: 135, color: 'vermelho' },
    ],
    temperature: [
      { label: '≤ 35', value: 34.9, color: 'vermelho' },
      { label: '35.1–36', value: 35.5, color: 'amarelo' },
      { label: '36.1–38', value: 37.0, color: 'verde' },
      { label: '38.1–39', value: 38.5, color: 'amarelo' },
      { label: '≥ 39.1', value: 39.5, color: 'laranja' },
    ],
    consciousness: [
      { label: 'A', value: 'A', color: 'verde' },
      { label: 'V', value: 'V', color: 'vermelho' },
      { label: 'P', value: 'P', color: 'vermelho-escuro' },
      { label: 'U', value: 'U', color: 'vermelho-escuro' },
    ],
    oxygenSupplement: [
      { label: 'Não', value: false, color: 'verde' },
      { label: 'Sim', value: true, color: 'laranja' },
    ],
  } as const;

  /* ==========================================================================
   * SAPS 3 FIELD OPTIONS (ALGORITMO OFICIAL)
   * ======================================================================== */

  public readonly saps3FieldOptions = {
    /* Box I: Idade */
    age: [
      { label: '< 40 anos (0 pts)', value: 35, color: 'verde' },
      { label: '40–59 anos (+5 pts)', value: 50, color: 'amarelo' },
      { label: '60–69 anos (+9 pts)', value: 65, color: 'laranja' },
      { label: '70–74 anos (+13 pts)', value: 72, color: 'vermelho' },
      { label: '75–79 anos (+15 pts)', value: 77, color: 'vermelho-escuro' },
      { label: '≥ 80 anos (+18 pts)', value: 82, color: 'vermelho-escuro' },
    ],

    /* Box I: Tempo de permanência hospitalar antes da UTI */
    hospitalStayBeforeIcuDays: [
      { label: '< 14 dias (0 pts)', value: 2, color: 'verde' },
      { label: '14–27 dias (+6 pts)', value: 20, color: 'laranja' },
      { label: '≥ 28 dias (+7 pts)', value: 30, color: 'vermelho' },
    ],

    /* Box I: Localização imediatamente antes da UTI */
    preIcuLocation: [
      { label: 'Centro Cirúrgico (0 pts)', value: 'operativeRoom' as Saps3PreIcuLocation, color: 'verde' },
      { label: 'Emergência (+5 pts)', value: 'emergencyRoom' as Saps3PreIcuLocation, color: 'amarelo' },
      { label: 'Outra UTI (+7 pts)', value: 'otherIcu' as Saps3PreIcuLocation, color: 'laranja' },
      { label: 'Outros locais / Enfermaria (+8 pts)', value: 'other' as Saps3PreIcuLocation, color: 'vermelho' },
    ],

    /* Box I: Uso de drogas vasoativas antes da UTI */
    vasoactiveDrugsBeforeIcu: [
      { label: 'Não (0 pts)', value: false, color: 'verde' },
      { label: 'Sim (+3 pts)', value: true, color: 'laranja' },
    ],

    /* Box II: Tipo de admissão na UTI */
    plannedIcuAdmission: [
      { label: 'Planejada (0 pts)', value: true, color: 'verde' },
      { label: 'Não planejada (+3 pts)', value: false, color: 'laranja' },
    ],

    /* Box II: Status cirúrgico */
    surgicalStatus: [
      { label: 'Cirurgia programada (0 pts)', value: 'scheduledSurgery' as Saps3SurgicalStatus, color: 'verde' },
      { label: 'Sem cirurgia (+5 pts)', value: 'noSurgery' as Saps3SurgicalStatus, color: 'amarelo' },
      { label: 'Cirurgia de emergência (+6 pts)', value: 'emergencySurgery' as Saps3SurgicalStatus, color: 'laranja' },
    ],

    /* Box II: Local anatômico da cirurgia */
    surgerySite: [
      { label: 'Outros / Não cirúrgico (0 pts)', value: 'otherOrNone' as Saps3SurgerySite, color: 'verde' },
      { label: 'Transplante (-11 pts)', value: 'transplantation' as Saps3SurgerySite, color: 'verde' },
      { label: 'Trauma isolado/múltiplo (-8 pts)', value: 'trauma' as Saps3SurgerySite, color: 'verde' },
      { label: 'CABG sem reparo valvar (-6 pts)', value: 'cabgWithoutValvularRepair' as Saps3SurgerySite, color: 'verde' },
      { label: 'Neurocirurgia por AVC (+5 pts)', value: 'neurosurgeryForStroke' as Saps3SurgerySite, color: 'laranja' },
    ],

    /* Box II: Infecção aguda na admissão */
    acuteInfection: [
      { label: 'Nenhuma (0 pts)', value: 'none' as Saps3AcuteInfection, color: 'verde' },
      { label: 'Nosocomial (+4 pts)', value: 'nosocomial' as Saps3AcuteInfection, color: 'laranja' },
      { label: 'Respiratória (+5 pts)', value: 'respiratory' as Saps3AcuteInfection, color: 'vermelho' },
    ],

    /* Box III: Glasgow Coma Scale */
    gcs: [
      { label: '13–15 (0 pts)', value: 15, color: 'verde' },
      { label: '7–12 (+2 pts)', value: 10, color: 'amarelo' },
      { label: '6 (+7 pts)', value: 6, color: 'laranja' },
      { label: '5 (+10 pts)', value: 5, color: 'vermelho' },
      { label: '3–4 (+15 pts)', value: 4, color: 'vermelho-escuro' },
    ],

    /* Box III: Bilirrubina (mg/dL) */
    bilirubin: [
      { label: '< 2.0 (0 pts)', value: 1.0, color: 'verde' },
      { label: '2.0–< 6.0 (+4 pts)', value: 4.0, color: 'amarelo' },
      { label: '≥ 6.0 (+5 pts)', value: 7.0, color: 'vermelho' },
    ],

    /* Box III: Temperatura (°C) */
    temperature: [
      { label: '≥ 35.0 (0 pts)', value: 36.8, color: 'verde' },
      { label: '< 35.0 (+7 pts)', value: 34.0, color: 'vermelho' },
    ],

    /* Box III: Creatinina (mg/dL) */
    creatinine: [
      { label: '< 1.2 (0 pts)', value: 0.9, color: 'verde' },
      { label: '1.2–< 2.0 (+2 pts)', value: 1.5, color: 'amarelo' },
      { label: '2.0–< 3.5 (+7 pts)', value: 2.5, color: 'laranja' },
      { label: '≥ 3.5 (+8 pts)', value: 4.0, color: 'vermelho' },
    ],

    /* Box III: Frequência cardíaca (bpm) */
    heartRate: [
      { label: '< 120 (0 pts)', value: 80, color: 'verde' },
      { label: '120–159 (+5 pts)', value: 135, color: 'laranja' },
      { label: '≥ 160 (+7 pts)', value: 165, color: 'vermelho' },
    ],

    /* Box III: Leucócitos (G/L ou mil/mm³) */
    leukocytes: [
      { label: '< 15 G/L (0 pts)', value: 8.0, color: 'verde' },
      { label: '≥ 15 G/L (+2 pts)', value: 18.0, color: 'amarelo' },
    ],

    /* Box III: pH */
    ph: [
      { label: '> 7.25 (0 pts)', value: 7.4, color: 'verde' },
      { label: '≤ 7.25 (+3 pts)', value: 7.15, color: 'laranja' },
    ],

    /* Box III: Plaquetas (G/L ou mil/mm³) */
    platelets: [
      { label: '≥ 100 G/L (0 pts)', value: 250, color: 'verde' },
      { label: '50–< 100 G/L (+5 pts)', value: 75, color: 'amarelo' },
      { label: '20–< 50 G/L (+8 pts)', value: 35, color: 'laranja' },
      { label: '< 20 G/L (+13 pts)', value: 15, color: 'vermelho' },
    ],

    /* Box III: Pressão arterial sistólica (mmHg) */
    systolicBp: [
      { label: '≥ 120 (0 pts)', value: 130, color: 'verde' },
      { label: '70–< 120 (+3 pts)', value: 95, color: 'amarelo' },
      { label: '40–< 70 (+8 pts)', value: 55, color: 'laranja' },
      { label: '< 40 (+11 pts)', value: 35, color: 'vermelho' },
    ],

    /* Box III: Ventilação Mecânica */
    mechanicalVentilation: [
      { label: 'Não', value: false, color: 'verde' },
      { label: 'Sim', value: true, color: 'laranja' },
    ],

    /* Box III: Oxigenação com Ventilação Mecânica (PaO2/FiO2) */
    pao2Fio2Mv: [
      { label: '≥ 100 (+7 pts)', value: 250, color: 'laranja' },
      { label: '< 100 (+11 pts)', value: 80, color: 'vermelho' },
    ],

    /* Box III: Oxigenação sem Ventilação Mecânica (PaO2) */
    pao2Spontaneous: [
      { label: '≥ 60 mmHg (0 pts)', value: 85, color: 'verde' },
      { label: '< 60 mmHg (+5 pts)', value: 50, color: 'amarelo' },
    ],
  } as const;

  /* ==========================================================================
   * VALUE SETTERS
   * ======================================================================== */

  public setNews2Value<K extends keyof News2Values>(
    field: K,
    value: News2Values[K],
  ): void {
    this.news2Values.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  public setSaps3Value<K extends keyof Saps3Values>(
    field: K,
    value: Saps3Values[K],
  ): void {
    this.saps3Values.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  public toggleSaps3Comorbidity(
    comorbidity:
      | 'cancerTherapy'
      | 'metastaticCancer'
      | 'hematologicCancer'
      | 'chronicHeartFailureNYHA4'
      | 'cirrhosis'
      | 'aids',
  ): void {
    this.saps3Values.update((current) => ({
      ...current,
      [comorbidity]: !current[comorbidity],
    }));
  }

  public clearSaps3Comorbidities(): void {
    this.saps3Values.update((current) => ({
      ...current,
      cancerTherapy: false,
      metastaticCancer: false,
      hematologicCancer: false,
      chronicHeartFailureNYHA4: false,
      cirrhosis: false,
      aids: false,
    }));
  }

  public readonly hasNoSaps3Comorbidities = computed(() => {
    const v = this.saps3Values();
    return (
      !v.cancerTherapy &&
      !v.metastaticCancer &&
      !v.hematologicCancer &&
      !v.chronicHeartFailureNYHA4 &&
      !v.cirrhosis &&
      !v.aids
    );
  });

  public toggleSaps3AdmissionReason(
    reason: keyof Saps3AdmissionReasons,
  ): void {
    this.saps3Values.update((current) => ({
      ...current,
      admissionReasons: {
        ...current.admissionReasons,
        [reason]: !current.admissionReasons[reason],
      },
    }));
  }

  public clearSaps3AdmissionReasons(): void {
    this.saps3Values.update((current) => ({
      ...current,
      admissionReasons: {},
    }));
  }

  public readonly hasNoSaps3AdmissionReasons = computed(() => {
    const r = this.saps3Values().admissionReasons;
    return !Object.values(r).some(Boolean);
  });

  /* ==========================================================================
   * GENERAL HELPERS
   * ======================================================================== */

  public resetNews2(): void {
    this.news2Values.set(NEWS2_DEFAULT);
  }

  public resetSaps3(): void {
    this.saps3Values.set(SAPS3_DEFAULT);
  }
}