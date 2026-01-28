import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from "@angular/core";
import moment from "moment";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { PagedListingComponentBase } from "@shared/paged-listing-component-base";
import { AccountHeadServiceProxy, AccountHeadType, ComboboxItemDto, CustomerServiceProxy, DailyCashServiceProxy, EmployeeServiceProxy, SupplierServiceProxy, VoucherEntryDto } from "@shared/service-proxies/service-proxies";
import { LazyLoadEvent } from "primeng/api";
import { Table } from "primeng/table";
import { debounceTime, distinctUntilChanged, firstValueFrom, map, Observable } from "rxjs";
import { Router } from "@angular/router";
import { DataSharingService } from "@shared/services/data-sharing.service";
import { v4 as uuidv4 } from 'uuid';

export type IncomeAccountType = {
    key: string,
    id: number,
    displayText: string,
    amount: number,
    additionalInfo: string,
    uid: string
}

export type ExpenseAccountType = {
    key: string,
    id: number,
    displayText: string,
    amount: number,
    additionalInfo: string,
    uid: string
}

export type VoucherType = {
    voucherNo: string,
    creator: string,
    carNumber: string,
    totalAmount: number,
    remarks: string,
    incomeRecords: IncomeAccountType[],
    expenseRecords: ExpenseAccountType[],
    uid: string
}

export type DailyCashType = {
    type: string,

    incomeKey: string,
    incomeId: number,
    incomeHead: string,
    incomeAmount: number,

    expenseKey: string,
    expenseId: number,
    expenseHead: string,
    expenseAmount: number,
    uid: string
}

