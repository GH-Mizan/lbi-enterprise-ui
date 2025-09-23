import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { InventoryServiceProxy, ProductOutputDto } from '@shared/service-proxies/service-proxies';
import { BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
  selector: 'app-nventories-breakpoint',
  standalone: false,
  templateUrl: './inventories-breakpoint.component.html',
  animations: [appModuleAnimation()],
  styles: [
    `
        :host ::ng-deep .modal-header {
            border-bottom: none
        }
    `
  ]
})
export class InventoriesBreakpointComponent extends PagedListingComponentBase<ProductOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  stockPointId: number = null;
  stockPointName: string = null;

  constructor(
    injector: Injector,
    private readonly _inventoryService: InventoryServiceProxy,
    public bsModalRef: BsModalRef,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  list(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();
    this._inventoryService.getInventoriesBreakpoint(
        this.stockPointId
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
