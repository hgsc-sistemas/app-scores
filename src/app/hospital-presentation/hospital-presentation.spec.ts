import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HospitalPresentation } from './hospital-presentation';

describe('HospitalPresentation', () => {
  let fixture: ComponentFixture<HospitalPresentation>;
  let component: HospitalPresentation;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalPresentation],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalPresentation);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the presentation component', () => {
    expect(component).toBeTruthy();
  });

  it('should render hospital branding, services cards, infrastructure and differentials', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.presentation-title')?.textContent).toContain(
      'Hospital & Centro de Saúde',
    );
    expect(compiled.querySelectorAll('.service-card').length).toBeGreaterThanOrEqual(6);
    expect(compiled.querySelectorAll('.infra-card').length).toBeGreaterThanOrEqual(3);
    expect(compiled.querySelectorAll('.differential-item').length).toBeGreaterThanOrEqual(3);
  });

  describe('Initial Onboarding Mode (isInitialOnboarding: true - ao carregar o site)', () => {
    it('should show fixed bottom bar with progress bar and locked button initially, unlocking at 100%', async () => {
      fixture.componentRef.setInput('isInitialOnboarding', true);
      component.scrollProgress.set(40);
      component.hasReachedBottom.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.fixed-bottom-bar')).toBeTruthy();
      expect(compiled.querySelector('.presentation-top-nav')).toBeFalsy();

      const progressFill = compiled.querySelector('.progress-bar-fill') as HTMLElement;
      expect(progressFill.style.width).toBe('40%');

      const btn = compiled.querySelector('.fixed-action-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toContain('40%');
      expect(component.canClose()).toBe(false);

      // Atinge 100%
      component.scrollProgress.set(100);
      component.hasReachedBottom.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.canClose()).toBe(true);
      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toContain('Ir para a Calculadora');

      let emitted = false;
      component.closed.subscribe(() => {
        emitted = true;
      });

      btn.click();
      expect(emitted).toBe(true);
    });
  });

  describe('Free On-Demand Mode (isInitialOnboarding: false - ao clicar no banner)', () => {
    it('should render top back button and allow leaving immediately without scroll lock', async () => {
      fixture.componentRef.setInput('isInitialOnboarding', false);
      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.presentation-top-nav')).toBeTruthy();
      expect(compiled.querySelector('.fixed-bottom-bar')).toBeFalsy();

      expect(component.canClose()).toBe(true);

      let emitted = false;
      component.closed.subscribe(() => {
        emitted = true;
      });

      const topBtn = compiled.querySelector('.btn-back-nav') as HTMLButtonElement;
      expect(topBtn).toBeTruthy();
      topBtn.click();

      expect(emitted).toBe(true);
    });
  });
});
