// data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DailyCashType } from '../../app/daily-cash/voucher-entry/voucher-entry.component';

@Injectable({ providedIn: 'root' })
export class DataSharingService {
  private vouchersSource = new BehaviorSubject<DailyCashType[]>([]);
  currentVouchers$ = this.vouchersSource.asObservable();

  private voucherDate = new BehaviorSubject<any>(undefined);
  voucherDate$ = this.voucherDate.asObservable();

  setVouchers(vouchers: DailyCashType[]) {
    this.vouchersSource.next(vouchers); // Pushes new data to subscribers
  }

  setVoucherDate(date: any) {
    this.voucherDate.next(date); // Pushes new data to subscribers
  }
}
