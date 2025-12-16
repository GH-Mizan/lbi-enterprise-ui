import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, DuePaymentEntryDto, DuePaymentHistoryDto, PaymentStatus, PurchaseServiceProxy } from "@shared/service-proxies/service-proxies";
import moment from "moment";

@Component({
    selector: 'app-due-payment-entry',
    standalone: false,
    templateUrl: './due-payment-entry.component.html',
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

export class DuePaymentEntryComponent extends AppComponentBase implements OnInit {

    @Output() onSave = new EventEmitter<any>();

    duePayment: DuePaymentEntryDto;
    types: ComboboxItemDto[] = [];
    saving = false;

    invoiceDate = new Date();
    paymentDate = new Date();

    discountEditMode: boolean = false;
    paidEditMode: boolean = false;
    invalid: boolean = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _purchaseService: PurchaseServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.invoiceDate = (this.duePayment.invoiceDate).toDate();
        this.cd.detectChanges();
    }

    totalDiscountChanged() {
        const payment = this.duePayment;
        if (!payment.discount) payment.discount = 0;
        if (payment.discount < 0) {
            abp.message.info("Discount can't be less than 0", "Invalid Paid!");
            payment.discount = 0;
        } else if (payment.grandTotal < payment.prevDiscount + payment.discount) {
            abp.message.info("Discount can't be greater than the grand total", "Invalid Discount!");
            payment.discount = 0;
        } else {
            this.discountEditMode = false;
        }
        payment.netTotal = parseFloat((payment.grandTotal - payment.prevDiscount - payment.discount).toFixed(2));
        payment.due = parseFloat((payment.netTotal - payment.prevTotalPaid - payment.totalPaid).toFixed(2));
    }

    totalPaidChanged() {
        this.invalid = true;
        const payment = this.duePayment;
        if (!payment.totalPaid) payment.totalPaid = 0;
        if (payment.totalPaid < 0) {
            abp.message.info("Paid amount can't be less than 0", "Invalid Paid!");
            payment.totalPaid = 0;
        } else if (payment.netTotal < payment.prevTotalPaid + payment.totalPaid) {
            abp.message.info("Paid amount can't be greater than the net total", "Invalid Paid!");
            payment.totalPaid = 0;
        } else {
            this.paidEditMode = false;
        }
        payment.due = parseFloat((payment.netTotal - payment.prevTotalPaid - payment.totalPaid).toFixed(2));

        setTimeout(() => {
            this.invalid = false;
            this.cd.detectChanges();
        }, 200);
    }

    save() {
        this.saving = true;
        const payment = this.duePayment;
        payment.duePayment = {
            purchaseId: payment.purchaseId,
            creationTime: moment(new Date()),
            invoiceDate: moment(this.invoiceDate),
            paymentDate: moment(this.paymentDate),
            invoiceNumber: payment.invoiceNumber,
            paymentStatus: payment.due == 0 ? PaymentStatus._1 : payment.netTotal > payment.due ? PaymentStatus._2 : PaymentStatus._3,
            grandTotal: payment.grandTotal,
            discount: payment.discount,
            netTotal: payment.netTotal,
            totalPaid: payment.totalPaid,
            due: payment.due,
            remarks: payment.remarks
        } as DuePaymentHistoryDto;

        this._purchaseService.duePaymentEntry(payment).subscribe(() => {
            this.notify.info("Successfully Updated");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}