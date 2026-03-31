import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { QueryBuilderAuthService } from '../services/query-builder-auth.service';

@Injectable({
  providedIn: 'root'
})
export class QueryBuilderGuard implements CanActivate {
  constructor(
    private authService: QueryBuilderAuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.getToken()) {
      return true;
    }
    this.router.navigate(['/query-auth']);
    return false;
  }
}
