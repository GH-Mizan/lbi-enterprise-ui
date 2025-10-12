import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { DesignationCreateOrUpdateDto, DesignationOutputDto, DesignationServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { DesignationEntryComponent } from './designation-entry/designation-entry.component';

@Component({
  selector: 'app-designations',
  standalone: false,
  templateUrl: './designations.component.html',
  animations: [appModuleAnimation()],
})
export class DesignationsComponent extends PagedListingComponentBase<DesignationOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _designationService: DesignationServiceProxy,
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
    this._designationService.getPaginatedDesignations(
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
    const designation = new DesignationCreateOrUpdateDto();
    designation.activeStatus = true;
    this.showDesignationEntryDialog(designation);
  }

  edit(id: number) {
    this._designationService.get(id).subscribe(res => {
      this.showDesignationEntryDialog(res);
    });
  }

  delete(designation: DesignationOutputDto): void {
    abp.message.confirm(`${designation.title} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._designationService.designationRemove(designation.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showDesignationEntryDialog(designation: DesignationCreateOrUpdateDto): void {
    let designationEntryDialog: BsModalRef;
    designationEntryDialog = this._modalService.show(
      DesignationEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          designation: designation,
        },
      }
    );
    designationEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

}
