import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { EmployeeCreateOrUpdateDto, EmployeeOutputDto, EmployeeServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { EmployeeEntryComponent } from './employee-entry/employee-entry.component';

@Component({
  selector: 'app-employees',
  standalone: false,
  templateUrl: './employees.component.html',
  animations: [appModuleAnimation()],
})
export class EmployeesComponent extends PagedListingComponentBase<EmployeeOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _employeeService: EmployeeServiceProxy,
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
    this._employeeService.getPaginatedEmployees(
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
    const employee = new EmployeeCreateOrUpdateDto();
    employee.activeStatus = true;
    this.showEmployeeEntryDialog(employee);
  }

  edit(id: number) {
    this._employeeService.get(id).subscribe(res => {
      this.showEmployeeEntryDialog(res);
    });
  }

  delete(employee: EmployeeOutputDto): void {
    abp.message.confirm(`${employee.name} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._employeeService.employeeRemove(employee.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showEmployeeEntryDialog(employee: EmployeeCreateOrUpdateDto): void {
    let employeeEntryDialog: BsModalRef;
    employeeEntryDialog = this._modalService.show(
      EmployeeEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          employee: employee,
        },
      }
    );
    employeeEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

}
