import { TestBed } from '@angular/core/testing';
import { App, calculateNews2Score, calculateSaps2Score, summarizeNews2, summarizeSaps2 } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the score selector', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Calculadora de escores');
    expect(compiled.querySelectorAll('.score-tab').length).toBe(2);
  });

  it('should render button-based selectors for the score table', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.option-button').length).toBeGreaterThan(0);
  });

  it('should calculate a NEWS2 score and classify risk', () => {
    const score = calculateNews2Score({
      respiratoryRate: 24,
      oxygenSaturation: 90,
      systolicBp: 92,
      heartRate: 120,
      temperature: 38.5,
      consciousness: 'A',
      oxygenSupplement: true,
    });

    expect(score).toBeGreaterThan(0);
    expect(summarizeNews2(score).label).toContain('Risco');
  });

  it('should calculate a SAPS 2 score and classify urgency', () => {
    // Objeto atualizado com as variáveis reais do SAPS 2
    const score = calculateSaps2Score({
      age: 74,
      heartRate: 130,
      systolicBp: 80,
      temperature: 39.1,
      gcs: 12,
      sodium: 138,
      potassium: 5.7,
      bicarbonate: 16,
      bilirubin: 6,
      leukocytes: 18,
      mechanicalVentilation: true,
      pao2Fio2: 95,
      urineOutput: 400,
      bun: 85,
      admissionType: 'medical',
      metastaticCancer: false,
      hematologicMalignancy: false,
      aids: false,
    });

    expect(score).toBeGreaterThan(30);
    expect(summarizeSaps2(score).label).toContain('Gravidade');
  });
});