import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, DueReceivedEntryDto, DueReceivedHistoryDto, PaymentStatus, SalesServiceProxy } from "@shared/service-proxies/service-proxies";
import moment from "moment";

@Component({
    selector: 'app-due-received-entry',
    standalone: false,
    templateUrl: './due-received-entry.component.html',
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
                background-color: red !important;
            }
        `
    ]
})

export class DueReceivedEntryComponent extends AppComponentBase implements OnInit {

    @Output() onSave = new EventEmitter<any>();

    dueReceived: DueReceivedEntryDto;
    types: ComboboxItemDto[] = [];
    saving = false;

    invoiceDate = new Date();
    receiveDate = new Date();

    discountEditMode: boolean = false;
    paidEditMode: boolean = false;
    invalid: boolean = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _salesService: SalesServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.invoiceDate = (this.dueReceived.invoiceDate).toDate();
        this.cd.detectChanges();
    }

    totalDiscountChanged() {
        const dueReceived = this.dueReceived;
        if(!dueReceived.discount) dueReceived.discount = 0;
        if (dueReceived.discount < 0) {
            abp.message.info("Discount can't be less than 0", "Invalid Paid!");
            dueReceived.discount = 0;
        } else if (dueReceived.grandTotal < dueReceived.prevDiscount + dueReceived.discount) {
            abp.message.info("Discount can't be greater than the grand total", "Invalid Discount!");
            dueReceived.discount = 0;
        } else {
            dueReceived.netTotal = dueReceived.grandTotal - dueReceived.prevDiscount - dueReceived.discount;
            dueReceived.due = dueReceived.netTotal - dueReceived.prevTotalPaid - dueReceived.totalPaid;
            this.discountEditMode = false;
        }
    }

    totalPaidChanged() {
        this.invalid = true;
        const dueReceived = this.dueReceived;
        if(!dueReceived.totalPaid) dueReceived.totalPaid = 0;
        if (dueReceived.totalPaid < 0) {
            abp.message.info("Paid amount can't be less than 0", "Invalid Paid!");
            dueReceived.totalPaid = 0;
        } else if (dueReceived.netTotal < dueReceived.prevTotalPaid + dueReceived.totalPaid) {
            abp.message.info("Paid amount can't be greater than the net total", "Invalid Paid!");
            dueReceived.totalPaid = 0;
        } else {
            this.dueReceived.due = this.dueReceived.netTotal - this.dueReceived.prevTotalPaid - this.dueReceived.totalPaid;
            this.paidEditMode = false;
        }

        setTimeout(() => {
            this.invalid = false;
            this.cd.detectChanges();
        }, 200);
    }

    save() {
        this.saving = true;
        const dueReceived = this.dueReceived;
        dueReceived.dueReceived = {
            salesId: dueReceived.salesId,
            creationTime: moment( new Date()),
            invoiceDate: moment(this.invoiceDate),
            receiveDate: moment(this.receiveDate),
            invoiceNumber: dueReceived.invoiceNumber,
            paymentStatus: dueReceived.due == 0 ? PaymentStatus._1 : dueReceived.netTotal > dueReceived.due ? PaymentStatus._2 : PaymentStatus._3,
            grandTotal: dueReceived.grandTotal,
            discount: dueReceived.discount,
            netTotal: dueReceived.netTotal,
            totalPaid: dueReceived.totalPaid,
            due: dueReceived.due,
            remarks: dueReceived.remarks
        } as DueReceivedHistoryDto;

        this._salesService.dueReceivedEntry(dueReceived).subscribe(() => {
            this.notify.info("Successfully Updated");
                this.bsModalRef.hide();
                this.onSave.emit();
                this.saving = false;
                this.cd.detectChanges();
        });
    }
}