import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-query-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './query-builder.html',
  styleUrls: ['./query-builder.css']
})
export class QueryBuilderComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/pacientes']);
  }
}
