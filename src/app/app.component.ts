import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AddressService } from './service/address.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'location';

  lat: string = '';
  lng: string = '';
  result: string = '';
  error: string = '';

  constructor(
    private addressService: AddressService,
    private http: HttpClient,
    private router: Router
  ) {}

  getAddress() {
    if (!this.lat || !this.lng) {
      this.error = 'Please enter both latitude and longitude.';
      this.result = '';
      return;
    }

    this.error = '';
    this.result = 'Fetching address...';

    this.addressService.getAddress(+this.lat, +this.lng).subscribe({
      next: (data) => {
        this.result = `Address: ${data.address} (Source: ${data.source || 'API'})`;
      },
      error: (err) => {
        console.error('Error fetching address:', err);
        this.result = '';
        this.error = 'Failed to fetch address. Please try again.';
      },
    });
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.error = 'Geolocation is not supported by your browser.';
      this.result = '';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.lat = latitude.toString();
        this.lng = longitude.toString();
        this.getAddress();
      },
      (err) => {
        console.error('Error getting location:', err);
        this.error = 'Failed to get location. Please try again.';
        this.result = '';
      }
    );
  }

  navigatetoSql() {
    this.router.navigate(['/sql']);
  }
}
