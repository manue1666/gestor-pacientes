import { TestBed } from '@angular/core/testing';

import { PacientesService} from './pacientes';

describe('Pacientes', () => {
  let service: PacientesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PacientesService );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
