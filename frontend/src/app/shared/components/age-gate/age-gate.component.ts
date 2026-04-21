import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgeGateService, computeAge } from '../../../core/services/age-gate.service';

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-age-gate',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './age-gate.component.html',
  styleUrl: './age-gate.component.scss',
})
export class AgeGateComponent {
  private readonly gate = inject(AgeGateService);

  readonly minAge = this.gate.minAge;
  readonly maxAge = this.gate.maxReasonableAge;
  readonly needsGate = this.gate.needsGate;
  readonly blocked = this.gate.blocked;

  readonly isOpen = computed(() => this.needsGate() || this.blocked());

  readonly today = new Date();
  readonly currentYear = this.today.getFullYear();

  readonly months: MonthOption[] = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  readonly years: number[] = Array.from(
    { length: this.maxAge + 1 },
    (_, i) => this.currentYear - i,
  );

  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = new FormGroup({
    day: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    month: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    year: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  /** Días disponibles según mes/año (28–31 según corresponda). */
  readonly days = computed<number[]>(() => {
    const m = Number(this.form.controls.month.value);
    const y = Number(this.form.controls.year.value);
    if (m >= 1 && m <= 12) {
      const total = y ? new Date(y, m, 0).getDate() : 31;
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    return Array.from({ length: 31 }, (_, i) => i + 1);
  });

  readonly currentAge = computed<number | null>(() => {
    const d = Number(this.form.controls.day.value);
    const m = Number(this.form.controls.month.value);
    const y = Number(this.form.controls.year.value);
    if (!d || !m || !y) return null;
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return null;
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    if (date.getTime() > Date.now()) return null;
    return computeAge(date);
  });

  readonly allFilled = computed(() =>
    Boolean(
      this.form.controls.day.value &&
        this.form.controls.month.value &&
        this.form.controls.year.value,
    ),
  );

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (typeof document === 'undefined') return;
      if (open) {
        document.body.classList.add('is-age-gate-open');
      } else {
        document.body.classList.remove('is-age-gate-open');
      }
    });

    // Si el día elegido no cabe en el mes/año, ajustarlo automáticamente.
    effect(
      () => {
        const valid = this.days();
        const current = Number(this.form.controls.day.value);
        if (current && !valid.includes(current)) {
          this.form.controls.day.setValue(String(valid[valid.length - 1]));
        }
      },
      { allowSignalWrites: true },
    );
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  submit(): void {
    this.error.set(null);
    if (this.form.invalid || !this.allFilled() || this.submitting()) {
      this.form.markAllAsTouched();
      this.error.set('Completa día, mes y año de nacimiento.');
      return;
    }
    const d = Number(this.form.controls.day.value);
    const m = Number(this.form.controls.month.value);
    const y = Number(this.form.controls.year.value);
    const iso = `${y}-${this.pad(m)}-${this.pad(d)}`;

    this.submitting.set(true);
    const result = this.gate.verifyFromDate(iso);
    this.submitting.set(false);

    if (!result.ok) {
      if (result.reason === 'invalid') {
        this.error.set('Esa fecha no es válida. Revisa el día, mes y año.');
      } else if (result.reason === 'unrealistic') {
        this.error.set(
          `La edad calculada no es realista. Verifica el año de nacimiento (máximo ${this.maxAge} años).`,
        );
      } else if (result.reason === 'underage') {
        this.error.set(null);
      }
    }
  }

  retry(): void {
    this.form.reset({ day: '', month: '', year: '' });
    this.error.set(null);
    this.gate.retry();
  }
}
