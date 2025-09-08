import { Component } from "@angular/core";
import { CustomerPriceDto, CustomerServiceProxy } from "@shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NotifyService } from 'abp-ng2-module';

@Component({
    selector: 'app-customer-prices',
    templateUrl: './customer-prices.component.html',
    standalone: false,
    styles: [
        `
            /* Chrome, Safari, Edge, Opera */
            input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }

            /* Firefox */
            input[type=number] {
                -moz-appearance: textfield;
            }

            .invalid_cell {
                background-color: red;
            }
        `
    ]
})

export class CustomerPricesComponent {

    customerName: string;
    customerPrices: CustomerPriceDto[];

    constructor(
        public bsModalRef: BsModalRef,
        private readonly _customerrService: CustomerServiceProxy,
        private readonly _notifyService: NotifyService
    ) {

    }

    save() {
        this._customerrService.saveCustomerPrices(this.customerPrices).subscribe(() => {
            this._notifyService.info("Successfully Saved");
            this.bsModalRef.hide();
        });
    }
}