import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { PurchaseServiceProxy, DuePaymentHistoryDto } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-due-payment-history',
    standalone: false,
    templateUrl: './due-payment-histories.component.html',
})

export class DuePaymentHistoryComponent implements OnInit {

    purchaseId: number;
    histories: DuePaymentHistoryDto[] = [];

    constructor(
        public bsModalRef: BsModalRef,
        private readonly _purchaseService: PurchaseServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        
    }

    ngOnInit(): void {
        this._purchaseService.getDuePaymentHistories(this.purchaseId).subscribe(res=> {
            this.histories = res;
            this.cd.detectChanges();
        });
    }

}