import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HospitalBanner } from './hospital-banner';

describe('HospitalBanner', () => {
  let fixture: ComponentFixture<HospitalBanner>;
  let component: HospitalBanner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalBanner);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the banner component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the initial promo slide with services', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hospital-promo-banner')).toBeTruthy();
    expect(compiled.querySelector('.banner-slide-title')?.textContent).toContain(
      'Pronto Atendimento',
    );
  });

  it('should navigate to the CTA slide and emit open event on button click', async () => {
    component.goToSlide(5);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.banner-slide-title')?.textContent).toContain(
      'Conheça o Nosso Hospital',
    );

    let emitted = false;
    component.open.subscribe(() => {
      emitted = true;
    });

    const btn = compiled.querySelector(
      '.banner-cta-button',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(emitted).toBe(true);
  });
});
