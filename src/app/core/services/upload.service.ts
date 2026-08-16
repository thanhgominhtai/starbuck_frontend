import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:3000';

export interface UploadResponse {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);

  uploadImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${API_BASE}/upload/image`, formData);
  }
}
