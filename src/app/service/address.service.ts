import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  // private apiUrl = 'http://localhost:3000/api/getAddress'; 
  private sqlUpdateUrl = 'http://localhost:3001/api/updateAddresses';

  private sqlGetUrl = 'http://localhost:3003/api/fetchBatch';;

  private apiUrl = 'http://122.160.136.241:3001/api/getAddress';
  
  private username = 'etp'; 
  private password = 'core@1986';

  constructor(private http: HttpClient) {}

  getAddress(lat: number, lng: number): Observable<any> {
    // Encode username and password for Basic Auth
    const basicAuth = btoa(`${this.username}:${this.password}`);
    
    // Set headers with Authorization
    const headers = new HttpHeaders({
      Authorization: `Basic ${basicAuth}`,
    });
    return this.http.get<any>(`${this.apiUrl}?lat=${lat}&lng=${lng}`, { headers });
  }


  //Service to update SQL TAble Address
  updateAddresses(): Observable<any> {
    return this.http.get(this.sqlUpdateUrl);
  }

  fetchBatch(): Observable<any[]> {
    return this.http.get<any[]>(this.sqlGetUrl); // Make GET request to fetchBatch endpoint
  }
}
