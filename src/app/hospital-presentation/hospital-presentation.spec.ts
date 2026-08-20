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

  it('should allow returning to calculator immediately from top navigation back button', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    const topBtn = fixture.nativeElement.querySelector(
      '.btn-back-nav',
    ) as HTMLButtonElement;
    expect(topBtn).toBeTruthy();
    topBtn.click();

    expect(emitted).toBe(true);
  });

  it('should allow returning to calculator immediately from bottom action button', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    let emitted = false;
    component.closed.subscribe(() => {
      emitted = true;
    });

    const bottomBtn = fixture.nativeElement.querySelector(
      '.presentation-action-btn',
    ) as HTMLButtonElement;
    expect(bottomBtn).toBeTruthy();
    bottomBtn.click();

    expect(emitted).toBe(true);
  });
});
