import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountHeadsComponent } from './account-heads.component';

const routes: Routes = [{ path: '', component: AccountHeadsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountHeadsRoutingModule { }
