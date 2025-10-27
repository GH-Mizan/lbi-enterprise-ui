import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchasesRoutingModule } from './purchases-routing.module';
import { SharedModule } from '@shared/shared.module';
import { PurchasesComponent } from './purchases.component';
import { PurchaseEntryComponent } from './purchase-entry/purchase-entry.component';
import { DuePaymentEntryComponent } from './due-payment-entry/due-payment-entry.component';
import { DuePaymentHistoryComponent } from './due-payment-histories/due-payment-histories.component';
import { PurchaseDetailsComponent } from './details/purchase-details.component';


@NgModule({
  declarations: [
    PurchasesComponent,
    PurchaseEntryComponent,
    DuePaymentEntryComponent,
    DuePaymentHistoryComponent,
    PurchaseDetailsComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    PurchasesRoutingModule
  ]
})
export class PurchasesModule { }
