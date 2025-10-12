import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { InventoryOutputDto, InventoryServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { ProductTransferComponent } from './product-transfer/product-transfer.component';
import { ProductTransferHistoriesComponent } from './transfer-histories/product-transfer-history.component';

@Component({
  selector: 'app-inventories',
  standalone: false,
  templateUrl: './inventories.component.html',
  animations: [appModuleAnimation()],
  styles: [
    `
      .lightgrey {
        background-color: lightgrey
      }
    `
  ]
})
export class InventoriesComponent extends PagedListingComponentBase<InventoryOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  searchText: string = "";
  summaryTotal: any = null;

  constructor(
    injector: Injector,
    private readonly _inventoryService: InventoryServiceProxy,
    private readonly _modalService: BsModalService,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  list(event?: LazyLoadEvent): void {
    this.showLoading();
    this._inventoryService.getInventories(
    ).pipe(finalize(() => {
      this.hideLoading();
    }))
      .subscribe((result) => {
        this.primengTableHelper.records = result;
        this.primengTableHelper.totalRecordsCount = result.length;
        this.primengTableHelper.hideLoadingIndicator();
        this.summaryTotal = result.reduce((accumulator, item) => {
          accumulator.medicalOxygen1_36Qty += item.medicalOxygen1_36Qty;
          accumulator.medicalOxygen9_8Qty += item.medicalOxygen9_8Qty;
          accumulator.medicalAir7Qty += item.medicalAir7Qty;
          accumulator.medicalAir9_8Qty += item.medicalAir9_8Qty;
          accumulator.nitros3KgQty += item.nitros3KgQty;
          accumulator.nitros5KgQty += item.nitros5KgQty;
          accumulator.nitros30KgQty += item.nitros30KgQty;
          accumulator.total += item.total;
          return accumulator;
        }, { medicalOxygen1_36Qty: 0, medicalOxygen9_8Qty: 0, medicalAir7Qty: 0, medicalAir9_8Qty: 0, nitros3KgQty: 0, nitros5KgQty: 0, nitros30KgQty: 0, total: 0 });
        this.cd.detectChanges();
      });

  }

  openTransferModal() {
    this.showProductTransferDialog();
  }

  showHistories(productId: number) {
    this.showProductTransferHistoryDialog(productId);
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



}
