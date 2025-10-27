import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ComboboxItemDto, InventoryServiceProxy, ProductOutputDto, ProductTransferDto } from '@shared/service-proxies/service-proxies';
import { BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';

@Component({
  selector: 'app-product-transfer-histories',
  standalone: false,
  templateUrl: './product-transfer-history.component.html',
  animations: [appModuleAnimation()],
})
export class ProductTransferHistoriesComponent extends PagedListingComponentBase<ProductTransferDto> implements OnInit {
  @Output() onDelete = new EventEmitter<any>();
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  products: ComboboxItemDto[] = [];
  productId: number;
  date = new Date();

  constructor(
    injector: Injector,
    private readonly _inventoryService: InventoryServiceProxy,
    public bsModalRef: BsModalRef,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  ngOnInit(): void {
    this._inventoryService.getInventoryProducts().subscribe(res => {
      this.products = res;
      this.cd.detectChanges();
    })
  }

  list(event?: LazyLoadEvent): void {
    if (this.productId) {
      this.primengTableHelper.showLoadingIndicator();
      this._inventoryService.getProductTransferHistories(
        this.productId, moment(this.date)
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
  }

  delete(item: ProductTransferDto) {
    abp.message.confirm(`This history will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._inventoryService.productTransferRemove(item.id).subscribe(() => {
            this.refresh();
            this.notify.success("Successfully Deleted");
            this.onDelete.emit();
          });
        }
      }
    );
  }


}
