import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { AdditionalPartiesServiceProxy, AdditionalPartyEntryDto, AdditionalPartyOutputDto } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { AdditionalPartyEntryComponent } from './additional-party-entry/additional-party-entry.component';
@Component({
  selector: 'app-additional-parties',
  standalone: false,
  templateUrl: './additional-parties.component.html',
  animations: [appModuleAnimation()],
})


export class AdditionalPartiesComponent extends PagedListingComponentBase<AdditionalPartyOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _additionalPartiesService: AdditionalPartiesServiceProxy,
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
    this._additionalPartiesService.getPaginatedAdditionalPartiesAdvances(
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
    const ap = new AdditionalPartyEntryDto();
    this.showEntryDialog(ap);
  }

  edit(id: number) {
    this._additionalPartiesService.get(id).subscribe(res => {
      this.showEntryDialog(res);
    });
  }

  delete(ap: AdditionalPartyOutputDto): void {
    abp.message.confirm(`${ap.partyName} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._additionalPartiesService.additionalPartyRemove(ap.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showEntryDialog(ap: AdditionalPartyEntryDto): void {
    let entryDialog: BsModalRef;
    entryDialog = this._modalService.show(
      AdditionalPartyEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          model: ap,
        },
      }
    );
    entryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

}
