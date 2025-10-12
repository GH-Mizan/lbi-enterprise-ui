import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { PurchaseServiceProxy, DuePaymentHistoryDto } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-due-payment-history',
    standalone: false,
    templateUrl: './due-payment-histories.component.html',
})

export class DuePaymentHistoryComponent implements OnInit {
    @Output() onDelete = new EventEmitter<any>();
    purchaseId: number;
    histories: DuePaymentHistoryDto[] = [];

    constructor(
        public bsModalRef: BsModalRef,
        private readonly _purchaseService: PurchaseServiceProxy,
        private cd: ChangeDetectorRef
    ) {

    }

    ngOnInit(): void {
        this._purchaseService.getDuePaymentHistories(this.purchaseId).subscribe(res => {
            this.histories = res;
            this.cd.detectChanges();
        });
    }

    delete(item: DuePaymentHistoryDto): void {
        abp.message.confirm(`Amount ${item.totalPaid} will be removed`,
            undefined,
            (result: boolean) => {
                if (result) {
                    this._purchaseService.removeDuePayment(item.id).subscribe(() => {
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