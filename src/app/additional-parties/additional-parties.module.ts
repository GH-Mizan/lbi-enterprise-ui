import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdditionalPartiesRoutingModule } from './additional-parties-routing.module';
import { AdditionalPartiesComponent } from './additional-parties.component';
import { SharedModule } from '@shared/shared.module';
import { AdditionalPartyEntryComponent } from './additional-party-entry/additional-party-entry.component';


@NgModule({
  declarations: [
    AdditionalPartiesComponent,
    AdditionalPartyEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AdditionalPartiesRoutingModule
  ]
})
export class AdditionalPartiesModule { }