@Component({
    selector: 'app-vopucher-entry',
    templateUrl: './voucher-entry.component.html',
    standalone: false,
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
        `
    ]
})

export class VoucherEntryComponent extends PagedListingComponentBase<VoucherType> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    accountTypes: ComboboxItemDto[] = [];
    accountType: string;

    keys: ComboboxItemDto[] = [];
    key: string;

    customers: ComboboxItemDto[] = [];
    customerObj: any;
    customerId: number;

    suppliers: ComboboxItemDto[] = [];
    supplierId: number;

    expenseHeads: ComboboxItemDto[] = [];
    headId: number;

    employees: ComboboxItemDto[] = [];
    employeeObj: any;
    employeeId: number;

    amount: number = 0;

    incomeRecords: IncomeAccountType[] = [];
    expenseRecords: ExpenseAccountType[] = [];
    totalIncome: number = 0;
    totalExpense: number = 0;

    date = new Date();
    minDate = null;
    voucherNo: string;
    creator: string;
    carNumber: string;

    editMode: boolean;
    disabled: boolean;
    busy: boolean;
    saved: boolean = false;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private readonly _customerService: CustomerServiceProxy,
        private readonly _employeeService: EmployeeServiceProxy,
        private readonly _supplierService: SupplierServiceProxy,
        private readonly _accountHeadService: AccountHeadServiceProxy,
        private readonly _dailyCashService: DailyCashServiceProxy,
        private readonly _router: Router,
        private readonly _dataSharingService: DataSharingService
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this.primengTableHelper.records = [];
        this.primengTableHelper.totalRecordsCount = 0;

        this.accountTypes.push({ value: 'INCOME', displayText: 'Income' } as ComboboxItemDto);
        this.accountTypes.push({ value: 'EXPENSE', displayText: 'Expence' } as ComboboxItemDto);
        this.accountType = 'INCOME';

        this.keys.push({ value: 'CLIENT', displayText: 'Client' } as ComboboxItemDto);
        this.keys.push({ value: 'INTERNAL_STUFF', displayText: 'Internal Stuff' } as ComboboxItemDto);
        this.key = 'CLIENT';
        this.cd.detectChanges();

        this._dailyCashService.getVoucherFirstLastDate().subscribe(res => {
            this.date = res.currentDate.toDate();
            this.minDate = res.firstDate?.toDate();
            this.cd.detectChanges();
        });

        await Promise.all(
            [
                (this.customers = await firstValueFrom(this._customerService.getCustomersSelectList())),
                (this.employees = await firstValueFrom(this._employeeService.getEmployees(undefined))),
                (this.suppliers = await firstValueFrom(this._supplierService.getSuppliersSelectList())),
                (this.expenseHeads = await firstValueFrom(this._accountHeadService.getAccountHeadSelectList(AccountHeadType._2))),
            ]
        ).then(() => {
            this.cd.detectChanges();
        });
    }

    search = (text$: Observable<string>) => {
        if (this.accountType === "INCOME") {
            text$.pipe(
                debounceTime(200),
                distinctUntilChanged(),
                map(term => term === '' ? [] : this.customers.filter(v => v.displayText.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
            );
        } else {
            text$.pipe(
                debounceTime(200),
                distinctUntilChanged(),
                map(term => term === '' ? [] : this.employees.filter(v => v.displayText.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
            );
        }

    }

    onCustomerChanged() {
        this.customerId = this.customerObj.value;
    }

    onEmployeeChanged() {
        this.employeeId = this.employeeObj.value;
    }

    onDateChange() {
        this.incomeRecords = [];
        this.expenseRecords = [];
        this.primengTableHelper.records = [];
        this.primengTableHelper.totalRecordsCount = 0;

        this.busy = true;
        this._dailyCashService.getVouchers(moment(this.date)).subscribe(res => {
            if (res.isAny && !res.mostRecennt) this.disabled = true;
            else if (res.isAny && res.mostRecennt) this.editMode = true;
            const records: VoucherType[] = [];
            res.vouchers.forEach(v => {
                const voucher = {
                    voucherNo: v.voucherNumber,
                    creator: v.creator,
                    carNumber: v.carNumber,
                    totalAmount: v.totalAmount,
                    remarks: "",
                    incomeRecords: JSON.parse(v.incomeRecords),
                    expenseRecords: JSON.parse(v.expenseRecords)
                } as VoucherType;
                records.push(voucher);
            });
            this.primengTableHelper.records = records;
            this.primengTableHelper.totalRecordsCount = records.length;
            this.busy = false;
            this.disabled = true;
            this.cd.detectChanges();
        });
    }

    list(event?: LazyLoadEvent) {

    }

    delete() {

    }

    add() {
        if (this.accountType === "INCOME") {
            debugger;
            const incomeRecord = { key: this.key, uid: uuidv4() } as IncomeAccountType;

            if (this.key === "CLIENT") {
                incomeRecord.id = this.customerId;
                incomeRecord.displayText = this.customers.find(f => f.value == incomeRecord.id.toString()).displayText;
            } else {
                incomeRecord.id = this.employeeId;
                incomeRecord.displayText = this.employees.find(f => f.value == incomeRecord.id.toString()).displayText;
            }

            const exists = this.incomeRecords.find(f => f.key === this.key && f.id === incomeRecord.id);
            if (exists) {
                exists.amount += this.amount;
            } else {
                incomeRecord.amount = this.amount;
                this.incomeRecords = [...this.incomeRecords, incomeRecord];
            }

            this.totalIncome = this.getTotalIncome();
        } else {
            const expenseRecord = { key: this.key, uid: uuidv4() } as ExpenseAccountType;

            if (this.key === "SUPPLIER") {
                expenseRecord.id = this.supplierId;
                expenseRecord.displayText = this.suppliers.find(f => f.value == expenseRecord.id.toString()).displayText;
            } else if (this.key === "INTERNAL_STUFF") {
                expenseRecord.id = this.employeeId;
                expenseRecord.displayText = this.employees.find(f => f.value == expenseRecord.id.toString()).displayText;
            } else {
                expenseRecord.id = this.headId;
                expenseRecord.displayText = this.expenseHeads.find(f => f.value == expenseRecord.id.toString()).displayText;
            }

            const exists = this.expenseRecords.find(f => f.key === this.key && f.id === expenseRecord.id);
            if (exists) {
                exists.amount += this.amount;
            } else {
                expenseRecord.amount = this.amount;
                this.expenseRecords = [...this.expenseRecords, expenseRecord];
            }
            this.totalExpense = this.getTotalExpense();
        }

        this.customerId = undefined;
        this.employeeId = undefined;
        this.customerObj = undefined;
        this.employeeObj = undefined;
        this.supplierId = undefined;
        this.headId = undefined;
        this.amount = 0;
        this.cd.detectChanges();
    }

    deleteRecord(type: string, record: IncomeAccountType | ExpenseAccountType) {
        if (type === "INCOME") {
            this.incomeRecords = this.incomeRecords.filter(f => f.uid !== record.uid);
            this.totalIncome = this.getTotalIncome();
        }
        else {
            this.expenseRecords = this.expenseRecords.filter(f => f.uid !== record.uid);
            this.totalExpense = this.getTotalExpense();
        }
    }

    onAccountTypeChanged() {
        this.keys = [];
        if (this.accountType === "INCOME") {
            this.keys.push({ value: 'CLIENT', displayText: 'Client' } as ComboboxItemDto);
            this.keys.push({ value: 'INTERNAL_STUFF', displayText: 'Internal Stuff' } as ComboboxItemDto);
            this.key = 'CLIENT';
        } else {
            this.keys.push({ value: 'SUPPLIER', displayText: 'Supplier' } as ComboboxItemDto);
            this.keys.push({ value: 'INTERNAL_STUFF', displayText: 'Internal Stuff' } as ComboboxItemDto);
            this.keys.push({ value: 'OTHERS', displayText: 'Others' } as ComboboxItemDto);
            this.key = 'SUPPLIER';
        }
        this.onKeyChanged();
        this.cd.detectChanges();
    }

    onKeyChanged() {
        this.customerId = undefined;
        this.employeeId = undefined;
        this.customerObj = undefined;
        this.employeeObj = undefined;
        this.amount = 0;
        this.cd.detectChanges();
    }

    getTotalIncome() {
        return this.incomeRecords.reduce((accumulator, currentValue) => {
            const value = currentValue.amount;
            return accumulator + value;
        }, 0);
    }

    getTotalExpense() {
        return this.expenseRecords.reduce((accumulator, currentValue) => {
            const value = currentValue.amount;
            return accumulator + value;
        }, 0);
    }

    addToList() {
        const voucher = {
            voucherNo: this.voucherNo,
            creator: this.creator,
            carNumber: this.carNumber,
            totalAmount: this.getTotalIncome(),
            remarks: "",
            incomeRecords: this.incomeRecords,
            expenseRecords: this.expenseRecords,
            uid: uuidv4()
        } as VoucherType;
        this.primengTableHelper.records.push(voucher);
        this.primengTableHelper.totalRecordsCount = this.primengTableHelper.records.length;
        this.voucherNo = "";
        this.creator = "";
        this.carNumber = "";
        this.incomeRecords = [];
        this.expenseRecords = [];
        this.totalIncome = 0;
        this.totalExpense = 0;
        this.accountType = "INCOME";
        this.onAccountTypeChanged();
        this.saved = false;
        this.disabled = false;
        this.cd.detectChanges();
    }

    processDailyCash() {
        const vouchers: DailyCashType[] = [];
        this.primengTableHelper.records.forEach(item => {
            item.incomeRecords.forEach(income => {
                const exists = vouchers.find(f => f.type === "INCOME" && f.incomeKey === income.key && f.incomeId === income.id);
                if (exists) exists.incomeAmount += income.amount;
                else {
                    vouchers.push({ type: "INCOME", incomeKey: income.key, incomeId: income.id, incomeHead: income.displayText, incomeAmount: income.amount, uid: uuidv4() } as DailyCashType);
                }
            });

            item.expenseRecords.forEach(expense => {
                const exists = vouchers.find(f => f.type === "EXPENSE" && f.expenseKey === expense.key && f.expenseId === expense.id);
                if (exists) exists.expenseAmount += expense.amount;
                else {
                    vouchers.push({ type: "EXPENSE", expenseKey: expense.key, expenseId: expense.id, expenseHead: expense.displayText, expenseAmount: expense.amount, uid: uuidv4() } as DailyCashType);
                }
            });
        });
        this._dataSharingService.setVouchers(vouchers);
        this._router.navigateByUrl("app/daily-cash/reconciliation");
    }

    saveVouchers() {
        this.busy = true;
        const input: VoucherEntryDto[] = [];
        this.primengTableHelper.records.forEach(item => {
            const voucher = {
                date: moment(this.date),
                voucherNumber: item.voucherNo,
                creator: item.creator,
                carNumber: item.carNumber,
                totalAmount: item.totalAmount,
                incomeRecords: JSON.stringify(item.incomeRecords),
                expenseRecords: JSON.stringify(item.expenseRecords)
            } as VoucherEntryDto;
            input.push(voucher);
        });

        this._dailyCashService.createOrUpdateVoucher(moment(this.date), input).subscribe(res => {
            this.editMode = true;
            this.saved = true;
            this.busy = false;
            this.cd.detectChanges();
            this.notify.success(this.l('SuccessfullySaved'));
        })
    }

    deleteVouchers() {
        abp.message.confirm(`These vouchers will be deleted`,
            'Are you sure?',
            (result: boolean) => {
                if (result) {
                    this._dailyCashService.vouchersRemoveByDate(moment(this.date)).subscribe(() => {
                        this.primengTableHelper.records = [];
                        this.primengTableHelper.totalRecordsCount = 0;
                        this.cd.detectChanges();
                        this.notify.warn(this.l('SuccessfullyDeleted'));
                    })
                }
            }
        );

    }
}