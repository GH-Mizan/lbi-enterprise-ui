import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from "@angular/core";
import { DueReceivedHistoryDto, SalesServiceProxy } from "@shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-payment-receive-history',
    standalone: false,
    templateUrl: './due-received-histories.component.html',
})

export class DueReceivedHistoryComponent implements OnInit {
    @Output() onDelete = new EventEmitter<any>();

    salesId: number;
    histories: DueReceivedHistoryDto[] = [];

    constructor(
        public bsModalRef: BsModalRef,
        private readonly _salesService: SalesServiceProxy,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this._salesService.getDueReceivedHistories(this.salesId).subscribe(res => {
            this.histories = res;
            this.cd.detectChanges();
        });
    }

    delete(item: DueReceivedHistoryDto): void {
        abp.message.confirm(`Amount ${item.totalPaid} will be removed`,
            undefined,
            (result: boolean) => {
                if (result) {
                    this._salesService.dueReceivedRemove(item.id).subscribe(() => {
                        abp.notify.success("Successfully Deleted");
                        this.histories = this.histories.filter(f => f.id != item.id);
                        this.onDelete.emit();
                        this.cd.detectChanges();
                    });
                }
            }
        );
    }

}