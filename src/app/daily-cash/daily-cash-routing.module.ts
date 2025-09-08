import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DailyCashComponent } from './daily-cash.component';
import { DailyCashEntryComponent } from './daily-cash-entry/daily-cash-entry.component';

const routes: Routes = [
  { path: '', component: DailyCashComponent },
  { path: 'create', component: DailyCashEntryComponent },
  { path: 'edit/:id', component: DailyCashEntryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DailyCashRoutingModule { }
