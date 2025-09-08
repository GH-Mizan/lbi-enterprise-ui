import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { SalesEntryComponent } from './sales-entry/sales-entry.component';

const routes: Routes = [
  { path: '', component: SalesComponent },
  { path: 'create', component: SalesEntryComponent },
  { path: 'edit/:id', component: SalesEntryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
