import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { AddressService } from '../service/address.service';

@Component({
  selector: 'app-sql-table',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './sql-table.component.html',
  styleUrl: './sql-table.component.css'
})
export class SqlTableComponent {
  updatedData: any[] = [];
  loading: boolean = false; // Loader state

  constructor(private addressService: AddressService) {}

 
  updateAddresses(): void {
    this.loading = true; // Show the loader
  
    this.addressService.updateAddresses().subscribe(
      response => {
        alert('Addresses updated successfully!');
        this.updatedData = response.data; // Store the updated data
        console.log(response);
        this.loading = false; // Ensure loader is stopped after success
      },
      error => {
        alert('Failed to update addresses.');
        console.error(error);
        this.loading = false; // Ensure loader is stopped after error
      }
    );
  }

  getSqlData() {
    this.addressService.fetchBatch().subscribe(
      response => {
        console.log('Batch processing started:', response);
      },
      error => {
        console.error('Error triggering batch processing:', error);
      }
    );

  }
  
  }


