import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ComboboxItemDto, DuePaymentHistoryDto, PaymentStatus, PurchaseDetailsEntryDto, PurchaseEntryDto, PurchaseEntryInput, PurchaseProductDto, PurchaseServiceProxy, SupplierServiceProxy, StockPointServiceProxy } from "@shared/service-proxies/service-proxies";
import { ActivatedRoute, Router } from '@angular/router';
import moment from "moment";
import { NotifyService } from 'abp-ng2-module';


@Component({
    selector: 'app-purchase-entry',
    standalone: false,
    templateUrl: './purchase-entry.component.html',
    animations: [appModuleAnimation()],
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

export class PurchaseEntryComponent implements OnInit {

    products: PurchaseProductDto[] = [];
    checkedAll: boolean = false;
    checkedAllIndeterminate: boolean = false;

    model = { totalAmount: 0, discount: 0, netAmount: 0, paidAmount: 0, dueAmount: 0 } as PurchaseEntryDto;
    suppliers: ComboboxItemDto[] = [];
    paymentStatuses: ComboboxItemDto[] = [];
    stockPoints: ComboboxItemDto[] = [];

    discountEditMode: boolean = false;
    totalPaidEditMode: boolean = false;
    id?: number;
    date = new Date();
    invalid: boolean = false;
    loading: boolean = true;

    constructor(
        private readonly _purchaseService: PurchaseServiceProxy,
        private readonly _supplierService: SupplierServiceProxy,
        private readonly _stockPointService: StockPointServiceProxy,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _router: Router,
        private readonly _notifyService: NotifyService,
        private readonly cd: ChangeDetectorRef
    ) {

    }

    async ngOnInit() {
        this.id = this._activatedRoute.snapshot.params['id'];
        Promise.all([
            this.populateSuppliers(),
            this.populatePaymentStatuses(),
            this.getModel(),
            this.populateStockPoints()
        ]).then(() => {
            this.cd.detectChanges();
        })
    }

    private async getModel() {
        if (!this.id) {
            this.model.invoiceNumber = "#" + (parseInt((await firstValueFrom(this._purchaseService.getLastInvoiceNumber()))) + 1);
            this.products = await firstValueFrom(this._purchaseService.getAllProducts(undefined));
            this.loading = false;
        }
        else {
            const purchaseInfo = await firstValueFrom(this._purchaseService.get(this.id));
            this.model = purchaseInfo.purchase;
            this.date = (this.model.date).toDate();
            this.products = await firstValueFrom(this._purchaseService.getAllProducts(this.model.stockPointId));

            purchaseInfo.purchaseDetails.forEach(x => {
                const product = this.products.find(f => f.productId == x.productId);
                product.selected = true;
                product.purchasePriceDisabled = false;
                product.qtyDisabled = false;
                product.purchasePrice = x.unitPrice;
                product.quantity = x.quantity;
                product.totalPrice = x.totalPrice;
                product.stock = product.stock - x.quantity;
                if (product.stock < 0) this.invalid = true;
            });
            this.calculateTotal();
            this.loading = false;
        }
    }

    private async populateSuppliers() {
        this.suppliers = await firstValueFrom(this._supplierService.getSuppliersSelectList());
    }

    private async populateStockPoints() {
        this.stockPoints = await firstValueFrom(this._stockPointService.getStockPoints(true));
    }

    private async populatePaymentStatuses() {
        this.paymentStatuses = await firstValueFrom(this._purchaseService.getPaymentStatusSelectList());
    }

    async stockPointChanged() {
        this.products = await firstValueFrom(this._purchaseService.getAllProducts(this.model.stockPointId));
        this.cd.detectChanges();
    }

    updateTotalPrice(product: PurchaseProductDto) {
        product.totalPrice = product.purchasePrice * product.quantity;
        this.calculateTotal();
        this.populatePaymentStatus();
    }

    unitPriceChanged(product: PurchaseProductDto) {
        if (!product.purchasePrice) {
            this.setUnitPriceZero(product);
        } else if (product.purchasePrice < 0) {
            abp.message.info("Unit Price can't be less than 0.", "Invalid Input!");
            this.setUnitPriceZero(product);
        }
    }

    private setUnitPriceZero(product: PurchaseProductDto) {
        product.purchasePrice = 0;
        product.totalPrice = 0;
        this.calculateTotal();
        this.populatePaymentStatus();
    }

    quantityChanged(product: PurchaseProductDto) {
        if (!product.quantity) {
            this.setQuantityZero(product);
        } else if (product.quantity < 0) {
            abp.message.info("Quantity can't be less than 0.", "Invalid Input!");
            this.setQuantityZero(product);
        }
    }

    private setQuantityZero(product: PurchaseProductDto) {
        product.quantity = 0;
        product.totalPrice = 0;
        this.calculateTotal();
        this.populatePaymentStatus();
    }

    private calculateTotal() {
        let grandTotal = 0;
        this.products.forEach(p => {
            grandTotal += p.totalPrice;
        });
        this.model.totalAmount = grandTotal;
        this.model.netAmount = this.model.totalAmount - this.model.discount;
        this.model.dueAmount = this.model.netAmount - this.model.paidAmount;

        this.populatePaymentStatus();
    }

    totalDiscountChanged() {
        if (!this.model.discount) this.model.discount = 0;

        if (this.model.discount < 0) {
            abp.message.info("Discount can't be less than 0", "Invalid Paid!");
            this.model.discount = 0;
        } else if (this.model.totalAmount < this.model.discount) {
            abp.message.info("Discount can't be greater than the grand total", "Invalid Discount!");
            this.model.discount = 0;
        } else {
            this.model.netAmount = this.model.totalAmount - this.model.discount;
            this.model.dueAmount = this.model.netAmount - this.model.paidAmount;
            this.discountEditMode = false;
        }
        this.populatePaymentStatus();
    }

    totalPaidChanged() {
        if (!this.model.paidAmount) this.model.paidAmount = 0;

        if (this.model.paidAmount < 0) {
            abp.message.info("Paid amount can't be less than 0", "Invalid Paid!");
            this.model.paidAmount = 0;
        } else if (this.model.netAmount < this.model.paidAmount) {
            abp.message.info("Paid amount can't be greater than the net total", "Invalid Paid!");
            this.model.paidAmount = 0;
        } else {
            this.model.dueAmount = this.model.netAmount - this.model.paidAmount;
            this.totalPaidEditMode = false;
        }
        this.populatePaymentStatus();

    }

    checkedAllChanged() {
        if (this.checkedAll) {
            this.products.map(x => {
                x.selected = true;
                x.purchasePriceDisabled = false;
                x.qtyDisabled = false;
            })
        } else {
            this.products.map(x => {
                x.selected = false;
                x.purchasePriceDisabled = true;
                x.qtyDisabled = true;
                x.totalPrice = 0;
                x.quantity = 0;
            })
        }
    }

    checkedChanged(product: PurchaseProductDto) {
        if (product.selected) {
            product.purchasePriceDisabled = false;
            product.qtyDisabled = false;
        } else {
            product.purchasePriceDisabled = true;
            product.qtyDisabled = true;
            product.totalPrice = 0;
            product.quantity = 0;
        }

        if (this.products.find(x => x.selected) && this.products.length != this.products.filter(x => x.selected).length) {
            this.checkedAllIndeterminate = true;
            this.checkedAll = false;
        } else if (this.products.find(x => x.selected) && this.products.length == this.products.filter(x => x.selected).length) {
            this.checkedAllIndeterminate = false;
            this.checkedAll = true;
        }
        else {
            this.checkedAllIndeterminate = false;
            this.checkedAll = false;
        }
    }

    save() {
        const model = this.model;
        model.date = moment(this.date);
        model.supplierName = this.suppliers.find(f => f.value == model.supplierId.toString()).displayText;
        const details: PurchaseDetailsEntryDto[] = [];
        this.products.filter(f => f.selected && f.quantity > 0 && f.totalPrice > 0).forEach(x => {
            details.push({
                productId: x.productId,
                productName: x.name,
                unitPrice: x.purchasePrice,
                quantity: x.quantity,
                totalPrice: x.totalPrice
            } as PurchaseDetailsEntryDto);
        });
        model.paymentStatus = model.dueAmount == 0 ? PaymentStatus._1 : model.totalAmount > model.dueAmount ? PaymentStatus._2 : PaymentStatus._3;
        const input = {
            purchase: model,
            purchaseDetails: details
        } as PurchaseEntryInput;
        if (!this.id) {
            input.duePayment = {
                purchaseId: model.id,
                creationTime: moment(new Date()),
                invoiceDate: model.date,
                paymentDate: model.date,
                invoiceNumber: model.invoiceNumber,
                paymentStatus: model.paymentStatus,
                grandTotal: model.totalAmount,
                discount: model.discount,
                netTotal: model.netAmount,
                totalPaid: model.paidAmount,
                due: model.dueAmount,
                remarks: model.remarks
            } as DuePaymentHistoryDto; 
        }

        this._purchaseService.createOrUpdate(input).subscribe(() => {
            this._notifyService.success("Successfully " + this.id ? 'Saved' : 'Updated' + "");
            this._router.navigateByUrl('app/purchases');
        });
    }

    cancel() {
        this._router.navigateByUrl('app/purchases');
    }

    populatePaymentStatus() {
        if (this.model.totalAmount > 0) {
            if (this.model.dueAmount == 0) {
                this.model.paymentStatus = PaymentStatus._1;
            } else if (this.model.dueAmount == this.model.netAmount) {
                this.model.paymentStatus = PaymentStatus._3;
            } else {
                this.model.paymentStatus = PaymentStatus._2;
            }
        } else {
            this.model.paymentStatus = null;
        }
    }
}