import { Component } from "@angular/core";
import { SalesOutputDto } from "../../../shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-sale-details',
    templateUrl: './sale-details.component.html',
    standalone: false
})

export class SaleDetailsComponent {

    sale: SalesOutputDto;

    constructor(public bsModalRef: BsModalRef) {}
}