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
        const paymentReceive = this.dueReceived;
        if(!paymentReceive.discount) paymentReceive.discount = 0;
        if (paymentReceive.discount < 0) {
            abp.message.info("Discount can't be less than 0", "Invalid Paid!");
            paymentReceive.discount = 0;
        } else if (paymentReceive.grandTotal < paymentReceive.prevDiscount + paymentReceive.discount) {
            abp.message.info("Discount can't be greater than the grand total", "Invalid Discount!");
            paymentReceive.discount = 0;
        } else {
            paymentReceive.netTotal = paymentReceive.grandTotal - paymentReceive.prevDiscount - paymentReceive.discount;
            paymentReceive.due = paymentReceive.netTotal - paymentReceive.prevTotalPaid - paymentReceive.totalPaid;
            this.discountEditMode = false;
        }
    }

    totalPaidChanged() {
        const paymentReceive = this.dueReceived;
        if(!paymentReceive.totalPaid) paymentReceive.totalPaid = 0;
        if (paymentReceive.totalPaid < 0) {
            abp.message.info("Paid amount can't be less than 0", "Invalid Paid!");
            paymentReceive.totalPaid = 0;
        } else if (paymentReceive.netTotal < paymentReceive.prevTotalPaid + paymentReceive.totalPaid) {
            abp.message.info("Paid amount can't be greater than the net total", "Invalid Paid!");
            paymentReceive.totalPaid = 0;
        } else {
            this.dueReceived.due = this.dueReceived.netTotal - this.dueReceived.prevTotalPaid - this.dueReceived.totalPaid;
            this.paidEditMode = false;

        }
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