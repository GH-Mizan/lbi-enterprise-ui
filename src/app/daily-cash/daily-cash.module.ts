import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DailyCashRoutingModule } from './daily-cash-routing.module';
import { DailyCashComponent } from './daily-cash.component';
import { DailyCashEntryComponent } from './daily-cash-entry/daily-cash-entry.component';
import { SharedModule } from '@shared/shared.module';
import { VoucherEntryComponent } from './voucher-entry/voucher-entry.component';
import { DailyCashReconciliationComponent } from './reconciliation/daily-cash-reconciliation.component';

@NgModule({
  declarations: [
    DailyCashComponent,
    DailyCashEntryComponent,
    VoucherEntryComponent,
    DailyCashReconciliationComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    DailyCashRoutingModule,
  ]
})
export class DailyCashModule { }
