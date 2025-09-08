import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchasesComponent } from './purchases.component';
import { PurchaseEntryComponent } from './purchase-entry/purchase-entry.component';

const routes: Routes = [
  { path: '', component: PurchasesComponent },
  { path: 'create', component: PurchaseEntryComponent },
  { path: 'edit/:id', component: PurchaseEntryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchasesRoutingModule { }
