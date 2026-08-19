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
    expect(compiled.querySelector('.presentation-title')?.textContent).toContain('Hospital & Centro de Saúde');
    expect(compiled.querySelectorAll('.service-card').length).toBeGreaterThanOrEqual(6);
    expect(compiled.querySelectorAll('.infra-card').length).toBeGreaterThanOrEqual(3);
    expect(compiled.querySelectorAll('.differential-item').length).toBeGreaterThanOrEqual(3);
  });

  it('should display the fixed bottom bar with progress bar and locked button initially', async () => {
    component.scrollProgress.set(25);
    component.hasReachedBottom.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fixed-bottom-bar')).toBeTruthy();
    expect(compiled.querySelector('.progress-bar-track')).toBeTruthy();

    const progressFill = compiled.querySelector('.progress-bar-fill') as HTMLElement;
    expect(progressFill.style.width).toBe('25%');

    const btn = compiled.querySelector('.presentation-action-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('25%');
    expect(component.canClose()).toBe(false);
  });

  it('should unlock the button and allow closing when reaching 100% scroll progress', async () => {
    component.scrollProgress.set(100);
    component.hasReachedBottom.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.canClose()).toBe(true);

    const btn = fixture.nativeElement.querySelector('.presentation-action-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.classList.contains('unlocked')).toBe(true);
    expect(btn.textContent).toContain('Ir para a Calculadora');

    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    component.handleClose();
    expect(emitted).toBe(true);
  });
});
