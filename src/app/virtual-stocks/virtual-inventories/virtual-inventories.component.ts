import { ChangeDetectorRef, Component, Injector } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { OverallVirtualInventoriesOutput, VirtualStocksServiceProxy } from '@shared/service-proxies/service-proxies';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
  selector: 'app-virtual-stocks',
  standalone: false,
  templateUrl: './virtual-inventories.component.html',
  animations: [appModuleAnimation()],
})

export class VirtualInventoriesComponent extends PagedListingComponentBase<OverallVirtualInventoriesOutput> {

  searchText: string;

  constructor(
    injector: Injector,
    cd: ChangeDetectorRef,
    private readonly _virtualStocksService: VirtualStocksServiceProxy
  ) {
    super(injector, cd);
  }
 
  list(event?: LazyLoadEvent): void {
    this._virtualStocksService.getActualVirtualInventories()
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
