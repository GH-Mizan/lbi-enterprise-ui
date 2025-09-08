import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { DepartmentCreateOrUpdateDto, DepartmentOutputDto, DepartmentServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { DepartmentEntryComponent } from './department-entry/department-entry.component';

@Component({
  selector: 'app-departments',
  standalone: false,
  templateUrl: './departments.component.html',
  animations: [appModuleAnimation()],
})
export class DepartmentsComponent extends PagedListingComponentBase<DepartmentOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _departmentService: DepartmentServiceProxy,
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
    this._departmentService.getPaginatedDepartments(
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
    const department = new DepartmentCreateOrUpdateDto();
    department.activeStatus = true;
    this.showDepartmentEntryDialog(department);
  }

  edit(id: number) {
    this._departmentService.get(id).subscribe(res => {
      this.showDepartmentEntryDialog(res);
    });
  }

  delete(department: DepartmentOutputDto): void {
    abp.message.confirm(`${department.name} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._departmentService.delete(department.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showDepartmentEntryDialog(department: DepartmentCreateOrUpdateDto): void {
    let departmentEntryDialog: BsModalRef;
    departmentEntryDialog = this._modalService.show(
      DepartmentEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          department: department,
        },
      }
    );
    departmentEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

}
