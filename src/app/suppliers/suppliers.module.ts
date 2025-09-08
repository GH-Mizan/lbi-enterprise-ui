import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuppliersRoutingModule } from './suppliers-routing.module';
import { SuppliersComponent } from './suppliers.component';
import { SupplierEntryComponent } from './supplier-entry/supplier-entry.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    SuppliersComponent,
    SupplierEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    SuppliersRoutingModule
  ]
})
export class SuppliersModule { }
