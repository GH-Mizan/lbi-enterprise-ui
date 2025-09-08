import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ProductCreateOrUpdateDto, ProductOutputDto, ProductServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { ProductEntryComponent } from './product-entry/product-entry.component';
import { ProductHistoriesComponent } from './histories/product-history.component';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.component.html',
  animations: [appModuleAnimation()],
})
export class ProductsComponent extends PagedListingComponentBase<ProductOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _productService: ProductServiceProxy,
    private readonly _modalService: BsModalService,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  list(event?: LazyLoadEvent): void {
    if (this.primengTableHelper.shouldResetPaging(event)) {
      this.paginator.changePage(0);

      if (
        this.primengTableHelper.records &&
        this.primengTableHelper.records.length > 0
      ) {
        return;
      }
    }

    this.primengTableHelper.showLoadingIndicator();
    this._productService.getPaginatedProducts(
      this.searchText,
      this.primengTableHelper.getSkipCount(this.paginator, event),
      this.primengTableHelper.getMaxResultCount(this.paginator, event)
    ).pipe(
      finalize(() => {
        this.primengTableHelper.hideLoadingIndicator();
      })
    )
      .subscribe((result) => {
        this.primengTableHelper.records = result.items;
        this.primengTableHelper.totalRecordsCount = result.totalCount;
        this.primengTableHelper.hideLoadingIndicator();
        this.cd.detectChanges();
      });
  }

  create() {
    const product = new ProductCreateOrUpdateDto();
    product.activeStatus = true;
    this.showProductEntryDialog(product);
  }

  edit(id: number) {
    this._productService.get(id).subscribe(res => {
      this.showProductEntryDialog(res);
    });
  }

  showHistories(id: number) {
    this.showProductHistoryDialog(id);
  }

  delete(product: ProductOutputDto): void {
    abp.message.confirm(`${product.name} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._productService.delete(product.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showProductEntryDialog(product: ProductCreateOrUpdateDto): void {
    let productEntryDialog: BsModalRef;
    productEntryDialog = this._modalService.show(
      ProductEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          product: product,
        },
      }
    );
    productEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  private showProductHistoryDialog(productId: number): void {
    let productHistoryDialog: BsModalRef;
    productHistoryDialog = this._modalService.show(
      ProductHistoriesComponent,
      {
        class: "modal-lg",
        initialState: {
          productId: productId,
        },
      }
    );
    
  }

}
