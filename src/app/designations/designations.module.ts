import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DesignationsRoutingModule } from './designations-routing.module';
import { DesignationsComponent } from './designations.component';
import { DesignationEntryComponent } from './designation-entry/designation-entry.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    DesignationsComponent,
    DesignationEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    DesignationsRoutingModule
  ]
})
export class DesignationsModule { }
