import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, retry, throwError } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ChatService {
	url = "http://localhost:5000/";

	constructor(private http: HttpClient) { }

	handleError(e: any) {
		console.log(e)
		return throwError(() => "Failed to get data")
	}

	chat(data: any) {
		return this.http.post(this.url, data).pipe(retry(1), catchError(this.handleError))
	}
}
