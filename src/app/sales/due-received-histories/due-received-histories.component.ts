import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { DueReceivedHistoryDto, SalesServiceProxy } from "@shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-payment-receive-history',
    standalone: false,
    templateUrl: './due-received-histories.component.html',
})

export class DueReceivedHistoryComponent implements OnInit {

    salesId: number;
    histories: DueReceivedHistoryDto[] = [];

    constructor(
        public bsModalRef: BsModalRef,
        private readonly _salesService: SalesServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        
    }

    ngOnInit(): void {
        this._salesService.getDueReceivedHistories(this.salesId).subscribe(res=> {
            this.histories = res;
            this.cd.detectChanges();
        });
    }

}