// data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DailyCashType } from '../../app/daily-cash/voucher-entry/voucher-entry.component';

@Injectable({ providedIn: 'root' })
export class DataSharingService {
  private vouchersSource = new BehaviorSubject<DailyCashType[]>([]);
  currentVouchers$ = this.vouchersSource.asObservable();

  setVouchers(vouchers: DailyCashType[]) {
    this.vouchersSource.next(vouchers); // Pushes new data to subscribers
  }
}
