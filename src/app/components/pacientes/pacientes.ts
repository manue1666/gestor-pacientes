import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PacientesService } from '../../services/pacientes';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Paciente } from '../../models/paciente.model';
import { EmailFormatPipe } from '../../pipes/email-format-pipe';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmailFormatPipe],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.css']
})
export class PacientesComponent implements OnInit, OnDestroy {
  pacienteForm: FormGroup;
  pacientes: Paciente[] = [];
  editingId: string | null = null;
  user$: Observable<any>;
  isLoading: boolean = false;
  
  private destroy$ = new Subject<void>();
  readonly soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.pacienteForm = this.createForm();
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.loadPacientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        Validators.pattern(this.soloLetrasRegex)
      ]],
      apellidos: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200),
        Validators.pattern(this.soloLetrasRegex)
      ]],
      fechaNacimiento: ['', Validators.required],
      domicilio: ['', [
        Validators.required,
        Validators.minLength(5)
      ]],
      correoElectronico: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  loadPacientes(): void {
    this.isLoading = true;
    console.log('🔍 Iniciando carga de pacientes...');
    
    this.pacientesService.getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Pacientes cargados:', data);
          console.log('📊 Cantidad de pacientes:', data.length);
          this.pacientes = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar pacientes:', error);
          console.error('Error completo:', JSON.stringify(error, null, 2));
          alert('❌ Error al cargar la lista de pacientes');
          this.isLoading = false;
        },
        complete: () => {
          console.log('✅ Observable completado');
        }
      });
  }

  onSubmit(): void {
    if (this.pacienteForm.invalid) {
      this.markFormGroupTouched(this.pacienteForm);
      alert('⚠️ Por favor, completa todos los campos correctamente');
      return;
    }

    const ownerId = this.authService.getCurrentUserId();
    if (!ownerId) {
      alert('❌ Debes estar autenticado para agregar pacientes');
      return;
    }

    const paciente: Paciente = {
      ...this.pacienteForm.value,
      fechaNacimiento: new Date(this.pacienteForm.value.fechaNacimiento),
      ownerId: ownerId
    };

    this.editingId ? this.updatePaciente(paciente) : this.addPaciente(paciente);
  }

  addPaciente(paciente: Paciente): void {
    this.isLoading = true;
    console.log('📝 Agregando paciente:', paciente);
    
    const currentUserId = this.authService.getCurrentUserId();
    const pacienteConOwner: Paciente = {
      ...paciente,
      ownerId: currentUserId || ''
    };
    
    this.pacientesService.addPaciente(pacienteConOwner)
      .then(() => {
        console.log('✅ Paciente agregado a Firebase');
        alert('✅ Paciente agregado exitosamente');
        this.resetForm();
        this.loadPacientes();
      })
      .catch(error => {
        console.error('❌ Error al agregar paciente:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        alert('❌ Error al agregar el paciente');
        this.isLoading = false;
      });
  }

  updatePaciente(paciente: Paciente): void {
    if (!this.editingId) return;

    this.isLoading = true;
    this.pacientesService.updatePaciente(this.editingId, paciente)
      .then(() => {
        console.log('✅ Paciente actualizado exitosamente');
        alert('✅ Paciente actualizado exitosamente');
        this.resetForm();
        this.editingId = null;
        this.loadPacientes();
      })
      .catch(error => {
        console.error('Error al actualizar paciente:', error);
        alert('❌ Error al actualizar el paciente');
        this.isLoading = false;
      });
  }

  editPaciente(paciente: Paciente): void {
    this.editingId = paciente.id || null;
    const fechaFormateada = this.formatDateForInput(paciente.fechaNacimiento);

    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      apellidos: paciente.apellidos,
      fechaNacimiento: fechaFormateada,
      domicilio: paciente.domicilio,
      correoElectronico: paciente.correoElectronico
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePaciente(id: string | undefined): void {
    if (!id) return;

    if (confirm('¿Estás seguro de eliminar este paciente?')) {
      this.isLoading = true;
      this.pacientesService.deletePaciente(id)
        .then(() => {
          console.log('✅ Paciente eliminado exitosamente');
          alert('✅ Paciente eliminado exitosamente');
          this.loadPacientes();
        })
        .catch(error => {
          console.error('Error al eliminar paciente:', error);
          alert('❌ Error al eliminar el paciente');
          this.isLoading = false;
        });
    }
  }

  resetForm(): void {
    this.pacienteForm.reset();
    this.editingId = null;
  }

  private formatDateForInput(date: any): string {
    if (!date) return '';

    try {
      if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
      if (date?.toDate instanceof Function) {
        return date.toDate().toISOString().split('T')[0];
      }
      if (typeof date === 'string') {
        return date.split('T')[0];
      }
    } catch (e) {
      console.error('Error formateando fecha:', e);
    }

    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  logout(): void {
    this.authService.logout()
      .then(() => this.router.navigate(['/login']))
      .catch(error => {
        console.error('Error al cerrar sesión:', error);
        alert('❌ Error al cerrar sesión');
      });
  }
}

