import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private firestore = inject(Firestore);
  private collectionName = 'pacientes';

  getPacientes(): Observable<Paciente[]> {
    const pacientesRef = collection(this.firestore, this.collectionName);
    const q = query(pacientesRef, orderBy('nombre'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((pacientes: any[]) =>
        pacientes.map(paciente => ({
          ...paciente,
          fechaNacimiento: paciente.fechaNacimiento?.toDate?.() || paciente.fechaNacimiento
        }))
      )
    ) as Observable<Paciente[]>;
  }

  addPaciente(paciente: Paciente): Promise<any> {
    const pacientesRef = collection(this.firestore, this.collectionName);
    return addDoc(pacientesRef, this.normalizarPaciente(paciente));
  }

  updatePaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
    const pacienteRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return updateDoc(pacienteRef, this.normalizarPaciente(paciente));
  }

  deletePaciente(id: string): Promise<void> {
    const pacienteRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return deleteDoc(pacienteRef);
  }

  private normalizarPaciente(paciente: any): any {
    return {
      nombre: paciente.nombre?.trim() || '',
      apellidos: paciente.apellidos?.trim() || '',
      fechaNacimiento: paciente.fechaNacimiento,
      domicilio: paciente.domicilio?.trim() || '',
      correoElectronico: paciente.correoElectronico?.toLowerCase().trim() || ''
    };
  }
}