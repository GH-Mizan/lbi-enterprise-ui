import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DailyCashComponent } from './daily-cash.component';
import { DailyCashEntryComponent } from './daily-cash-entry/daily-cash-entry.component';
import { VoucherEntryComponent } from './voucher-entry/voucher-entry.component';
import { DailyCashReconciliationComponent } from './reconciliation/daily-cash-reconciliation.component';
import { DailyCashViewComponent } from './daily-cash-view/daily-cash-view.component';
import { DailyCashCreateComponent } from './daily-cash-create/daily-cash-create.component';

const routes: Routes = [
  { path: '', component: DailyCashComponent },
  { path: 'create', component: DailyCashCreateComponent },
  { path: 'edit/:id', component: DailyCashEntryComponent },
  { path: 'voucher-entry', component: VoucherEntryComponent },
  { path: 'reconciliation', component: DailyCashReconciliationComponent },
  { path: 'view/:id', component: DailyCashViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DailyCashRoutingModule { }
