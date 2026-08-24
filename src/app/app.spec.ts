import { TestBed } from '@angular/core/testing';
import {
  App,
  calculateNews2Score,
  calculateSaps3Score,
  calculateSaps3Box1,
  calculateSaps3Box2,
  calculateSaps3Box3,
  getSaps3OxygenationScore,
  getSaps3AdmissionReasonScore,
  getSaps3SurgicalStatusScore,
  getSaps3SurgerySiteScore,
  getSaps3InfectionScore,
  getSaps3ComorbidityScore,
  getSaps3PreIcuLocationScore,
  getRangeScore,
  calculateSaps3MortalityCentralSouthAmerica,
  calculateSaps3MortalityGlobal,
  summarizeNews2,
  summarizeSaps3,
  SAPS3_BASELINE_OFFSET,
  SAPS3_RULES,
  SAPS3_DEFAULT,
  Saps3Values,
} from './app';

describe('App & SAPS 3 Official Algorithm (Segunda Revisão)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the score selector with NEWS2 and SAPS 3', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.showPresentation.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Calculadora de escores');
    expect(compiled.querySelectorAll('.score-tab').length).toBe(2);
    expect(compiled.querySelector('#saps3-tab')?.textContent).toContain('SAPS 3');
  });

  /* ==========================================================================
   * NEWS2 TESTS (ROYAL COLLEGE OF PHYSICIANS PROTOCOL)
   * ======================================================================== */
  describe('NEWS2 - Protocolo Oficial RCP', () => {
    it('should calculate low risk when total <= 4 and has no red parameter', () => {
      const result = calculateNews2Score({
        respiratoryRate: 16, // 0
        oxygenSaturation: 96, // 0
        systolicBp: 120, // 0
        heartRate: 70, // 0
        temperature: 37.0, // 0
        consciousness: 'A', // 0
        oxygenSupplement: true, // 2
      });

      expect(result.total).toBe(2);
      expect(result.hasRedScore).toBe(false);
      const summary = summarizeNews2(result);
      expect(summary.label).toBe('Baixo risco');
      expect(summary.tone).toBe('low');
    });

    it('should trigger Low-Medium Risk (Red Parameter) when total <= 4 but has a 3-point parameter', () => {
      const result = calculateNews2Score({
        respiratoryRate: 16, // 0
        oxygenSaturation: 96, // 0
        systolicBp: 120, // 0
        heartRate: 70, // 0
        temperature: 37.0, // 0
        consciousness: 'V', // 3 (Red Score!)
        oxygenSupplement: false, // 0
      });

      expect(result.total).toBe(3);
      expect(result.hasRedScore).toBe(true);
      const summary = summarizeNews2(result);
      expect(summary.label).toBe('Risco baixo-médio (Parâmetro Vermelho)');
      expect(summary.tone).toBe('medium');
    });

    it('should classify medium risk when total is 5 or 6 without red parameter', () => {
      const result = calculateNews2Score({
        respiratoryRate: 22, // 2
        oxygenSaturation: 93, // 2
        systolicBp: 105, // 1
        heartRate: 70, // 0
        temperature: 37.0, // 0
        consciousness: 'A', // 0
        oxygenSupplement: false, // 0
      });

      expect(result.total).toBe(5);
      expect(result.hasRedScore).toBe(false);
      const summary = summarizeNews2(result);
      expect(summary.label).toBe('Risco moderado');
      expect(summary.tone).toBe('medium');
    });

    it('should classify high risk when total >= 7', () => {
      const result = calculateNews2Score({
        respiratoryRate: 26, // 3
        oxygenSaturation: 90, // 3
        systolicBp: 95, // 2
        heartRate: 115, // 2
        temperature: 38.5, // 1
        consciousness: 'A', // 0
        oxygenSupplement: true, // 2
      });

      expect(result.total).toBe(13);
      expect(result.hasRedScore).toBe(true);
      const summary = summarizeNews2(result);
      expect(summary.label).toBe('Risco alto');
      expect(summary.tone).toBe('high');
    });

    it('should correctly score SpO2 Scale 2 in room air', () => {
      const baseValues = {
        respiratoryRate: 16,
        systolicBp: 120,
        heartRate: 70,
        temperature: 37.0,
        consciousness: 'A' as const,
        oxygenSupplement: false,
        useSpO2Scale2: true,
      };

      // <= 83%: 3 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 82 }).total).toBe(3);
      // 84-85%: 2 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 84 }).total).toBe(2);
      // 86-87%: 1 pt
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 87 }).total).toBe(1);
      // 88-92%: 0 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 90 }).total).toBe(0);
      // 93-94% on room air: 0 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 94 }).total).toBe(0);
      // 95-96% on room air: 0 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 96 }).total).toBe(0);
      // >= 97% on room air: 0 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 98 }).total).toBe(0);
    });

    it('should correctly score SpO2 Scale 2 with supplemental oxygen', () => {
      const baseValues = {
        respiratoryRate: 16, // 0
        systolicBp: 120, // 0
        heartRate: 70, // 0
        temperature: 37.0, // 0
        consciousness: 'A' as const, // 0
        oxygenSupplement: true, // +2 pts
        useSpO2Scale2: true,
      };

      // <= 83%: 3 pts SpO2 + 2 pts O2 = 5 pts (hasRedScore = true)
      const res83 = calculateNews2Score({ ...baseValues, oxygenSaturation: 83 });
      expect(res83.total).toBe(5);
      expect(res83.hasRedScore).toBe(true);

      // 84-85%: 2 pts SpO2 + 2 pts O2 = 4 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 85 }).total).toBe(4);

      // 86-87%: 1 pt SpO2 + 2 pts O2 = 3 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 86 }).total).toBe(3);

      // 88-92%: 0 pts SpO2 + 2 pts O2 = 2 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 91 }).total).toBe(2);

      // 93-94%: 1 pt SpO2 + 2 pts O2 = 3 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 93 }).total).toBe(3);

      // 95-96%: 2 pts SpO2 + 2 pts O2 = 4 pts
      expect(calculateNews2Score({ ...baseValues, oxygenSaturation: 95 }).total).toBe(4);

      // >= 97%: 3 pts SpO2 + 2 pts O2 = 5 pts (hasRedScore = true)
      const res98 = calculateNews2Score({ ...baseValues, oxygenSaturation: 98 });
      expect(res98.total).toBe(5);
      expect(res98.hasRedScore).toBe(true);
    });

    it('should reset oxygenSaturation to default score 0 value when toggling scales', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      expect(app.news2Values().useSpO2Scale2).toBe(false);
      expect(app.news2Values().oxygenSaturation).toBe(96); // Scale 1 default (0 pts)

      // Toggle to Scale 2
      app.toggleNews2SpO2Scale();
      expect(app.news2Values().useSpO2Scale2).toBe(true);
      expect(app.news2Values().oxygenSaturation).toBe(90); // Scale 2 default (0 pts)

      // Toggle back to Scale 1
      app.toggleNews2SpO2Scale();
      expect(app.news2Values().useSpO2Scale2).toBe(false);
      expect(app.news2Values().oxygenSaturation).toBe(96); // Scale 1 default (0 pts)
    });
  });

  /* ==========================================================================
   * SAPS 3 TESTS: FAIXAS E LIMITES RIGOROSOS (BOX I, II, III)
   * ======================================================================== */
  describe('SAPS 3 - Box I: Variáveis e Limites Numéricos', () => {
    it('should validate exact Age ranges (39, 40, 59, 60, 69, 70, 74, 75, 79, 80)', () => {
      expect(getRangeScore(39, SAPS3_RULES.age)).toBe(0);
      expect(getRangeScore(40, SAPS3_RULES.age)).toBe(5);
      expect(getRangeScore(59, SAPS3_RULES.age)).toBe(5);
      expect(getRangeScore(60, SAPS3_RULES.age)).toBe(9);
      expect(getRangeScore(69, SAPS3_RULES.age)).toBe(9);
      expect(getRangeScore(70, SAPS3_RULES.age)).toBe(13);
      expect(getRangeScore(74, SAPS3_RULES.age)).toBe(13);
      expect(getRangeScore(75, SAPS3_RULES.age)).toBe(15);
      expect(getRangeScore(79, SAPS3_RULES.age)).toBe(15);
      expect(getRangeScore(80, SAPS3_RULES.age)).toBe(18);
    });

    it('should validate Hospital Stay Before ICU Days (<14, 14-27, >=28)', () => {
      expect(getRangeScore(13, SAPS3_RULES.hospitalStayBeforeIcuDays)).toBe(0);
      expect(getRangeScore(14, SAPS3_RULES.hospitalStayBeforeIcuDays)).toBe(6);
      expect(getRangeScore(27, SAPS3_RULES.hospitalStayBeforeIcuDays)).toBe(6);
      expect(getRangeScore(28, SAPS3_RULES.hospitalStayBeforeIcuDays)).toBe(7);
      expect(getRangeScore(45, SAPS3_RULES.hospitalStayBeforeIcuDays)).toBe(7);
    });

    it('should validate Pre-ICU Location', () => {
      expect(getSaps3PreIcuLocationScore('operativeRoom')).toBe(0);
      expect(getSaps3PreIcuLocationScore('emergencyRoom')).toBe(5);
      expect(getSaps3PreIcuLocationScore('otherIcu')).toBe(7);
      expect(getSaps3PreIcuLocationScore('other')).toBe(8);
    });

    it('should validate Vasoactive drugs before ICU', () => {
      const baseValues: Saps3Values = { ...SAPS3_DEFAULT };
      expect(calculateSaps3Box1({ ...baseValues, vasoactiveDrugsBeforeIcu: false })).toBe(0);
      expect(calculateSaps3Box1({ ...baseValues, vasoactiveDrugsBeforeIcu: true })).toBe(3);
    });

    it('should validate Comorbidities scoring (cumulative summation)', () => {
      const baseValues: Saps3Values = { ...SAPS3_DEFAULT };
      expect(getSaps3ComorbidityScore(baseValues)).toBe(0);

      // Single comorbidities
      expect(getSaps3ComorbidityScore({ ...baseValues, cancerTherapy: true })).toBe(3);
      expect(getSaps3ComorbidityScore({ ...baseValues, hematologicCancer: true })).toBe(6);
      expect(getSaps3ComorbidityScore({ ...baseValues, chronicHeartFailureNYHA4: true })).toBe(6);
      expect(getSaps3ComorbidityScore({ ...baseValues, cirrhosis: true })).toBe(8);
      expect(getSaps3ComorbidityScore({ ...baseValues, aids: true })).toBe(8);
      expect(getSaps3ComorbidityScore({ ...baseValues, metastaticCancer: true })).toBe(11);

      // Multiple cumulative comorbidities: Metastatic Cancer (11) + Cirrhosis (8) + AIDS (8) = 27 pts
      expect(
        getSaps3ComorbidityScore({
          ...baseValues,
          metastaticCancer: true,
          cirrhosis: true,
          aids: true,
        }),
      ).toBe(11 + 8 + 8);
    });
  });

  describe('SAPS 3 - Box II: Circunstâncias da Admissão e Combinações de Motivos', () => {
    it('should score planned vs unplanned ICU admission', () => {
      expect(SAPS3_RULES.plannedIcuAdmission.planned).toBe(0);
      expect(SAPS3_RULES.plannedIcuAdmission.unplanned).toBe(3);
    });

    it('should score surgical status', () => {
      expect(getSaps3SurgicalStatusScore('scheduledSurgery')).toBe(0);
      expect(getSaps3SurgicalStatusScore('noSurgery')).toBe(5);
      expect(getSaps3SurgicalStatusScore('emergencySurgery')).toBe(6);
    });

    it('should score surgery site', () => {
      expect(getSaps3SurgerySiteScore('transplantation')).toBe(-11);
      expect(getSaps3SurgerySiteScore('trauma')).toBe(-8);
      expect(getSaps3SurgerySiteScore('cabgWithoutValvularRepair')).toBe(-6);
      expect(getSaps3SurgerySiteScore('neurosurgeryForStroke')).toBe(5);
      expect(getSaps3SurgerySiteScore('otherOrNone')).toBe(0);
    });

    it('should score acute infection as cumulative independent variables', () => {
      expect(getSaps3InfectionScore({})).toBe(0);
      expect(getSaps3InfectionScore({ nosocomial: true })).toBe(4);
      expect(getSaps3InfectionScore({ respiratory: true })).toBe(5);
      expect(getSaps3InfectionScore({ nosocomial: true, respiratory: true })).toBe(9);
    });

    it('should score individual admission reasons correctly', () => {
      expect(getSaps3AdmissionReasonScore({ cardiacRhythmDisturbance: true })).toBe(-5);
      expect(getSaps3AdmissionReasonScore({ hypovolemicShockHemorrhagic: true })).toBe(3);
      expect(getSaps3AdmissionReasonScore({ hypovolemicShockNonHemorrhagic: true })).toBe(3);
      expect(getSaps3AdmissionReasonScore({ septicShock: true })).toBe(5);
      expect(getSaps3AdmissionReasonScore({ anaphylacticOrMixedShock: true })).toBe(5);
      expect(getSaps3AdmissionReasonScore({ liverFailure: true })).toBe(6);
      expect(getSaps3AdmissionReasonScore({ acuteAbdomenOrOtherDigestive: true })).toBe(3);
      expect(getSaps3AdmissionReasonScore({ severePancreatitis: true })).toBe(9);
      expect(getSaps3AdmissionReasonScore({ seizures: true })).toBe(-4);
      expect(getSaps3AdmissionReasonScore({ comaStuporConfusionDelirium: true })).toBe(4);
      expect(getSaps3AdmissionReasonScore({ focalNeurologicalDeficit: true })).toBe(7);
      expect(getSaps3AdmissionReasonScore({ intracranialMassEffect: true })).toBe(10);
    });

    it('should score official special combination: rhythm + seizures = -4 (NOT -9)', () => {
      expect(
        getSaps3AdmissionReasonScore({
          cardiacRhythmDisturbance: true,
          seizures: true,
        }),
      ).toBe(-4);
    });

    it('should score both hemorrhagic and non-hemorrhagic hypovolemic shocks combined = +6', () => {
      expect(
        getSaps3AdmissionReasonScore({
          hypovolemicShockHemorrhagic: true,
          hypovolemicShockNonHemorrhagic: true,
        }),
      ).toBe(3 + 3);
    });

    it('should combine multiple reasons across systems correctly', () => {
      // Choque séptico (+5) + Pancreatite grave (+9) = +14
      expect(
        getSaps3AdmissionReasonScore({
          septicShock: true,
          severePancreatitis: true,
        }),
      ).toBe(5 + 9);

      // Insuficiência hepática (+6) + Déficit neurológico focal (+7) = +13
      expect(
        getSaps3AdmissionReasonScore({
          liverFailure: true,
          focalNeurologicalDeficit: true,
        }),
      ).toBe(6 + 7);

      // Ritmo (-5) + Convulsão (-4) [combinação especial = -4] + Pancreatite (+9) = +5
      expect(
        getSaps3AdmissionReasonScore({
          cardiacRhythmDisturbance: true,
          seizures: true,
          severePancreatitis: true,
        }),
      ).toBe(-4 + 9);
    });
  });

  describe('SAPS 3 - Box III: Fisiologia e Limites Exatos', () => {
    it('should validate Glasgow Coma Scale (4, 5, 6, 7, 12, 13, 15)', () => {
      expect(getRangeScore(4, SAPS3_RULES.gcs)).toBe(15);
      expect(getRangeScore(5, SAPS3_RULES.gcs)).toBe(10);
      expect(getRangeScore(6, SAPS3_RULES.gcs)).toBe(7);
      expect(getRangeScore(7, SAPS3_RULES.gcs)).toBe(2);
      expect(getRangeScore(12, SAPS3_RULES.gcs)).toBe(2);
      expect(getRangeScore(13, SAPS3_RULES.gcs)).toBe(0);
      expect(getRangeScore(15, SAPS3_RULES.gcs)).toBe(0);
    });

    it('should validate Heart Rate (119, 120, 159, 160)', () => {
      expect(getRangeScore(119, SAPS3_RULES.heartRate)).toBe(0);
      expect(getRangeScore(120, SAPS3_RULES.heartRate)).toBe(5);
      expect(getRangeScore(159, SAPS3_RULES.heartRate)).toBe(5);
      expect(getRangeScore(160, SAPS3_RULES.heartRate)).toBe(7);
    });

    it('should validate Systolic Blood Pressure (39, 40, 69, 70, 119, 120)', () => {
      expect(getRangeScore(39, SAPS3_RULES.systolicBp)).toBe(11);
      expect(getRangeScore(40, SAPS3_RULES.systolicBp)).toBe(8);
      expect(getRangeScore(69, SAPS3_RULES.systolicBp)).toBe(8);
      expect(getRangeScore(70, SAPS3_RULES.systolicBp)).toBe(3);
      expect(getRangeScore(119, SAPS3_RULES.systolicBp)).toBe(3);
      expect(getRangeScore(120, SAPS3_RULES.systolicBp)).toBe(0);
    });

    it('should validate Creatinine (1.19, 1.2, 1.99, 2, 3.49, 3.5)', () => {
      expect(getRangeScore(1.19, SAPS3_RULES.creatinine)).toBe(0);
      expect(getRangeScore(1.2, SAPS3_RULES.creatinine)).toBe(2);
      expect(getRangeScore(1.99, SAPS3_RULES.creatinine)).toBe(2);
      expect(getRangeScore(2.0, SAPS3_RULES.creatinine)).toBe(7);
      expect(getRangeScore(3.49, SAPS3_RULES.creatinine)).toBe(7);
      expect(getRangeScore(3.5, SAPS3_RULES.creatinine)).toBe(8);
    });

    it('should validate Platelets (19.99, 20, 49.99, 50, 99.99, 100)', () => {
      expect(getRangeScore(19.99, SAPS3_RULES.platelets)).toBe(13);
      expect(getRangeScore(20, SAPS3_RULES.platelets)).toBe(8);
      expect(getRangeScore(49.99, SAPS3_RULES.platelets)).toBe(8);
      expect(getRangeScore(50, SAPS3_RULES.platelets)).toBe(5);
      expect(getRangeScore(99.99, SAPS3_RULES.platelets)).toBe(5);
      expect(getRangeScore(100, SAPS3_RULES.platelets)).toBe(0);
    });

    it('should validate Bilirubin (1.99, 2, 5.99, 6)', () => {
      expect(getRangeScore(1.99, SAPS3_RULES.bilirubin)).toBe(0);
      expect(getRangeScore(2.0, SAPS3_RULES.bilirubin)).toBe(4);
      expect(getRangeScore(5.99, SAPS3_RULES.bilirubin)).toBe(4);
      expect(getRangeScore(6.0, SAPS3_RULES.bilirubin)).toBe(5);
    });

    it('should validate Temperature (34.99, 35)', () => {
      expect(getRangeScore(34.99, SAPS3_RULES.temperature)).toBe(7);
      expect(getRangeScore(35.0, SAPS3_RULES.temperature)).toBe(0);
    });

    it('should validate pH (7.25 and >7.25)', () => {
      expect(getRangeScore(7.25, SAPS3_RULES.ph)).toBe(3);
      expect(getRangeScore(7.26, SAPS3_RULES.ph)).toBe(0);
    });

    it('should validate Leukocytes (<15.0, >=15.0)', () => {
      expect(getRangeScore(14.99, SAPS3_RULES.leukocytes)).toBe(0);
      expect(getRangeScore(15.0, SAPS3_RULES.leukocytes)).toBe(2);
    });

    it('should validate the 8 required Oxygenation cases strictly without silent fallbacks', () => {
      // 1. MV + P/F < 100 -> 11 pts
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: true,
          pao2Fio2: 80,
        }),
      ).toBe(11);

      // 2. MV + P/F = 100 -> 7 pts
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: true,
          pao2Fio2: 100,
        }),
      ).toBe(7);

      // 3. MV + P/F > 100 -> 7 pts
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: true,
          pao2Fio2: 250,
        }),
      ).toBe(7);

      // 4. Sem MV + PaO2 < 60 -> 5 pts
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: false,
          pao2: 50,
        }),
      ).toBe(5);

      // 5. Sem MV + PaO2 = 60 -> 0 pts
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: false,
          pao2: 60,
        }),
      ).toBe(0);

      // 6. Sem MV + PaO2 > 60 -> 0 pts
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: false,
          pao2: 85,
        }),
      ).toBe(0);

      // 7. MV sem PaO2/FiO2 -> retorno seguro 0 (não quebra signals/computed)
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: true,
          pao2Fio2: undefined,
        }),
      ).toBe(0);

      // 8. Sem MV sem PaO2 -> retorno seguro 0 (não quebra signals/computed)
      expect(
        getSaps3OxygenationScore({
          mechanicalVentilation: false,
          pao2: undefined,
        }),
      ).toBe(0);
    });
  });

  describe('SAPS 3 - Cálculo Total e Mortalidade', () => {
    it('should calculate complete SAPS 3 score including baseline offset of 16 and combined reasons', () => {
      const samplePatient: Saps3Values = {
        /* Box I */
        age: 72, // 13 pts (70-74)
        hospitalStayBeforeIcuDays: 20, // 6 pts (14-27)
        preIcuLocation: 'other', // 8 pts
        cancerTherapy: false,
        metastaticCancer: true, // 11 pts
        hematologicCancer: false,
        chronicHeartFailureNYHA4: false,
        cirrhosis: false,
        aids: false,
        vasoactiveDrugsBeforeIcu: true, // 3 pts

        /* Box II */
        plannedIcuAdmission: false, // 3 pts
        admissionReasons: {
          septicShock: true, // 5 pts
          severePancreatitis: true, // 9 pts
        },
        surgicalStatus: 'emergencySurgery', // 6 pts
        surgerySite: 'neurosurgeryForStroke', // 5 pts
        acuteInfections: {
          respiratory: true, // 5 pts
        },

        /* Box III */
        gcs: 6, // 7 pts
        bilirubin: 3.0, // 4 pts
        temperature: 34.0, // 7 pts
        creatinine: 2.5, // 7 pts
        heartRate: 135, // 5 pts
        leukocytes: 18.0, // 2 pts
        ph: 7.15, // 3 pts
        platelets: 35, // 8 pts
        systolicBp: 55, // 8 pts
        mechanicalVentilation: true,
        pao2Fio2: 80, // 11 pts
      };

      // Box 1: 13 + 6 + 8 + 11 + 3 = 41
      expect(calculateSaps3Box1(samplePatient)).toBe(41);

      // Box 2: 3 + (5 + 9) + 6 + 5 + 5 = 33
      expect(calculateSaps3Box2(samplePatient)).toBe(33);

      // Box 3: 7 + 4 + 7 + 7 + 5 + 2 + 3 + 8 + 8 + 11 = 62
      expect(calculateSaps3Box3(samplePatient)).toBe(62);

      // Total = 16 (offset) + 41 + 33 + 62 = 152
      const totalScore = calculateSaps3Score(samplePatient);
      expect(totalScore).toBe(16 + 41 + 33 + 62);
      expect(totalScore).toBe(152);

      const summary = summarizeSaps3(totalScore);
      expect(summary.label).toBe('Risco crítico');
      expect(summary.total).toBe(152);
      expect(summary.tone).toBe('critical');

      const mortalityLatAm = Number(calculateSaps3MortalityCentralSouthAmerica(totalScore));
      const mortalityGlobal = Number(calculateSaps3MortalityGlobal(totalScore));
      expect(mortalityLatAm).toBeGreaterThan(80);
      expect(mortalityGlobal).toBeGreaterThan(80);
    });
  });

  /* ==========================================================================
   * PRESENTATION & BANNER INTEGRATION
   * ======================================================================== */
  it('should display the hospital presentation component on startup', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(app.showPresentation()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-hospital-presentation')).toBeTruthy();
    expect(compiled.querySelector('.presentation-title')?.textContent).toContain(
      'Instituto de Tecnologia em Gestão Aplicada',
    );
    expect(compiled.querySelectorAll('.featured-service-card').length).toBe(3);
  });

  it('should close presentation when closePresentation is called', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(app.showPresentation()).toBe(true);

    app.closePresentation();
    fixture.detectChanges();
    expect(app.showPresentation()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-hospital-presentation')).toBeFalsy();
  });

  it('should render the promo banner on calculator and allow reopening the presentation', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.closePresentation();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(app.showPresentation()).toBe(false);

    // Banner is rendered
    const banner = fixture.nativeElement.querySelector('app-hospital-banner');
    expect(banner).toBeTruthy();

    // Click banner CTA button
    const bannerBtn = fixture.nativeElement.querySelector(
      '.banner-cta-button',
    ) as HTMLButtonElement;
    expect(bannerBtn).toBeTruthy();
    bannerBtn.click();
    fixture.detectChanges();

    expect(app.showPresentation()).toBe(true);
    expect(app.presentationMode()).toBe('free');
    expect(fixture.nativeElement.querySelector('app-hospital-presentation')).toBeTruthy();
  });
});