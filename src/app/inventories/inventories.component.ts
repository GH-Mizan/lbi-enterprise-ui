import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ComboboxItemDto, InventoryOutputDto, InventoryServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { ProductTransferComponent } from './product-transfer/product-transfer.component';
import { ProductTransferHistoriesComponent } from './transfer-histories/product-transfer-history.component';
import { MakeInventoryDamadgeComponent } from './make-damadge/damadge-inventory.component';

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
export class InventoriesComponent extends PagedListingComponentBase<InventoryOutputDto> implements OnInit {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  searchText: string = "";
  summaryTotal: any = null;
  damadgedOptions: ComboboxItemDto[] = [];
  damadge: string = "A";

  constructor(
    injector: Injector,
    private readonly _inventoryService: InventoryServiceProxy,
    private readonly _modalService: BsModalService,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  ngOnInit(): void {
    this.damadgedOptions.push({value: "", displayText: "All"} as ComboboxItemDto);
    this.damadgedOptions.push({value: "A", displayText: "Actual"} as ComboboxItemDto);
    this.damadgedOptions.push({value: "Y", displayText: "Damadge"} as ComboboxItemDto);
    this.cd.detectChanges();
  }

  list(event?: LazyLoadEvent): void {
    this.showLoading();
    this._inventoryService.getInventories(this.damadge).pipe(
      finalize(() => {
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

  openDamadgeInventoryModal(isEdit?: boolean) {
    this.showDamadgeInventoryDialog(isEdit);
  }

  openTransferHistory() {
    this.showProductTransferHistoryDialog();
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

  private showProductTransferHistoryDialog(): void {
    let historyDialog: BsModalRef;
    historyDialog = this._modalService.show(
      ProductTransferHistoriesComponent,
      {
        class: "modal-lg"
      }
    );
    historyDialog.content.onDelete.subscribe(()=> {
      this.refresh();
    })
  }

  private showDamadgeInventoryDialog(isEdit: boolean): void {
    let damadgeInventoryDialog: BsModalRef;
    damadgeInventoryDialog = this._modalService.show(
      MakeInventoryDamadgeComponent,
      {
        class: "modal-lg",
        initialState: {
          edit: isEdit
        }
      }
    );
    damadgeInventoryDialog.content.onSave.subscribe(() => {
      this.refresh();
    })
  }





}
