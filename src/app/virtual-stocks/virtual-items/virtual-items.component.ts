import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { VirtualItemEntryInput, VirtualItemOutput, VirtualItemServiceProxy } from '@shared/service-proxies/service-proxies';
import { VirtualItemEntryComponent } from '../virtual-item-entry/virtual-item-entry.component';

@Component({
  selector: 'app-virtual-items',
  standalone: false,
  templateUrl: './virtual-items.component.html',
  animations: [appModuleAnimation()],
})

export class VirtualItemsComponent extends PagedListingComponentBase<VirtualItemOutput> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _virtualItemService: VirtualItemServiceProxy,
    private readonly _modalService: BsModalService,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  list(event?: LazyLoadEvent): void {
    this.showLoading();
    this._virtualItemService.getAll().pipe(
      finalize(() => {
        this.hideLoading();
      })
    )
      .subscribe((result) => {
        this.primengTableHelper.records = result;
        this.primengTableHelper.totalRecordsCount = result.length;
        this.cd.detectChanges();
      });
  }

  create() {
    const virtualItem = new VirtualItemEntryInput();
    virtualItem.activeStatus = true;
    this.showEntryDialog(virtualItem);
  }

  edit(id: number) {
    this._virtualItemService.get(id).subscribe(res => {
      this.showEntryDialog(res);
    });
  }

  delete(): void {
    
  }

  private showEntryDialog(vi: VirtualItemEntryInput): void {
    let entryDialog: BsModalRef;
    entryDialog = this._modalService.show(
      VirtualItemEntryComponent,
      {
        class: "modal-md",
        initialState: {
          virtualItem: vi,
        },
      }
    );
    entryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }
}
