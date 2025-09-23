import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LbiSettingsRoutingModule } from './lbi-settings-routing.module';
import { LbiSettingsComponent } from './lbi-settings.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    LbiSettingsComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    LbiSettingsRoutingModule
  ]
})
export class LbiSettingsModule { }
