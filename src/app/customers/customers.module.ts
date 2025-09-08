import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersComponent } from './customers.component';
import { CustomerEntryComponent } from './customer-entry/customer-entry.component';
import { SharedModule } from '@shared/shared.module';
import { CustomerPricesComponent } from './customer-prices/customer-prices.component';


@NgModule({
  declarations: [
    CustomersComponent,
    CustomerEntryComponent,
    CustomerPricesComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    CustomersRoutingModule
  ]
})
export class CustomersModule { }
