import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { DailyCashOutputDto, DailyCashServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customers',
  standalone: false,
  templateUrl: './daily-cash.component.html',
  animations: [appModuleAnimation()],
})
export class DailyCashComponent extends PagedListingComponentBase<DailyCashOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";
  startDate = new Date();
  endDate = new Date();

  constructor(
    injector: Injector,
    private readonly _dailyCashService: DailyCashServiceProxy,
    private readonly _router: Router,
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
    this._dailyCashService.getPaginatedDailyCash(
      moment(this.startDate) , moment(this.endDate), '',
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
    this._router.navigateByUrl('app/daily-cash/create');
  }

  edit(id: number) {
    this._router.navigateByUrl(`app/daily-cash/edit/${id}`);
  }

  delete(item: DailyCashOutputDto): void {
    // abp.message.confirm(`${customer.name} will be deleted`,
    //   undefined,
    //   (result: boolean) => {
    //     if (result) {
    //       // this._dailyCashService.delete(customer.id).subscribe(() => {
    //       //   abp.notify.success(this.l("SuccessfullyDeleted"));
    //       //   this.refresh();
    //       // });
    //     }
    //   }
    // );
  }

}
