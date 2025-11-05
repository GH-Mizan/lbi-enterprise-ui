import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ComboboxItemDto, CustomerServiceProxy, OverallVirtualInventoriesOutput, SupplierServiceProxy, VirtualItemServiceProxy, VirtualStocksServiceProxy, VirtualStockType } from '@shared/service-proxies/service-proxies';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-virtual-stocks',
  standalone: false,
  templateUrl: './virtual-inventories.component.html',
  animations: [appModuleAnimation()],
})

export class VirtualInventoriesComponent extends PagedListingComponentBase<OverallVirtualInventoriesOutput> implements OnInit {

  searchText: string;
  items: ComboboxItemDto[] = [];
  warehouses: ComboboxItemDto[];
  warehouseTypes: ComboboxItemDto[];
  itemId: number;
  warehouseId: number;
  typeId: number = 1;

  constructor(
    injector: Injector,
    cd: ChangeDetectorRef,
    private readonly _virtualStocksService: VirtualStocksServiceProxy,
    private readonly _virtualItemService: VirtualItemServiceProxy,
    private readonly _customerService: CustomerServiceProxy,
    private readonly _supplierSerivce: SupplierServiceProxy
  ) {
    super(injector, cd);
  }

  async ngOnInit() {
    await Promise.all([
      this.loadTypes(),
      this.loadWarehouses(),
      this.loadItems()
    ])
  }

  private async loadItems() {
    const items = await firstValueFrom(this._virtualItemService.getAll());
    items.forEach(x=> {
      this.items.push({value: x.id.toString(), displayText: x.name} as ComboboxItemDto)
    });
    this.cd.detectChanges();
  }

  private async loadTypes() {
    this.warehouseTypes = await firstValueFrom(this._virtualStocksService.getStockTypesSelectList());
    this.cd.detectChanges();
  }

  private async loadWarehouses() {
    if(this.typeId == Number(VirtualStockType._1)) {
        this.warehouses = await firstValueFrom(this._customerService.getCustomersSelectList());
    } else {
      this.warehouses = await firstValueFrom(this._supplierSerivce.getSuppliersSelectList());
    }
    this.warehouseId = undefined;
    this.cd.detectChanges();
  }

  async onTypeChanged() {
    await this.loadWarehouses();
    this.list();
    
  }
 
  list(event?: LazyLoadEvent): void {
    this.showLoading();
    this._virtualStocksService.getActualVirtualInventories(this.typeId, this.warehouseId, this.itemId)
        .pipe(finalize(() => {
          this.hideLoading();
        }))
        .subscribe((result) => {
          this.primengTableHelper.records = result;
          this.primengTableHelper.totalRecordsCount = result.length;
          this.cd.detectChanges();
        });
  }

  delete() {}

}
