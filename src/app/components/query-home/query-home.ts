import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QueryBuilderAuthService } from '../../services/query-builder-auth.service';
import { QueryBuilderService, Database, QueryResponse } from '../../services/query-builder.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-query-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './query-home.html',
  styleUrls: ['./query-home.css']
})
export class QueryHomeComponent implements OnInit, OnDestroy {
  databases: Database[] = [];
  queries: QueryResponse[] = [];
  selectedDatabaseId: number | null = null;
  selectedDatabaseToEdit: Database | null = null;
  
  queryForm!: FormGroup;
  databaseForm!: FormGroup;
  editDatabaseForm!: FormGroup;
  generatedQuery: string = '';
  isGenerating: boolean = false;
  isCreatingDB: boolean = false;
  isEditingDB: boolean = false;
  isDeletingDB: boolean = false;
  showCreateDatabase: boolean = false;
  showEditDatabase: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: QueryBuilderAuthService,
    private queryBuilderService: QueryBuilderService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.queryForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
    this.databaseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      sqlSchema: ['', [Validators.required, Validators.minLength(20)]]
    });
    this.editDatabaseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      sqlSchema: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit(): void {
    this.loadDatabases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDatabases(): void {
    this.queryBuilderService.getAllDatabases()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.databases = response.data || [];
          if (this.databases && this.databases.length > 0) {
            this.selectedDatabaseId = this.databases[0].id;
            this.loadQueries();
          }
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar las bases de datos';
          this.databases = [];
        }
      });
  }

  onDatabaseChange(): void {
    if (this.selectedDatabaseId) {
      this.loadQueries();
      this.generatedQuery = '';
      this.queryForm.reset();
    }
  }

  loadQueries(): void {
    if (!this.selectedDatabaseId) return;

    this.queryBuilderService.getAllQueries(this.selectedDatabaseId, 50, 0, 'createdAt')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.queries = response.data || [];
        },
        error: (error) => {
          this.queries = [];
        }
      });
  }

  generateQuery(): void {
    if (this.queryForm.invalid || !this.selectedDatabaseId) {
      return;
    }

    this.isGenerating = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.generatedQuery = '';

    const { description } = this.queryForm.value;

    this.queryBuilderService.generateQuery({
      databaseId: this.selectedDatabaseId,
      description
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isGenerating = false;
          // El API devuelve generatedSql, asignarlo a generatedQuery para la UI
          this.generatedQuery = response.data.generatedSql;
          this.successMessage = 'Query generada exitosamente';
          this.loadQueries();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.isGenerating = false;
          this.errorMessage = error.message || 'Error al generar la consulta';
        }
      });
  }

  copyToClipboard(): void {
    if (!this.generatedQuery) return;

    navigator.clipboard.writeText(this.generatedQuery).then(() => {
      this.successMessage = 'Query copiada al portapapeles';
      setTimeout(() => this.successMessage = null, 2000);
    }).catch(() => {
      this.errorMessage = 'Error al copiar la query';
    });
  }

  deleteQuery(queryId: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta consulta?')) {
      return;
    }

    console.log('🗑️ Eliminando query:', queryId);
    this.queryBuilderService.deleteQuery(queryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Query eliminada';
          this.loadQueries();
          setTimeout(() => this.successMessage = null, 2000);
        },
        error: (error) => {
          this.errorMessage = 'Error al eliminar la consulta';
        }
      });
  }

  selectQuery(query: QueryResponse): void {
    this.queryForm.patchValue({ description: query.description });
    // El API devuelve generatedSql, asignarlo a generatedQuery para la UI
    this.generatedQuery = query.generatedSql;
  }

  resetForm(): void {
    this.queryForm.reset();
    this.generatedQuery = '';
    this.errorMessage = null;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/query-auth']);
  }

  createDatabase(): void {
    if (this.databaseForm.invalid) {
      return;
    }

    this.isCreatingDB = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { name, description, sqlSchema } = this.databaseForm.value;

    this.queryBuilderService.createDatabase(name, description, sqlSchema)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isCreatingDB = false;
          this.showCreateDatabase = false;
          this.databaseForm.reset();
          this.successMessage = 'Base de datos creada exitosamente';
          this.loadDatabases();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.isCreatingDB = false;
          this.errorMessage = error.message || 'Error al crear la base de datos';
        }
      });
  }

  startEditDatabase(databaseId: number | null): void {
    if (!databaseId) {
      return;
    }
    
    // Primero intenta encontrar en el array local
    let db = this.databases.find(d => d.id === databaseId);
    
    // Si no existe en el array local, obtenerlo del API
    if (!db) {
      this.queryBuilderService.getDatabase(databaseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const fetchedDb = response.data;
            this.selectedDatabaseToEdit = fetchedDb;
            this.editDatabaseForm.patchValue({
              name: fetchedDb.name,
              description: fetchedDb.description,
              sqlSchema: fetchedDb.sqlSchema
            });
            this.showEditDatabase = true;
          },
          error: (error) => {
            this.errorMessage = 'Error al cargar la base de datos';
          }
        });
    } else {
      // Si existe en el array local, usar directamente
      this.selectedDatabaseToEdit = db;
      this.editDatabaseForm.patchValue({
        name: db.name,
        description: db.description,
        sqlSchema: db.sqlSchema
      });
      this.showEditDatabase = true;
    }
  }

  editDatabase(): void {
    if (this.editDatabaseForm.invalid || !this.selectedDatabaseToEdit) {
      return;
    }

    this.isEditingDB = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { name, description, sqlSchema } = this.editDatabaseForm.value;

    this.queryBuilderService.updateDatabase(this.selectedDatabaseToEdit.id, name, description, sqlSchema)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isEditingDB = false;
          this.showEditDatabase = false;
          this.selectedDatabaseToEdit = null;
          this.editDatabaseForm.reset();
          this.successMessage = 'Base de datos actualizada exitosamente';
          this.loadDatabases();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.isEditingDB = false;
          this.errorMessage = error.message || 'Error al actualizar la base de datos';
        }
      });
  }

  deleteDatabaseWithQueries(dbId: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta base de datos? Se eliminarán también todas sus consultas.')) {
      return;
    }

    this.isDeletingDB = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Primero eliminar todos los queries de la BD
    const queriesToDelete = this.queries.filter(q => q.databaseId === dbId).map(q => q.id);
    
    // Si hay queries, eliminarlos primero
    if (queriesToDelete.length > 0) {
      let deleteCount = 0;
      queriesToDelete.forEach(queryId => {
        this.queryBuilderService.deleteQuery(queryId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              deleteCount++;
              if (deleteCount === queriesToDelete.length) {
                // Todos los queries eliminados, ahora eliminar la BD
                this.deleteDatabase(dbId);
              }
            },
            error: (error) => {
              this.isDeletingDB = false;
              this.errorMessage = 'Error al eliminar los queries de la base de datos';
            }
          });
      });
    } else {
      // No hay queries, eliminar directamente la BD
      this.deleteDatabase(dbId);
    }
  }

  private deleteDatabase(dbId: number): void {
    this.queryBuilderService.deleteDatabase(dbId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeletingDB = false;
          this.successMessage = 'Base de datos eliminada exitosamente';
          if (this.selectedDatabaseId === dbId) {
            this.selectedDatabaseId = null;
            this.generatedQuery = '';
            this.queryForm.reset();
            this.queries = [];
          }
          this.loadDatabases();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (error) => {
          this.isDeletingDB = false;
          this.errorMessage = 'Error al eliminar la base de datos';
        }
      });
  }
}

