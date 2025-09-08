import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { StockPointCreateOrUpdateDto, StockPointOutputDto, StockPointServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { StockPointEntryComponent } from './stock-point-entry/stock-point-entry.component';

@Component({
  selector: 'app-stock-points',
  standalone: false,
  templateUrl: './stock-points.component.html',
  animations: [appModuleAnimation()],
})
export class StockPointsComponent extends PagedListingComponentBase<StockPointOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _stockPointService: StockPointServiceProxy,
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
    this._stockPointService.getPaginatedStockPoints(
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
    const stockPoint = new StockPointCreateOrUpdateDto();
    stockPoint.activeStatus = true;
    this.showStockPointEntryDialog(stockPoint);
  }

  edit(id: number) {
    this._stockPointService.get(id).subscribe(res => {
      this.showStockPointEntryDialog(res);
    });
  }

  delete(stockPoint: StockPointOutputDto): void {
    abp.message.confirm(`${stockPoint.name} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._stockPointService.delete(stockPoint.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showStockPointEntryDialog(stockPoint: StockPointCreateOrUpdateDto): void {
    let stockPointEntryDialog: BsModalRef;
    stockPointEntryDialog = this._modalService.show(
      StockPointEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          stockPoint: stockPoint,
        },
      }
    );
    stockPointEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

}
