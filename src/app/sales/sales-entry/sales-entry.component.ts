import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from "@angular/core";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ComboboxItemDto, CustomerServiceProxy, DueReceivedHistoryDto, EmployeeServiceProxy, PaymentStatus, PurchaseServiceProxy, SalesDetailsEntryDto, SalesEntryDto, SalesEntryInput, SalesServiceProxy, StockPointServiceProxy } from "@shared/service-proxies/service-proxies";
import { ActivatedRoute, Router } from '@angular/router';
import { NotifyService } from 'abp-ng2-module';
import { SalesProductDto } from "@shared/service-proxies/service-proxies";
import { SalesReceiptReport } from "@shared/reports/sales-receipt-report";
import { debounceTime, distinctUntilChanged, firstValueFrom, map, Observable } from "rxjs";
import moment from "moment";
import { Utils } from "@shared/helpers/Utils";
import { NgxSpinnerService } from "ngx-spinner";

import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";

@Component({
    selector: 'app-sales-entry',
    standalone: false,
    templateUrl: './sales-entry.component.html',
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

            table.table td {
                padding-top: 3px;
                padding-bottom: 3px;
            }

            .card-body {
                padding-bottom: 5px;
            }

            :host ::ng-deep .p-datatable-tbody > tr > td, th {
                padding-left: 5px !important;
                padding-right: 5px !important;
            }

            :host ::ng-deep .p-datatable-tfoot > tr > td {
                padding-top: 3px;
                padding-bottom: 3px;
            }
            
            .fs {
                font-size: smaller;
            }
           
        `
    ]
})

export class SalesEntryComponent extends PagedListingComponentBase<SalesProductDto> implements OnInit {

    @ViewChild('dataTable', { static: true }) dataTable: Table;

    checkedAll: boolean = false;
    checkedAllIndeterminate: boolean = false;

    model = { totalAmount: 0, discount: 0, netAmount: 0, paidAmount: 0, dueAmount: 0 } as SalesEntryDto;
    customers: ComboboxItemDto[] = [];
    stockPoints: ComboboxItemDto[] = [];
    paymentStatuses: ComboboxItemDto[] = [];
    employees: ComboboxItemDto[] = [];

    discountEditMode: boolean = false;
    totalPaidEditMode: boolean = false;
    id?: number;
    date = new Date();
    invalid: boolean = false;
    viewMode: boolean = false;
    saving: boolean = false;
    clientObj: any;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private readonly _salesService: SalesServiceProxy,
        private readonly _purchaseService: PurchaseServiceProxy,
        private readonly _customerService: CustomerServiceProxy,
        private readonly _stockPointService: StockPointServiceProxy,
        private readonly _employeeService: EmployeeServiceProxy,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _router: Router,
        private readonly _notifyService: NotifyService,
        private readonly salesReceiptReport: SalesReceiptReport,
        private spinner: NgxSpinnerService
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        const snapshot = this._activatedRoute.snapshot;
        this.id = snapshot.params['id'];
        this.spinner.show();
        this.viewMode = snapshot.url.map(segment => segment.path)[0] == 'view';
        await this.populateCustomers();
        await Promise.all([
            this.populatePaymentStatuses(),
            this.getModel(),
            this.populateStockPoints(),
            this.populateEmployees()
        ]).then(() => {
            this.cd.detectChanges();
        })
    }

    search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map(term => term === '' ? [] : this.customers.filter(v => v.displayText.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
        );

    onClientChanged() {
        this.model.customerId = this.clientObj.value;
    }

    list(event?: LazyLoadEvent) { }
    delete() { }

    private async getModel() {
        if (!this.id) {
            const lastInvoiceNumber = await firstValueFrom(this._salesService.getLastInvoiceNumber());
            let parsedInvoiceNumber = parseInt(lastInvoiceNumber.slice(1));
            const prefix = lastInvoiceNumber.charAt(0);
            let nextPrefix = prefix;
            if (parsedInvoiceNumber === 99999) {
                nextPrefix = Utils.nextLetter(prefix);
                parsedInvoiceNumber = 0;
            }
            this.model.invoiceNumber = nextPrefix + (parsedInvoiceNumber + 1).toString().padStart(5, "0");
            this.primengTableHelper.records = await firstValueFrom(this._salesService.getAllProducts(undefined));
            this.primengTableHelper.totalRecordsCount = this.primengTableHelper.records.length;
            this.hideLoading();
            this.cd.detectChanges();
            this.spinner.hide();
        }
        else {
            const salesInfo = await firstValueFrom(this._salesService.get(this.id));
            this.clientObj = {
                displayText: this.customers.find(f => f.value == salesInfo.sales.customerId.toString()).displayText,
                isSelected: false,
                value: salesInfo.sales.customerId.toString()
            }
            this.cd.detectChanges();

            this.model = salesInfo.sales;
            this.date = (this.model.date).toDate();
            const products = await firstValueFrom(this._salesService.getAllProducts(this.model.stockPointId));

            salesInfo.salesDetails.forEach(x => {
                const product = products.find(f => f.productId == x.productId);
                product.selected = true;
                product.salesPriceDisabled = false;
                product.qtyDisabled = false;
                product.salesPrice = x.unitPrice;
                product.quantity = x.quantity;
                product.totalPrice = x.totalPrice;
                product.stock = x.quantity + product.stock;
                if (product.stock < 0) this.invalid = true;
            });

            this.primengTableHelper.records = products;
            this.primengTableHelper.totalRecordsCount = products.length;

            this.calculateTotal();
            this.hideLoading();
            this.spinner.hide();
        }
    }

    private async populateCustomers() {
        this.customers = await firstValueFrom(this._customerService.getCustomersSelectList());
    }

    private async populateEmployees() {
        this.employees = await firstValueFrom(this._employeeService.getEmployees(undefined));
    }

    private async populateStockPoints() {
        this.stockPoints = await firstValueFrom(this._stockPointService.getStockPoints(true));
    }

    private async populatePaymentStatuses() {
        this.paymentStatuses = await firstValueFrom(this._purchaseService.getPaymentStatusSelectList());
    }

    referenceNumberChanged() {
        if (this.model.referenceNumber) {
            this.invalid = true;
            this._salesService.checkReferenceNumber(this.model.referenceNumber, this.model.id).subscribe(res => {
                if (res) {
                    abp.message.error("Duplicate reference number detected", "Invalid");
                    this.model.referenceNumber = "";
                } else this.invalid = false;
            });
        }
    }

    async stockPointChanged() {
        this.primengTableHelper.records = await firstValueFrom(this._salesService.getAllProducts(this.model.stockPointId));
        this.primengTableHelper.totalRecordsCount = this.primengTableHelper.records.length;
        this.cd.detectChanges();
    }

    updateTotalPrice(sales: SalesProductDto) {
        sales.totalPrice = parseFloat((sales.salesPrice * sales.quantity).toFixed(2));
        this.calculateTotal();
        this.populatePaymentStatus();
    }

    unitPriceChanged(sales: SalesProductDto) {
        if (!sales.salesPrice) {
            this.setUnitPriceZero(sales);
        } else if (sales.salesPrice < 0) {
            abp.message.info("Unit Price can't be less than 0.", "Invalid Input!");
            this.setUnitPriceZero(sales);
        }
    }

    private setUnitPriceZero(sales: SalesProductDto) {
        sales.salesPrice = 0;
        sales.totalPrice = 0;
        this.calculateTotal();
        this.populatePaymentStatus();
    }

    quantityChanged(sales: SalesProductDto) {
        if (!sales.quantity) {
            this.setQuantityZero(sales);
        } else if (sales.quantity > sales.stock) {
            abp.message.info("Quantity can'be greater than the Stcok.", "Invalid Input!");
            this.setQuantityZero(sales);
        } else if (sales.quantity < 0) {
            abp.message.info("Quantity can't be less than 0.", "Invalid Input!");
            this.setQuantityZero(sales);
        }
    }

    private setQuantityZero(sales: SalesProductDto) {
        sales.quantity = 0;
        sales.totalPrice = 0;
        this.calculateTotal();
        this.populatePaymentStatus();
    }

    calculateTotal() {
        let grandTotal = 0;
        this.primengTableHelper.records.forEach(p => {
            grandTotal += p.totalPrice;
        });
        this.model.totalAmount = parseFloat(grandTotal.toFixed(2));
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
            this.primengTableHelper.records.map(x => {
                x.selected = true;
                x.salesPriceDisabled = false;
                x.qtyDisabled = false;
            })
        } else {
            this.primengTableHelper.records.map(x => {
                x.selected = false;
                x.salesPriceDisabled = true;
                x.qtyDisabled = true;
                x.totalPrice = 0;
                x.quantity = 0;
            });
            this.model.paidAmount = 0;
            this.model.totalAmount = 0;
            this.model.netAmount = 0;
            this.model.dueAmount = 0;
            this.populatePaymentStatus();
        }
    }

    checkedChanged(product: SalesProductDto) {
        if (product.selected) {
            product.salesPriceDisabled = false;
            product.qtyDisabled = false;
        } else {
            product.salesPriceDisabled = true;
            product.qtyDisabled = true;
            product.totalPrice = 0;
            product.quantity = 0;

            this.model.paidAmount = 0;
            this.totalPaidChanged();

            this.updateTotalPrice(product);
        }

        const products = this.primengTableHelper.records;
        if (products.find(x => x.selected) && products.length != products.filter(x => x.selected).length) {
            this.checkedAllIndeterminate = true;
            this.checkedAll = false;
        } else if (products.find(x => x.selected) && products.length == products.filter(x => x.selected).length) {
            this.checkedAllIndeterminate = false;
            this.checkedAll = true;
        }
        else {
            this.checkedAllIndeterminate = false;
            this.checkedAll = false;
        }
    }

    onCustomerChanged() {
        this._customerService.getCustomerPrices(this.model.customerId).subscribe(res => {
            if (res && res.length > 0) {
                res.forEach(el => {
                    const product = this.primengTableHelper.records.find(f => f.productId == el.productId);
                    if (product) product.salesPrice = el.price;
                });
                this.cd.detectChanges();
            }
        })
    }

    save(print: boolean) {
        this.saving = true;
        this.spinner.show();
        const model = this.model;
        model.date = moment(this.date);
        model.customerName = this.customers.find(f => f.value == model.customerId.toString()).displayText;
        const details: SalesDetailsEntryDto[] = [];
        this.primengTableHelper.records.filter(f => f.selected && f.quantity > 0 && f.totalPrice > 0).forEach(x => {
            details.push({
                productId: x.productId,
                productName: x.name,
                unitPrice: x.salesPrice,
                quantity: x.quantity,
                totalPrice: x.totalPrice
            } as SalesDetailsEntryDto);
        });
        model.paymentStatus = model.dueAmount == 0 ? PaymentStatus._1 : model.netAmount == model.dueAmount ? PaymentStatus._3 : PaymentStatus._2;
        const input = {
            sales: model,
            salesDetails: details,
        } as SalesEntryInput;

        input.dueReceived = {
            salesId: model.id,
            customerId: model.customerId,
            creationTime: moment(new Date()),
            invoiceDate: model.date,
            receiveDate: model.date,
            invoiceNumber: model.referenceNumber ? model.referenceNumber : model.invoiceNumber,
            paymentStatus: model.paymentStatus,
            grandTotal: model.totalAmount,
            discount: model.discount,
            netTotal: model.netAmount,
            totalPaid: model.paidAmount,
            due: model.dueAmount,
            default: true,
            remarks: model.remarks
        } as DueReceivedHistoryDto;

        this._salesService.createOrUpdate(input).subscribe(async (id) => {
            this.spinner.hide();
            this._notifyService.success("Successfully " + this.id ? 'Saved' : 'Updated' + "");
            if (print) await this.salesReceiptReport.generateSalesReceipt(id);
            this._router.navigateByUrl('app/sales');
            this.saving = false;
            this.cd.detectChanges();
        });
    }

    submit() {
        this.save(false);
    }

    submitAndPrint() {
        this.save(true);
    }

    cancel() {
        this._router.navigateByUrl('app/sales');
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