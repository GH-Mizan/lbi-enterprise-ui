import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output, ViewChild } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { ComboboxItemDto, CustomerServiceProxy, EmployeeServiceProxy, StockPointServiceProxy, SupplierServiceProxy, VirtualItemServiceProxy, VirtualStockDetailEntryDto, VirtualStockEntryDto, VirtualStockEntryInput, VirtualStocksServiceProxy, VirtualStockType } from "@shared/service-proxies/service-proxies";
import { Table } from "@node_modules/primeng/table";
import { PagedListingComponentBase } from "@shared/paged-listing-component-base";
import { debounceTime, distinctUntilChanged, firstValueFrom, map, Observable } from "rxjs";
import { NgxSpinnerService } from "ngx-spinner";
import moment from "moment";

@Component({
    selector: 'app-virtual-stock-entry',
    templateUrl: './virtual-stock-entry.component.html',
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

            :host ::ng-deep .p-datatable-tbody > tr > td, th {
                padding-left: 5px !important;
                padding-right: 5px !important;
            }
        `
    ]
})

export class VirtualStockEntryComponent extends PagedListingComponentBase<VirtualStockDetailEntryDto> implements OnInit {
    @Output() onSave = new EventEmitter<any>();
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    saving = false;
    checkedAll: boolean = false;
    checkedAllIndeterminate: boolean = false;

    model: VirtualStockEntryInput;
    stock: VirtualStockEntryDto;
    date = new Date();
    minDate? = new Date();

    customers: ComboboxItemDto[];
    suppliers: ComboboxItemDto[];
    stockPoints: ComboboxItemDto[];
    supervisors: ComboboxItemDto[];
    drivers: ComboboxItemDto[];
    reconciliation: boolean = false;
    isClient: boolean;
    warehouseObj: any;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        public bsModalRef: BsModalRef,
        private readonly _customerService: CustomerServiceProxy,
        private readonly _supplierService: SupplierServiceProxy,
        private readonly _employeeService: EmployeeServiceProxy,
        private readonly _stockPointService: StockPointServiceProxy,
        private readonly _virtualItemService: VirtualItemServiceProxy,
        private readonly _virtualStockService: VirtualStocksServiceProxy,
        private readonly spinner: NgxSpinnerService
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this.stock = this.model.stock;
        this.isClient = this.stock.virtualStockType == VirtualStockType._1;
        //this.stockDetails = this.model.stockDetails;
        this.cd.detectChanges();
        this.spinner.show();
        await Promise.all([
            this.loadWarehouses(),
            this.loadStockPoints(),
            this.loadDrivers(),
            this.loadSupervisors(),
            this.getItems()
        ]).then(() => this.spinner.hide());
    }

    search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map(term => term === '' ? [] : this.customers.filter(v => v.displayText.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
        );

    async loadWarehouses() {
        if (this.isClient) {
            this.customers = await firstValueFrom(this._customerService.getCustomersSelectList());
        } else {
            this.suppliers = await firstValueFrom(this._supplierService.getSuppliersSelectList());
        }
        this.cd.detectChanges();
    }

    async loadStockPoints() {
        this.stockPoints = await firstValueFrom(this._stockPointService.getStockPoints(true));
        this.cd.detectChanges();
    }

    async loadDrivers() {
        this.drivers = await firstValueFrom(this._employeeService.getEmployees('Driver'));
        this.cd.detectChanges();
    }

    async loadSupervisors() {
        this.supervisors = await firstValueFrom(this._employeeService.getEmployees('Supervisor'));
        this.cd.detectChanges();
    }

    async getItems() {
        const items = await firstValueFrom(this._virtualItemService.getAll());
        const stockDetails: VirtualStockDetailEntryDto[] = [];
        items.forEach(x => {
            stockDetails.push({ productId: x.id, productName: x.shortName, in: 0, out: 0, stockQty: 0, initialStockQty: 0 } as VirtualStockDetailEntryDto);
        });
        this.primengTableHelper.records = stockDetails;
        this.primengTableHelper.totalRecordsCount = this.primengTableHelper.records.length;
        this.cd.detectChanges();
    }

    checkedAllChanged() {
        if (this.checkedAll) {
            this.primengTableHelper.records.map(x => {
                x.selected = true;
            })
        } else {
            this.primengTableHelper.records.map(x => {
                x.selected = false;
                x.stockQty = x.initialStockQty;
            })
        }
    }

    checkedChanged(item: VirtualStockDetailEntryDto) {
        if (!item.selected) {
            item.in = 0;
            item.out = 0;
            item.stockQty = item.initialStockQty;
        }

        const records = this.primengTableHelper.records;
        if (records.find(x => x.selected) && records.length != records.filter(x => x.selected).length) {
            this.checkedAllIndeterminate = true;
            this.checkedAll = false;
        } else if (records.find(x => x.selected) && records.length == records.filter(x => x.selected).length) {
            this.checkedAllIndeterminate = false;
            this.checkedAll = true;
        }
        else {
            this.checkedAllIndeterminate = false;
            this.checkedAll = false;
        }
    }

    async handleDateSelection() {
        this.isExists();
    }

    async onWarehouseChanged() {
        this.isExists();
    }

    private isExists() {
        if (this.isClient)
            this.stock.clientId = this.warehouseObj?.value;
        if (this.stock.clientId) {
            this._virtualStockService.getVirtualInventoryInfo(this.stock.clientId, this.stock.virtualStockType).subscribe(res => {
                if (res && res.inventories.length > 0) {
                    this.primengTableHelper.records.forEach(x => {
                        x.stockQty = x.initialStockQty = res.inventories.find(f => f.productId == x.productId)?.stockQty ?? 0;
                    });
                }
                if (res.lastDate)
                    this.minDate = res.lastDate.toDate();
                else this.minDate = null;
                this.cd.detectChanges();
                this.spinner.hide();
            })
        }
    }

    reset() {
        this.stock = { clientId: this.stock.clientId } as VirtualStockEntryDto;
        this.primengTableHelper.records.forEach(x => {
            x.id = undefined;
            x.virtualStockId = 0;
            x.in = 0;
            x.out = 0;
            x.stockQty = 0;
            x.initialStockQty = 0;
            x.selected = false;
        });
        this.cd.detectChanges();
    }

    list(event) { }

    delete() { }

    updateStock(item: VirtualStockDetailEntryDto) {
        item.stockQty = item.initialStockQty + item.in - item.out;
        this.cd.detectChanges();
    }

    save() {
        this.saving = true;
        const now = new Date();
        this.date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        this.stock.date = moment(this.date);
        if (this.reconciliation) this.stock.stockPointId = -1;
        this.model.stock = this.stock;
        this.model.stockDetails = this.primengTableHelper.records;

        this._virtualStockService.createVirtualStock(this.model).subscribe(() => {
            this.notify.success("Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }

    validStock() {
        return this.primengTableHelper.records?.find(f => f.stockQty < 0) == null;
    }
}