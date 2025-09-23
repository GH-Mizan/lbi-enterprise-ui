import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { InventoryServiceProxy, ProductTransferDto, StockQuantityOutputDto, SupplierCreateOrUpdateDto, SupplierOutputDto, SupplierServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { ProductTransferComponent } from './product-transfer/product-transfer.component';
import { ProductTransferHistoriesComponent } from './transfer-histories/product-transfer-history.component';
import { InventoriesBreakpointComponent } from './breakpoints/inventories-breakpoint.component';
//import { SupplierEntryComponent } from './inventory-entry/inventory-entry.component';

@Component({
  selector: 'app-inventories',
  standalone: false,
  templateUrl: './inventories.component.html',
  animations: [appModuleAnimation()],
})
export class InventoriesComponent extends PagedListingComponentBase<StockQuantityOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _inventoryService: InventoryServiceProxy,
    private readonly _modalService: BsModalService,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  list(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();
    this._inventoryService.getInventories(
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

  openTransferModal() {
    this.showProductTransferDialog();
  }

  showHistories(productId: number) {
    this.showProductTransferHistoryDialog(productId);
  }

  showBreakpoints(record: StockQuantityOutputDto) {
    this.showInventoriesBerakpointDialog(record);
  }

  delete(): void {

  }

  private showProductTransferDialog(): void {
    let productTransferDialog: BsModalRef;
    productTransferDialog = this._modalService.show(
      ProductTransferComponent,
      {
        class: "modal-lg"
      }
    );
    productTransferDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  private showProductTransferHistoryDialog(productId: number): void {
   this._modalService.show(
      ProductTransferHistoriesComponent,
      {
        class: "modal-lg",
         initialState: {
          productId: productId,
        },
      }
    );
  }

  private showInventoriesBerakpointDialog(record: StockQuantityOutputDto): void {
   this._modalService.show(
      InventoriesBreakpointComponent,
      {
        class: "modal-lg",
         initialState: {
          stockPointId: record.stockPointId,
          stockPointName: record.stockPointName
        },
      }
    );
  }

}
