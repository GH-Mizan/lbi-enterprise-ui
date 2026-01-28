import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DailyCashComponent } from './daily-cash.component';
import { DailyCashEntryComponent } from './daily-cash-entry/daily-cash-entry.component';
import { VoucherEntryComponent } from './voucher-entry/voucher-entry.component';
import { DailyCashReconciliationComponent } from './reconciliation/daily-cash-reconciliation.component';

const routes: Routes = [
  { path: '', component: DailyCashComponent },
  { path: 'create', component: DailyCashEntryComponent },
  { path: 'edit/:id', component: DailyCashEntryComponent },
  { path: 'voucher-entry', component: VoucherEntryComponent },
  { path: 'reconciliation', component: DailyCashReconciliationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DailyCashRoutingModule { }
