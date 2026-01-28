import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountHeadsRoutingModule } from './account-heads-routing.module';
import { AccountHeadsComponent } from './account-heads.component';
import { SharedModule } from '@shared/shared.module';
import { AccountHeadEntryComponent } from './account-head-entry/account-head-entry.component';


@NgModule({
  declarations: [
    AccountHeadsComponent,
    AccountHeadEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AccountHeadsRoutingModule
  ]
})
export class AccountHeadsModule { }
