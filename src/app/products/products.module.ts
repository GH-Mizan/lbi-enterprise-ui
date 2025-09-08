import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { ProductEntryComponent } from './product-entry/product-entry.component';
import { ProductHistoriesComponent } from './histories/product-history.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    ProductsComponent,
    ProductEntryComponent,
    ProductHistoriesComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    ProductsRoutingModule
  ]
})
export class ProductsModule { }
