import { Component } from "@angular/core";
import { PurchaseOutputDto } from "../../../shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-purchase-details',
    templateUrl: './purchase-details.component.html',
    standalone: false
})

export class PurchaseDetailsComponent {

    purchase: PurchaseOutputDto;

    constructor(public bsModalRef: BsModalRef) {}
}