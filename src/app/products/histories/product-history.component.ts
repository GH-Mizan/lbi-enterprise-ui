import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ProductCreateOrUpdateDto, ProductOutputDto, ProductServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
  selector: 'app-product-histories',
  standalone: false,
  templateUrl: './product-history.component.html',
  animations: [appModuleAnimation()],
})
export class ProductHistoriesComponent extends PagedListingComponentBase<ProductOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  productId: number = null;

  constructor(
    injector: Injector,
    private readonly _productService: ProductServiceProxy,
    public bsModalRef: BsModalRef,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  list(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();
    this._productService.getProductHistories(
        this.productId
    ).pipe(
      finalize(() => {
        this.primengTableHelper.hideLoadingIndicator();
      })
    )
      .subscribe((result) => {
        this.primengTableHelper.records = result;
        this.primengTableHelper.totalRecordsCount = result.length;
        this.primengTableHelper.hideLoadingIndicator();
        this.cd.detectChanges();
      });


  }

  delete(): void {}

  

}
