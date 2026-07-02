import { ChangeDetectorRef, Component, HostListener, Injector, OnInit, ViewChild } from "@angular/core";
import moment from "moment";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { PagedListingComponentBase } from "@shared/paged-listing-component-base";
import { AccountHeadServiceProxy, AccountHeadType, AdditionalPartiesServiceProxy, ComboboxItemDto, CreateOrUpdateDailyCashInput, CustomerServiceProxy, DailyCashAdvanceDetailDto, DailyCashDayEndDetailDto, DailyCashEntryDto, DailyCashExpenseDetailDto, DailyCashIncomeDetailDto, DailyCashServiceProxy, EmployeeServiceProxy, SalaryServiceProxy, SupplierServiceProxy, VoucherEntryDto, VoucherOutputDto, VouchersAndDailyCashCreateUpdateDto } from "@shared/service-proxies/service-proxies";
import { LazyLoadEvent } from "primeng/api";
import { Table } from "primeng/table";
import { debounceTime, distinctUntilChanged, firstValueFrom, map, Observable } from "rxjs";
import { Router } from "@angular/router";
import { DataSharingService } from "@shared/services/data-sharing.service";
import { v4 as uuidv4 } from 'uuid';
import { AdvanceType, DayEndCashType, ExpenseType, IncomeType, RecordsSummary } from "../reconciliation/daily-cash-reconciliation.component";

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
    expenseType: string,
    amount: number,
    additionalInfo: string,
    uid: string
}

export type VoucherType = {
    voucherNo: string,
    creatorId: number,
    creator: string,
    carNumber: string,
    totalAmount: number,
    remarks: string,
    incomeRecords: IncomeAccountType[],
    expenseRecords: ExpenseAccountType[],
    dayEndCash: number,
    uid: string
}

export type DailyCashType = {
    type: string,

    incomeKey: string,
    incomeId: number,
    incomeHead: string,
    incomeAmount: number,

    expenseKey: string,
    expenseType: string,
    expenseId: number,
    expenseHead: string,
    expenseAmount: number,
    uid: string
}

export type DailyCashSummaryType = {
    totalIncome: number | undefined,
    totalExpense: number | undefined,
    tempBalance: number | undefined,
    cashBD: number | undefined,
    advanceBD: number | undefined,
    actualBalance: number | undefined,
    difference: number | undefined,
    totalDue: number | undefined,
    balanceCD: number | undefined,
    actualDifference: number | undefined,
}

export type ManToManType = {
    key: string,
    displayText: string
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

            .salary {
                background-color: #f1e384 !important
            }

            .income {
                background-color: #a3b0f7 !important
            }

            .expense {
                background-color: #d5d7e4 !important
            }

            .loan {
                background-color: #e9f772 !important
            }

            .mtm {
                background-color: #bbcbf5 !important
            }

            .difference {
                background-color: #f3f58f !important
            }

            .ac-diff-red {
                background-color: #f59786 !important
            }

            .ac-diff-green {
                background-color: #7eeb8d !important
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

    incomeHeads: ComboboxItemDto[] = [];
    incomeHeadId: number;

    expenseHeads: ComboboxItemDto[] = [];
    expenseHeadObj: any;
    headId: number;

    expenseTypes: ComboboxItemDto[] = [];
    expenseType: string;

    employees: ComboboxItemDto[] = [];
    employeeObj: any;
    employeeId: number;

    additionalParties: ComboboxItemDto[] = [];
    partyObj: any;
    partyId: number;

    amount: number = 0;

    incomeRecords: IncomeAccountType[] = [];
    expenseRecords: ExpenseAccountType[] = [];
    totalIncome: number = 0;
    totalExpense: number = 0;

    date = new Date();
    minDate = new Date();
    voucherNo: string;
    creators: ComboboxItemDto[] = [];
    creatorObj: any;
    creatorId: number;
    creator: string | undefined;
    creatorDisabled: boolean = false;
    carNumber: string;

    editMode: boolean;
    disabled: boolean;
    busy: boolean;
    saved: boolean = false;
    voucherEditMode: boolean = false;
    voucherUid: string;
    cashInHand: number | undefined;
    isLast: boolean;

    dailyCashId: number | undefined;
    dailyCashIncomeRecords: IncomeType[] = [];
    dailyCashExpenseRecords: ExpenseType[] = [];
    dailyCashAdvanceRecords: AdvanceType[] = [];
    dailyCashDayEndCashRecords: DayEndCashType[] = [];
    dailyCashRecordsSummary: DailyCashSummaryType[] = [];
    dailyCashTotalIncome: number = 0;
    dailyCashTotalDue: number | undefined = 0;
    dailyCashTotalExpense: number = 0;
    dailyCashTotalAdvance: number = 0;
    dailyCashBalanceBDAdvance: number = 0;
    dailyCashTotalDayEndCash: number = 0;
    dailyCashDifference: number | undefined;
    dailyCashActualDifference: number | undefined;
    listPending: boolean = true;
    startingBalanceCD: number;
    completed: boolean = false;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private readonly _customerService: CustomerServiceProxy,
        private readonly _employeeService: EmployeeServiceProxy,
        private readonly _partiesService: AdditionalPartiesServiceProxy,
        private readonly _supplierService: SupplierServiceProxy,
        private readonly _accountHeadService: AccountHeadServiceProxy,
        private readonly _dailyCashService: DailyCashServiceProxy,
        private readonly _salaryService: SalaryServiceProxy,
        private readonly _router: Router,
        private readonly _dataSharingService: DataSharingService
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this.busy = true;
        this.primengTableHelper.records = [];
        this.primengTableHelper.totalRecordsCount = 0;

        this.accountTypes.push({ value: 'INCOME', displayText: 'Receive' } as ComboboxItemDto);
        this.accountTypes.push({ value: 'EXPENSE', displayText: 'Payment' } as ComboboxItemDto);
        this.accountType = 'INCOME';

        this.keys.push({ value: 'CLIENT', displayText: 'Client' } as ComboboxItemDto);
        this.keys.push({ value: 'INTERNAL_STUFF', displayText: 'Internal Staff' } as ComboboxItemDto);
        this.keys.push({ value: 'MSC', displayText: 'Miscellaneous' } as ComboboxItemDto);
        this.key = 'CLIENT';

        this.expenseTypes.push({ value: 'SALARY_ADVANCE', displayText: 'Salary & Allowance' } as ComboboxItemDto);
        this.expenseTypes.push({ value: 'DAY_END_CASH', displayText: 'Advance/Dayend Cash' } as ComboboxItemDto);
        //this.expenseTypes.push({ value: 'OTHERS', displayText: 'Others' } as ComboboxItemDto);
        this.expenseType = 'OTHERS';

        this.incomeHeads.push({ value: '1', displayText: 'Fine' } as ComboboxItemDto);
        this.incomeHeadId = 1;

        this.cd.detectChanges();

        this._dailyCashService.getStartDate().subscribe(res => {
            this.date = res.toDate();
            this.minDate = new Date(2026, 4, 23);
            this.cd.detectChanges();
        });

        await Promise.all(
            [
                (this.customers = await firstValueFrom(this._customerService.getCustomersSelectList())),
                (this.employees = this.creators = await firstValueFrom(this._employeeService.getEmployees(undefined))),
                (this.additionalParties = await firstValueFrom(this._partiesService.getAdditionalPartiesSelectlist())),
                (this.suppliers = await firstValueFrom(this._supplierService.getSuppliersSelectList())),
                (this.expenseHeads = await firstValueFrom(this._accountHeadService.getAccountHeadSelectList(AccountHeadType._2))),
                this.onDateChange()
                //this.prepareAtFirstDailyCash()
            ]
        ).then(() => {
            this.cd.detectChanges();
        });
    }

    async prepareAtFirstDailyCash() {
        debugger;
        this.dailyCashIncomeRecords = [];
        this.dailyCashExpenseRecords = [];
        this.dailyCashAdvanceRecords = [];
        this.dailyCashDayEndCashRecords = [];
        this.dailyCashRecordsSummary = [];

        this.dailyCashIncomeRecords.push({ key: "CLIENT", id: -2, head: "Balance B/D (Cash)", amount: 118356 } as IncomeType);
        this.dailyCashIncomeRecords.push({ key: "CLIENT", id: -1, head: "Balance B/D (Advance)", amount: 254754 } as IncomeType);

        this.dailyCashIncomeRecords.push({ key: "LOAN", id: 1, head: "Loan (Md. Sadekur Rahman)", amount: 102271 } as IncomeType);
        //this.dailyCashIncomeRecords.push({ key: "LOAN", id: 41, head: "Loan (Md. Sadekur Rahman)", amount: 152 } as IncomeType);

        const advanceInfo = await firstValueFrom(this._salaryService.getSalaryAdvanceList());
        const advanceRecords = advanceInfo.advances.filter(f => f.advance > 0);
        debugger;
        if (advanceRecords.length > 0) {
            advanceRecords.forEach(x => {
                this.dailyCashAdvanceRecords.push({ type: 'INTERNAL_STUFF', employeeId: x.employeeId, head: x.employeeName, amount: x.advance, uid: uuidv4() } as AdvanceType);
            })
        }

        const partiesAdvance = advanceInfo.additionalParitesAdvances.filter(f => f.advance > 0);
        if (partiesAdvance.length > 0) {
            partiesAdvance.forEach(x => {
                this.dailyCashAdvanceRecords.push({ type: 'ADDITIONAL_PARTIES', employeeId: x.id, head: x.partyName, amount: x.advance, uid: uuidv4() } as AdvanceType);
            })
        }

        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 5, head: 'Cash in Hand (Md. Ashraf Uddin)', amount: 32654, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 12, head: 'Cash in Hand (Md.Masum)', amount: 55483, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 13, head: 'Cash in Hand (Sabbir)', amount: 7901, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 40, head: 'Cash in Hand (Abdur Rahim)', amount: 5579, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 6, head: 'Cash in Hand (Sakib)', amount: 7050, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 42, head: 'Cash in Hand (Meraj)', amount: 956, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 17, head: 'Cash in Hand (Tafsir)', amount: 7040, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 24, head: 'Cash in Hand (Tanvir)', amount: 1293, mtmKey: '', uid: uuidv4() } as DayEndCashType);
        this.dailyCashDayEndCashRecords.push({ type: 'DAY_END_CASH', employeeId: 15, head: 'Cash in Hand (Mubarak)', amount: 400, mtmKey: '', uid: uuidv4() } as DayEndCashType);


        this.calculateAllDailyCashTotal();

        this.dailyCashDifference = (this.dailyCashTotalDayEndCash + this.dailyCashTotalAdvance) - (this.dailyCashTotalIncome - 0);
        const summaryInput = {
            totalIncome: this.dailyCashTotalIncome,
            totalExpense: 0,
            tempBalance: this.dailyCashTotalIncome,
            cashBD: this.dailyCashTotalDayEndCash,
            advanceBD: this.dailyCashTotalAdvance,
            actualBalance: this.dailyCashTotalDayEndCash + this.dailyCashTotalAdvance,
            difference: this.dailyCashDifference,
            totalDue: this.dailyCashTotalDue,
            balanceCD: this.dailyCashTotalDue,
            actualDifference: (this.dailyCashDifference ?? 0) + (this.dailyCashTotalDue ?? 0)
        } as DailyCashSummaryType;
        this.startingBalanceCD = summaryInput.balanceCD;


        this.pupulateDailyCashSummary(summaryInput);

        this.busy = false;
        this.cd.detectChanges();

    }

    async getPreviousDailyCashInfo() {
        this.dailyCashIncomeRecords = [];
        this.dailyCashExpenseRecords = [];
        this.dailyCashAdvanceRecords = [];
        this.dailyCashDayEndCashRecords = [];
        this.dailyCashRecordsSummary = [];
        const dayStartBalance = await firstValueFrom(this._dailyCashService.getPreviousDailyCash(moment(this.date)));
        this.dailyCashId = dayStartBalance.id;
        this.isLast = dayStartBalance.isLast;
        this.completed = dayStartBalance.completed;

        debugger;
        if (!dayStartBalance.isNew) {
            // if (!dayStartBalance.completed)
            //     this.date = dayStartBalance.date.toDate();

            this.getVouchers(dayStartBalance.vouchers);

            dayStartBalance.incomes.forEach(x => {
                this.dailyCashIncomeRecords.push({ key: x.key, id: x.incomeId, head: x.head, amount: x.amount, mtmKey: x.mtmKey, uid: x.uid } as IncomeType);
            });
            dayStartBalance.expenses.forEach(x => {
                this.dailyCashExpenseRecords.push({ key: x.key, id: x.expenseId, head: x.head, amount: x.amount, uid: x.uid } as ExpenseType);
            });

            dayStartBalance.advances.forEach(x => {
                this.dailyCashAdvanceRecords.push({ type: x.type, employeeId: x.employeeId, head: x.head, amount: x.amount, uid: x.uid } as AdvanceType);
            });

            dayStartBalance.dayEndCashes.forEach(x => {
                this.dailyCashDayEndCashRecords.push({ type: x.type, employeeId: x.employeeId, head: x.head, amount: x.amount, mtmKey: x.mtmKey, uid: x.uid } as DayEndCashType);
            });

            this.calculateAllDailyCashTotal();
            this.startingBalanceCD = dayStartBalance.balanceCD;
            const summaryInput = {
                totalIncome: dayStartBalance.totalIncome,
                totalExpense: dayStartBalance.totalExpense,
                tempBalance: dayStartBalance.paperBalance,
                cashBD: dayStartBalance.totalDayEndCash,
                advanceBD: dayStartBalance.totalAdvance,
                actualBalance: dayStartBalance.actualBalance,
                difference: dayStartBalance.difference,
                totalDue: dayStartBalance.totalDue,
                balanceCD: dayStartBalance.balanceCD,
                actualDifference: dayStartBalance.actualDifference
            } as DailyCashSummaryType;
            this.pupulateDailyCashSummary(summaryInput);
        } else {
            this.completed = false;
            debugger;
            //if(dayStartBalance.completed) 
            //this.date = dayStartBalance.date.toDate();
            this.dailyCashIncomeRecords.push({ key: "CLIENT", id: -2, head: "Balance B/D (Cash)", amount: dayStartBalance.totalDayEndCash } as IncomeType);
            this.dailyCashIncomeRecords.push({ key: "CLIENT", id: -1, head: "Balance B/D (Advance)", amount: dayStartBalance.totalAdvance } as IncomeType);

            dayStartBalance.incomes.filter(f => f.key === "LOAN").forEach(x => {
                this.dailyCashIncomeRecords.push({ key: x.key, id: x.incomeId, head: x.head, amount: x.amount, mtmKey: x.mtmKey, uid: x.uid } as IncomeType);
            });

            dayStartBalance.advances.forEach(x => {
                this.dailyCashAdvanceRecords.push({ type: x.type, employeeId: x.employeeId, head: x.head, amount: x.amount, uid: x.uid } as AdvanceType);
            });

            dayStartBalance.dayEndCashes.forEach(x => {
                this.dailyCashDayEndCashRecords.push({ type: x.type, employeeId: x.employeeId, head: x.head, amount: x.amount, mtmKey: x.mtmKey, uid: x.uid } as DayEndCashType);
            });

            debugger;
            this.calculateAllDailyCashTotal();

            const actualBalance = this.dailyCashTotalDayEndCash + this.dailyCashTotalAdvance;
            this.dailyCashDifference = actualBalance - this.dailyCashTotalIncome;
            //this.startingBalanceCD = (!dayStartBalance.balanceCD || dayStartBalance.balanceCD == 0) ? this.dailyCashTotalDue : dayStartBalance.balanceCD;
            this.startingBalanceCD = this.dailyCashTotalDue ?? 0;
            const summaryInput = {
                totalIncome: this.dailyCashTotalIncome,
                totalExpense: 0,
                tempBalance: this.dailyCashTotalIncome,
                cashBD: this.dailyCashTotalDayEndCash,
                advanceBD: this.dailyCashTotalAdvance,
                actualBalance: actualBalance,
                difference: this.dailyCashDifference,
                totalDue: this.dailyCashTotalDue,
                balanceCD: this.dailyCashTotalDue,
                actualDifference: (this.dailyCashDifference ?? 0) + (this.dailyCashTotalDue ?? 0)
            } as DailyCashSummaryType;
            this.pupulateDailyCashSummary(summaryInput);
        }

        this.cd.detectChanges();
    }

    pupulateDailyCashSummary(summary: DailyCashSummaryType) {
        this.dailyCashRecordsSummary = [];
        this.dailyCashRecordsSummary.push(summary);

        // this.dailyCashRecordsSummary.push({ head: 'Total Income', type: "", amount: summary.totalIncome });
        // this.dailyCashRecordsSummary.push({ head: 'Total Expense', type: "", amount: summary.totalExpense });
        // this.dailyCashRecordsSummary.push({ head: 'Temp Balance', type: "", amount: summary.tempBalance });

        // this.dailyCashRecordsSummary.push({ head: '', type: "", amount: undefined });
        // this.dailyCashRecordsSummary.push({ head: '', type: "", amount: undefined });

        // this.dailyCashRecordsSummary.push({ head: 'Cash (B/D)', type: "", amount: summary.cashBD });
        // this.dailyCashRecordsSummary.push({ head: 'Advance (B/D)', type: "", amount: summary.advanceBD });
        // this.dailyCashRecordsSummary.push({ head: 'Actual Balance', type: "", amount: summary.actualBalance });

        // this.dailyCashRecordsSummary.push({ head: '', type: "", amount: undefined });
        // this.dailyCashDifference = summary.difference; //Actual Balance - Paper balance. here paper balance is dailyCashTotalIncome because the totalExpense is 0)
        // this.dailyCashRecordsSummary.push({ head: 'Difference', type: "DIFFERENCE", amount: this.dailyCashDifference });

        // this.dailyCashRecordsSummary.push({ head: '', type: "", amount: undefined });
        // this.dailyCashRecordsSummary.push({ head: '', type: "", amount: undefined });

        // this.dailyCashRecordsSummary.push({ head: 'Balance C/D', type: "", amount: summary.balanceCD });
        // this.dailyCashActualDifference = summary.actualDifference
        // this.dailyCashRecordsSummary.push({ head: 'Actual Difference', type: "", amount: this.dailyCashActualDifference });
    }

    calculateAllDailyCashTotal() {
        this.calculateDailyCashTotalIncome();
        this.calculateDailyCashTotalExpense();
        this.calculateDailyCashTotalAdvance();
        this.calculateDailyCashTotalDayEndCashes();
        this.cd.detectChanges();
    }

    calculateDailyCashTotalIncome() {
        this.dailyCashTotalIncome = this.dailyCashIncomeRecords.reduce((accumulator, currentItem) => {
            return accumulator + currentItem.amount;
        }, 0);

        this.dailyCashTotalDue = this.dailyCashIncomeRecords.filter(f => f.key === "LOAN").reduce((accumulator, currentItem) => {
            return accumulator + currentItem.amount;
        }, 0);
    }
    calculateDailyCashTotalExpense() {
        this.dailyCashTotalExpense = this.dailyCashExpenseRecords.reduce((accumulator, currentItem) => {
            return accumulator + currentItem.amount;
        }, 0);
    }
    calculateDailyCashTotalAdvance() {
        this.dailyCashTotalAdvance = this.dailyCashAdvanceRecords.reduce((accumulator, currentItem) => {
            return accumulator + currentItem.amount;
        }, 0);
    }
    calculateDailyCashTotalDayEndCashes() {
        this.dailyCashTotalDayEndCash = this.dailyCashDayEndCashRecords.reduce((accumulator, currentItem) => {
            return accumulator + currentItem.amount;
        }, 0);
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
    onExpenseHeadChanged() {
        this.headId = this.expenseHeadObj.value;
    }

    onCreatorChanged() {
        this.creatorId = this.creatorObj.value;
        this.creator = this.creatorObj.displayText;
    }

    getVouchers(vouchers: VoucherOutputDto[]) {
        this.incomeRecords = [];
        this.expenseRecords = [];
        this.primengTableHelper.records = [];
        this.primengTableHelper.totalRecordsCount = 0;
        //const res = await firstValueFrom(this._dailyCashService.getVouchers(moment(this.date)));
        //this.hasDailyCash = res?.hasDailyCash;
        //if (res.isAny && !res.mostRecennt) this.disabled = true;
        //else if (res.isAny && res.mostRecennt) this.editMode = true;
        const records: VoucherType[] = [];
        debugger;
        vouchers.forEach(v => {
            const voucher = {
                voucherNo: v.voucherNumber,
                creatorId: v.creatorId,
                creator: this.creators.find(f => f.value === v.creatorId.toString())?.displayText,
                carNumber: v.carNumber,
                totalAmount: v.totalAmount,
                remarks: "",
                incomeRecords: JSON.parse(v.incomeRecords),
                expenseRecords: JSON.parse(v.expenseRecords),
                dayEndCash: v.dayEndCash,
                uid: uuidv4()
            } as VoucherType;
            records.push(voucher);
        });
        this.primengTableHelper.records = records;
        this.primengTableHelper.totalRecordsCount = records.length;
        this.sortVouchers();

        this.disabled = true;
        this.cd.detectChanges();
    }

    async onDateChange() {
        this.busy = true;
        await Promise.all(
            [
                //this.getVouchers(),
                this.getPreviousDailyCashInfo()
            ]
        ).then(() => {
            this.busy = false;
            this.cd.detectChanges();
        });
    }

    list(event?: LazyLoadEvent) {

    }

    delete() {

    }

    calculateCashInHand() {
        const tIncome = this.getTotalIncome();
        const tExpense = this.getTotalExpense();

        //let iBalance = this.incomeRecords.find(f=> f.key === "BALANCE");
        //let eBalance = this.expenseRecords.find(f=> f.key === "BALANCE");

        if (tIncome > tExpense) {
            this.cashInHand = tIncome - tExpense;
            this.expenseRecords.push({ key: 'BALANCE', id: -11, displayText: 'Cash In Hand', amount: this.cashInHand, uid: uuidv4() } as ExpenseAccountType);

            //eBalance.amount =  tIncome - tExpense;
            //iBalance.amount = 0;
        } else if (tExpense > tIncome) {
            this.cashInHand = - (tExpense - tIncome);
            this.incomeRecords.push({ key: 'BALANCE', id: -11, displayText: 'Due', amount: -(this.cashInHand), uid: uuidv4() } as ExpenseAccountType);
            //iBalance.amount =  tExpense - tIncome;
            //eBalance.amount = 0;
        } else {
            this.cashInHand = 0;
            //eBalance.amount = iBalance.amount = 0;
        }
        this.cd.detectChanges();
    }

    getMtmInfo(senderId: number, senderName: string, receiverId: number, receiverName: string) {
        return {
            key: `${receiverId.toString()}F${senderId.toString()}`,
            displayText: `${receiverName} From ${senderName}`
        } as ManToManType;
    }

    add() {
        //this.incomeRecords.push({key: 'BALANCE', id: -11, displayText: 'Due', amount: 0, uid: uuidv4()} as IncomeAccountType);
        //this.expenseRecords.push({key: 'BALANCE', id: -11, displayText: 'Cash In Hand', amount: 0, uid: uuidv4()} as ExpenseAccountType);
        if (!this.creatorId) {
            abp.message.error("Voucher creator is empty.", "Sorry!");
            return;
        }

        if (this.amount === 0) {
            abp.message.error("Please use a different amount instead of 0", "Sorry!");
            return;
        }

        if (this.accountType == 'EXPENSE' && this.key == 'INTERNAL_STUFF' && !this.expenseType) {
            abp.message.error("Please select an Expense Type.", "Sorry!");
            return;
        }

        const uid = uuidv4();

        this.incomeRecords = this.incomeRecords.filter(f => f.key !== 'BALANCE');
        this.expenseRecords = this.expenseRecords.filter(f => f.key !== 'BALANCE');

        debugger;

        if (this.accountType === "INCOME") {
            const incomeRecord = { key: this.key, uid: uid } as IncomeType;
            if (this.key === "CLIENT") {
                incomeRecord.id = this.customerId;
                incomeRecord.head = this.customers.find(f => f.value == incomeRecord.id.toString())?.displayText;

                const exists = this.dailyCashIncomeRecords.find(f => f.key === this.key && f.id == incomeRecord.id);
                if (exists) {
                    exists.uid = uid;
                    exists.amount += this.amount;
                } else {
                    incomeRecord.amount = this.amount;
                    this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                }
            } else if (this.key === "INTERNAL_STUFF") {
                incomeRecord.id = this.employeeId;
                if (this.creatorId != incomeRecord.id) {
                    const sender = this.employees.find(f => f.value == incomeRecord.id.toString()).displayText;
                    const mtm = this.getMtmInfo(incomeRecord.id, sender, this.creatorId, this.creator);
                    const exists = this.dailyCashIncomeRecords.find(f => f.key === 'MTM' && f.mtmKey == mtm.key);
                    if (exists) {
                        exists.uid = uid;
                        exists.amount += this.amount;
                    } else {
                        incomeRecord.key = 'MTM';
                        incomeRecord.head = mtm.displayText;
                        incomeRecord.amount = this.amount;
                        incomeRecord.mtmKey = mtm.key;
                        this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                    }
                } else {
                    incomeRecord.head = `Due/Loan (${this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText})`;

                    const exists = this.dailyCashIncomeRecords.find(f => f.key === 'LOAN' && f.id == incomeRecord.id);
                    if (exists) {
                        exists.uid = uid;
                        exists.amount += this.amount;
                    } else {
                        incomeRecord.key = 'LOAN';
                        incomeRecord.amount = this.amount;
                        this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                    }
                }

            }
            else {
                incomeRecord.id = this.incomeHeadId;
                incomeRecord.head = this.incomeHeads.find(f => f.value == incomeRecord.id.toString())?.displayText;

                const exists = this.dailyCashIncomeRecords.find(f => f.key === this.key && f.id == incomeRecord.id);
                if (exists) {
                    exists.uid = uid;
                    exists.amount += this.amount;
                } else {
                    incomeRecord.amount = this.amount;
                    this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                }
            }
            debugger;


            if (this.key === "INTERNAL_STUFF") {
                if (this.creatorId != incomeRecord.id) {
                    const sender = this.employees.find(f => f.value == incomeRecord.id.toString()).displayText;
                    const mtm = this.getMtmInfo(incomeRecord.id, sender, this.creatorId, this.creator);
                    const dayEndCashExists = this.dailyCashDayEndCashRecords.find(f => f.type === 'MTM' && f.mtmKey == mtm.key);
                    if (dayEndCashExists) {
                        const diff = incomeRecord.amount - dayEndCashExists.amount;
                        this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f => f.uid != uid);
                        this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f => f.uid != dayEndCashExists.uid);
                        if (diff < 0) {
                            dayEndCashExists.amount = -(diff);
                            this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCashExists];
                        } else if (diff > 0) {
                            const incomeRecord = { key: 'MTM', id: this.employeeId, uid: uid, amount: diff, mtmKey: mtm.key } as IncomeType;
                            incomeRecord.head = mtm.displayText;
                            //incomeRecord.head = this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText + "(Due/Loan)";
                            this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                        }
                    }
                } else {
                    const dayEndCashExists = this.dailyCashDayEndCashRecords.find(f => f.type === 'DAY_END_CASH' && f.employeeId == this.employeeId);
                    if (dayEndCashExists) {
                        const diff = incomeRecord.amount - dayEndCashExists.amount;
                        this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f => f.uid != uid);
                        this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f => f.uid != dayEndCashExists.uid);
                        if (diff < 0) {
                            dayEndCashExists.amount = -(diff);
                            this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCashExists];
                        } else if (diff > 0) {
                            const incomeRecord = { key: 'LOAN', id: this.employeeId, uid: uid, amount: diff } as IncomeType;
                            incomeRecord.head = `Due/Loan (${this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText})`;
                            //incomeRecord.head = this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText + "(Due/Loan)";
                            this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                        }
                    }
                }
            }

        } else {
            if (this.key === "SUPPLIER") {
                const expenseRecord = { key: this.key, id: this.supplierId, uid: uid } as ExpenseType;
                expenseRecord.head = this.suppliers.find(f => f.value == expenseRecord.id.toString())?.displayText;
                const exists = this.dailyCashExpenseRecords.find(f => f.key === this.key && f.id == expenseRecord.id);
                if (exists) {
                    exists.uid = uid;
                    exists.amount += this.amount;
                } else {
                    expenseRecord.amount = this.amount;
                    this.dailyCashExpenseRecords = [...this.dailyCashExpenseRecords, expenseRecord];
                }
            } else if (this.key === "INTERNAL_STUFF") {
                //         this.expenseTypes.push({ value: 'SALARY_ADVANCE', displayText: 'Salary/Advance' } as ComboboxItemDto);
                // this.expenseTypes.push({ value: 'DAY_END_CASH', displayText: 'Day End Cash' } as ComboboxItemDto);
                // this.expenseTypes.push({ value: 'OTHERS', displayText: 'Others' } as ComboboxItemDto);
                if (this.expenseType === 'SALARY_ADVANCE') {
                    //const advanceRecord = { key: 'INTERNAL_STUFF', type: 'SALARY_ADVANCE', employeeId: this.employeeId, uid: uid } as AdvanceType;
                    const advanceRecord = { type: 'INTERNAL_STUFF', employeeId: this.employeeId, uid: uid } as AdvanceType;
                    advanceRecord.head = this.employees.find(f => f.value == advanceRecord.employeeId.toString())?.displayText;
                    //const exists = this.dailyCashAdvanceRecords.find(f => f.key === 'INTERNAL_STUFF' && f.type === 'SALARY_ADVANCE' && f.employeeId == advanceRecord.employeeId);
                    const exists = this.dailyCashAdvanceRecords.find(f => f.type === 'INTERNAL_STUFF' && f.employeeId == advanceRecord.employeeId);
                    if (exists) {
                        exists.uid = uid;
                        exists.amount += this.amount;
                    } else {
                        advanceRecord.amount = this.amount;
                        this.dailyCashAdvanceRecords = [...this.dailyCashAdvanceRecords, advanceRecord];
                    }

                } else if (this.expenseType === 'DAY_END_CASH') {
                    if (this.creatorId != this.employeeId) {
                        const receiver = this.employees.find(f => f.value == this.employeeId.toString()).displayText;
                        const mtm = this.getMtmInfo(this.creatorId, this.creator, this.employeeId, receiver);
                        const exists = this.dailyCashDayEndCashRecords.find(f => f.type === 'MTM' && f.mtmKey == mtm.key);

                        if (exists) {
                            exists.uid = uid;
                            exists.head = mtm.displayText;
                            exists.amount += this.amount;
                        } else {
                            const dayEndCash = { type: 'MTM', employeeId: this.employeeId, mtmKey: mtm.key, head: mtm.displayText, uid: uid } as DayEndCashType;
                            dayEndCash.amount = this.amount;
                            this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                        }
                    } else {
                        const dayEndCash = { type: 'DAY_END_CASH', employeeId: this.employeeId, uid: uid } as DayEndCashType;
                        dayEndCash.head = `Cash in Hand (${this.employees.find(f => f.value == dayEndCash.employeeId.toString())?.displayText})`;
                        const exists = this.dailyCashDayEndCashRecords.find(f => f.type === 'DAY_END_CASH' && f.employeeId == dayEndCash.employeeId);
                        if (exists) {
                            exists.uid = uid;
                            exists.amount += this.amount;
                        } else {
                            dayEndCash.amount = this.amount;
                            this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                        }
                    }


                    if (this.creatorId != this.employeeId) {
                        const receiver = this.employees.find(f => f.value == this.employeeId.toString()).displayText;
                        const mtm = this.getMtmInfo(this.creatorId, this.creator, this.employeeId, receiver);
                        const incomeExists = this.dailyCashIncomeRecords.find(f => f.key === 'MTM' && f.mtmKey == mtm.key);
                        const dayEndCash = { type: 'MTM', employeeId: this.employeeId, mtmKey: mtm.key, head: mtm.displayText, amount: this.amount, uid: uid } as DayEndCashType;

                        if (incomeExists) {
                            const diff = incomeExists.amount - this.amount;
                            this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f => f.uid != incomeExists.uid);
                            this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f => f.uid != dayEndCash.uid);
                            if (diff < 0) {
                                dayEndCash.amount = -(diff);
                                this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                            } else if (diff > 0) {
                                const incomeRecord = { key: 'MTM', id: this.employeeId, uid: uid, mtmKey: mtm.key, head: mtm.displayText, amount: diff } as IncomeType;
                                this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                            }
                        }
                    } else {
                        const dayEndCash = { type: 'DAY_END_CASH', employeeId: this.employeeId, amount: this.amount, uid: uid } as DayEndCashType;
                        dayEndCash.head = `Cash in Hand (${this.employees.find(f => f.value == dayEndCash.employeeId.toString())?.displayText})`;
                        const incomeExists = this.dailyCashIncomeRecords.find(f => f.key === 'LOAN' && f.id == this.employeeId);
                        if (incomeExists) {
                            const diff = incomeExists.amount - dayEndCash.amount;
                            this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f => f.uid != incomeExists.uid);
                            this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f => f.uid != dayEndCash.uid);
                            if (diff < 0) {
                                dayEndCash.amount = -(diff);
                                this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                            } else if (diff > 0) {
                                const incomeRecord = { key: 'LOAN', id: this.employeeId, uid: uid, amount: diff } as IncomeType;
                                incomeRecord.head = `Due/Loan (${this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText})`;
                                this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                            }
                        }
                    }
                }
            } else if (this.key === "ADDITIONAL_PARTIES") {
                //const advanceRecord = { key: 'ADDITIONAL_PARTIES', type: 'SALARY_ADVANCE', employeeId: this.partyId, uid: uid } as AdvanceType;
                const advanceRecord = { type: 'ADDITIONAL_PARTIES', employeeId: this.partyId, uid: uid } as AdvanceType;
                advanceRecord.head = this.additionalParties.find(f => f.value == this.partyId.toString())?.displayText;
                //const exists = this.dailyCashAdvanceRecords.find(f => f.type === 'SALARY_ADVANCE' && f.key === 'ADDITIONAL_PARTIES' && f.employeeId == advanceRecord.employeeId);
                const exists = this.dailyCashAdvanceRecords.find(f => f.type === 'ADDITIONAL_PARTIES' && f.employeeId == advanceRecord.employeeId);
                if (exists) {
                    exists.uid = uid;
                    exists.amount += this.amount;
                } else {
                    advanceRecord.amount = this.amount;
                    this.dailyCashAdvanceRecords = [...this.dailyCashAdvanceRecords, advanceRecord];
                }
            } else { //OTHERS
                const expenseRecord = { key: this.key, id: this.headId, uid: uid } as ExpenseType;
                expenseRecord.head = this.expenseHeads.find(f => f.value == expenseRecord.id.toString())?.displayText;
                const exists = this.dailyCashExpenseRecords.find(f => f.key === this.key && f.id == expenseRecord.id);
                if (exists) {
                    exists.uid = uid;
                    exists.amount += this.amount;
                } else {
                    expenseRecord.amount = this.amount;
                    this.dailyCashExpenseRecords = [...this.dailyCashExpenseRecords, expenseRecord];
                }
            }
        }

        this.calculateAllDailyCashTotal();
        this.calculateSummary();

        if (this.accountType === "INCOME") {
            const incomeRecord = { key: this.key, uid: uid } as IncomeAccountType;

            if (this.key === "CLIENT") {
                incomeRecord.id = this.customerId;
                incomeRecord.displayText = this.customers.find(f => f.value == incomeRecord.id.toString()).displayText;
            } else if (this.key === "INTERNAL_STUFF") {
                incomeRecord.id = this.employeeId;
                incomeRecord.displayText = this.employees.find(f => f.value == incomeRecord.id.toString()).displayText;
            } else {
                incomeRecord.id = this.incomeHeadId;
                incomeRecord.displayText = this.incomeHeads.find(f => f.value == incomeRecord.id.toString()).displayText;
            }

            const exists = this.incomeRecords.find(f => f.key === this.key && f.id == incomeRecord.id);
            if (exists) {
                exists.uid = uid;
                exists.amount += this.amount;
            } else {
                incomeRecord.amount = this.amount;
                this.incomeRecords = [...this.incomeRecords, incomeRecord];
            }

        } else {
            const expenseRecord = { key: this.key, uid: uid } as ExpenseAccountType;

            if (this.key === "INTERNAL_STUFF") {
                expenseRecord.id = this.employeeId;
                expenseRecord.expenseType = this.expenseType;
                expenseRecord.displayText = this.employees.find(f => f.value == expenseRecord.id.toString()).displayText;

                if (this.expenseType === 'SALARY_ADVANCE') {
                    const exists = this.expenseRecords.find(f => f.key === this.key && f.id == expenseRecord.id && f.expenseType == 'SALARY_ADVANCE');
                    if (exists) {
                        exists.uid = uid;
                        exists.amount += this.amount;
                    } else {
                        expenseRecord.amount = this.amount;
                        this.expenseRecords = [...this.expenseRecords, expenseRecord];
                    }
                } else {
                    const exists = this.expenseRecords.find(f => f.key === this.key && f.id == expenseRecord.id && f.expenseType == 'DAY_END_CASH');
                    if (exists) {
                        exists.uid = uid;
                        exists.amount += this.amount;
                    } else {
                        expenseRecord.amount = this.amount;
                        this.expenseRecords = [...this.expenseRecords, expenseRecord];
                    }
                }
            }
            else {
                if (this.key === "SUPPLIER") {
                    expenseRecord.id = this.supplierId;
                    expenseRecord.displayText = this.suppliers.find(f => f.value == expenseRecord.id.toString()).displayText;
                } else if (this.key === "ADDITIONAL_PARTIES") {
                    expenseRecord.id = this.partyId;
                    expenseRecord.expenseType = this.expenseType;
                    expenseRecord.displayText = this.additionalParties.find(f => f.value == expenseRecord.id.toString()).displayText;
                } else { //OTHERS
                    expenseRecord.id = this.headId;
                    expenseRecord.displayText = this.expenseHeads.find(f => f.value == expenseRecord.id.toString()).displayText;
                }

                const exists = this.expenseRecords.find(f => f.key === this.key && f.id == expenseRecord.id);
                if (exists) {
                    exists.uid = uid;
                    exists.amount += this.amount;
                } else {
                    expenseRecord.amount = this.amount;
                    this.expenseRecords = [...this.expenseRecords, expenseRecord];
                }

            }
        }
        //this.calculateCashInHand();
        this.totalIncome = this.getTotalIncome();
        this.totalExpense = this.getTotalExpense();

        this.customerId = undefined;
        this.employeeId = undefined;
        this.customerObj = undefined;
        this.employeeObj = undefined;
        this.supplierId = undefined;
        this.expenseHeadObj = undefined;
        this.headId = undefined;
        this.expenseType = undefined;
        this.amount = 0;
        if (!this.creatorDisabled) this.creatorDisabled = true;
        this.cd.detectChanges();
    }

    calculateSummary() {
        const summaryInput = {
            totalIncome: this.dailyCashTotalIncome,
            totalExpense: this.dailyCashTotalExpense,
            tempBalance: this.dailyCashTotalIncome - this.dailyCashTotalExpense,
            cashBD: this.dailyCashTotalDayEndCash,
            advanceBD: this.dailyCashTotalAdvance,
            actualBalance: this.dailyCashTotalDayEndCash + this.dailyCashTotalAdvance,
            difference: (this.dailyCashTotalDayEndCash + this.dailyCashTotalAdvance) - (this.dailyCashTotalIncome - this.dailyCashTotalExpense),
            balanceCD: this.dailyCashTotalDue,
        } as DailyCashSummaryType;
        summaryInput.actualDifference = (this.startingBalanceCD ?? 0) + (summaryInput.difference ?? 0);
        this.pupulateDailyCashSummary(summaryInput);
    }

    deleteRecord(type: string, record: any) {
        debugger;
        this.incomeRecords = this.incomeRecords.filter(f => f.key !== 'BALANCE');
        this.expenseRecords = this.expenseRecords.filter(f => f.key !== 'BALANCE');
        if (type === "INCOME") {
            record = record as IncomeAccountType;
            this.incomeRecords = this.incomeRecords.filter(f => f.uid !== record.uid);

            if (this.voucherEditMode) {
                record.uid = this.dailyCashIncomeRecords.find(f => f.key == record.key && f.id == record.id)?.uid;
            }
            const incRcd = this.dailyCashIncomeRecords.find(f => f.uid == record.uid);
            if (!incRcd) {
                const exists = this.dailyCashDayEndCashRecords.find(f => f.employeeId == record.id && this.creatorId == record.id && !f.mtmKey);
                if (exists) {
                    exists.uid = record.uid;
                    exists.amount += record.amount;
                } else {
                    if (this.creatorId == record.id) {
                        const dayEndCash = { employeeId: record.id, type: 'DAY_END_CASH', amount: record.amount, uid: uuidv4() } as DayEndCashType;
                        dayEndCash.head = `Cash in Hand (${this.employees.find(f => f.value == dayEndCash.employeeId.toString())?.displayText})`;
                        this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                    } else {
                        const sender = this.employees.find(f => f.value == record.id.toString()).displayText;
                        const mtm = this.getMtmInfo(record.id, sender, this.creatorId, this.creator);
                        const dayEndCash = { employeeId: record.id, type: 'MTM', amount: record.amount, mtmKey: mtm.key, head: mtm.displayText, uid: record.uid } as DayEndCashType;
                        this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                    }

                }
            } else {
                const diff = incRcd.amount - record.amount;
                if (diff <= 0) {
                    this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f => f.uid != incRcd.uid);
                    const dayEndCash = { employeeId: incRcd?.id, type: 'DAY_END_CASH', amount: -(diff), uid: uuidv4() } as DayEndCashType;
                    dayEndCash.head = `Cash in Hand (${this.employees.find(f => f.value == dayEndCash.employeeId.toString())?.displayText})`;
                    this.dailyCashDayEndCashRecords = [...this.dailyCashDayEndCashRecords, dayEndCash];
                } else if (diff > 0) {
                    incRcd.amount -= record.amount;
                }
            }

        }
        else {
            debugger;
            record = record as ExpenseAccountType;
            this.expenseRecords = this.expenseRecords.filter(f => f.uid !== record.uid);

            if (record.key == 'SUPPLIER' || record.key == 'OTHERS') {
                if (this.voucherEditMode) {
                    record.uid = this.dailyCashExpenseRecords.find(f => f.key == record.key && f.id == record.id)?.uid;
                }
                const expRcd = this.dailyCashExpenseRecords.find(f => f.uid == record.uid);
                expRcd.amount -= record.amount;
                if (expRcd.amount == 0) {
                    this.dailyCashExpenseRecords = this.dailyCashExpenseRecords.filter(f => f.uid != expRcd.uid);
                }
            } else if (record.key == 'INTERNAL_STUFF' || record.key == 'ADDITIONAL_PARTIES') {
                if (record.expenseType === "SALARY_ADVANCE") {
                    if (this.voucherEditMode) {
                        record.uid = this.dailyCashAdvanceRecords.find(f => f.type == record.expenseType && f.employeeId == record.id)?.uid;
                    }
                    const advRcd = this.dailyCashAdvanceRecords.find(f => f.uid == record.uid);
                    advRcd.amount -= record.amount;
                    if (advRcd.amount == 0) {
                        this.dailyCashAdvanceRecords = this.dailyCashAdvanceRecords.filter(f => f.uid != advRcd.uid);
                    }
                } else {
                    debugger;
                    if (this.voucherEditMode) {
                        record.uid = this.dailyCashDayEndCashRecords.find(f => f.type == record.expenseType && f.employeeId == record.id)?.uid;
                    }
                    const cashRcd = this.dailyCashDayEndCashRecords.find(f => f.uid == record.uid);
                    if (!cashRcd) {
                        const incomeRecord = { id: record.id, key: 'LOAN', amount: record.amount, uid: uuidv4() } as IncomeType;
                        incomeRecord.head = `Due/Loan (${this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText})`;
                        this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                    } else {
                        const diff = cashRcd.amount - record.amount;
                        if (diff <= 0) {
                            this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f => f.uid != cashRcd.uid);
                            const incomeRecord = { id: record.id, key: 'LOAN', amount: -(diff), uid: uuidv4() } as IncomeType;
                            incomeRecord.head = `Due/Loan (${this.employees.find(f => f.value == incomeRecord.id.toString())?.displayText})`;
                            this.dailyCashIncomeRecords = [...this.dailyCashIncomeRecords, incomeRecord];
                        } else if (diff > 0) {
                            cashRcd.amount -= record.amount;
                        }
                    }
                }
            }

        }
        //this.calculateCashInHand();
        this.totalIncome = this.getTotalIncome();
        this.totalExpense = this.getTotalExpense();

        this.calculateAllDailyCashTotal();
        this.calculateSummary();
    }

    onAccountTypeChanged() {
        this.keys = [];
        if (this.accountType === "INCOME") {
            this.keys.push({ value: 'CLIENT', displayText: 'Client' } as ComboboxItemDto);
            this.keys.push({ value: 'INTERNAL_STUFF', displayText: 'Internal Staff' } as ComboboxItemDto);
            this.key = 'CLIENT';
        } else {
            this.keys.push({ value: 'SUPPLIER', displayText: 'Supplier' } as ComboboxItemDto);
            this.keys.push({ value: 'INTERNAL_STUFF', displayText: 'Internal Staff' } as ComboboxItemDto);
            this.keys.push({ value: 'ADDITIONAL_PARTIES', displayText: 'Additonal Parties' } as ComboboxItemDto);
            this.keys.push({ value: 'OTHERS', displayText: 'Expense' } as ComboboxItemDto);
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
        debugger;
        let exists = this.primengTableHelper.records.find(f => f.creatorId == this.creatorId);
        if (exists) {
            abp.message.info('This creator is already added to the list. Please merge instead of duplicating', 'Sorry!');
            return;
        }
        exists = this.primengTableHelper.records.find(f => f.voucherNo === this.voucherNo);

        if (exists) {
            abp.message.info('This voucher number is already added to the list. Please choose the unique one.', 'Sorry!');
            return;
        }

        const voucher = {
            voucherNo: this.voucherNo,
            creatorId: this.creatorId,
            creator: this.creator,
            carNumber: this.carNumber,
            totalAmount: this.getTotalIncome(),
            remarks: "",
            incomeRecords: this.incomeRecords,
            expenseRecords: this.expenseRecords,
            dayEndCash: this.cashInHand,
            uid: uuidv4()
        } as VoucherType;
        this.primengTableHelper.records.push(voucher);
        this.primengTableHelper.totalRecordsCount = this.primengTableHelper.records.length;
        this.voucherNo = "";
        this.creatorId = undefined;
        this.creator = "";
        this.creatorObj = undefined;
        this.creatorDisabled = false;
        this.carNumber = "";
        this.incomeRecords = [];
        this.expenseRecords = [];
        this.totalIncome = 0;
        this.totalExpense = 0;
        this.accountType = "INCOME";
        this.onAccountTypeChanged();
        this.saved = false;
        this.disabled = false;
        this.sortVouchers();
        this.listPending = false;
        this.cd.detectChanges();
    }

    updateList() {
        this.primengTableHelper.records = this.primengTableHelper.records.filter(f => f.uid != this.voucherUid);
        this.addToList();
        this.voucherUid = undefined;
        this.voucherEditMode = false;
        this.cd.detectChanges();
    }

    editVoucher(record: VoucherType) {
        this.voucherEditMode = true;
        this.voucherNo = record.voucherNo;
        this.creatorId = record.creatorId;
        this.creator = record.creator;
        this.creatorObj = {
            displayText: this.creator,
            isSelected: false,
            value: this.creatorId?.toString()
        }
        this.carNumber = record.carNumber;
        this.incomeRecords = record.incomeRecords;
        this.expenseRecords = record.expenseRecords;
        this.voucherUid = record.uid;
        this.totalIncome = this.getTotalIncome();
        this.totalExpense = this.getTotalExpense();
        this.cashInHand = record.dayEndCash;
        this.cd.detectChanges();
    }

    clearVoucher() {
        this.voucherUid = undefined;
        this.voucherEditMode = false;

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

    // processDailyCash() {
    //     const vouchers: DailyCashType[] = [];
    //     debugger;
    //     this.primengTableHelper.records.forEach(item => {
    //         debugger;
    //         item.incomeRecords.forEach(income => {
    //             debugger;
    //             const exists = vouchers.find(f => f.type === "INCOME" && f.incomeKey === income.key && f.incomeId === income.id);
    //             if (exists) exists.incomeAmount += income.amount;
    //             else {
    //                 vouchers.push({ type: "INCOME", incomeKey: income.key, incomeId: income.id, incomeHead: income.displayText, incomeAmount: income.amount, uid: uuidv4() } as DailyCashType);
    //             }
    //         });

    //         item.expenseRecords.forEach(expense => {
    //             debugger;
    //             const exists = vouchers.find(f => f.type === "EXPENSE" && f.expenseKey === expense.key && f.expenseId === expense.id);
    //             if (exists) exists.expenseAmount += expense.amount;
    //             else {
    //                 vouchers.push({ type: "EXPENSE", expenseKey: expense.key, expenseId: expense.id, expenseHead: expense.displayText, expenseAmount: expense.amount, uid: uuidv4() } as DailyCashType);
    //             }
    //         });
    //     });
    //     this._dataSharingService.setVouchers(vouchers);
    //     this._router.navigateByUrl("app/daily-cash/reconciliation");
    // }
    processDailyCash() {
        const vouchers: DailyCashType[] = [];
        //debugger;
        this.primengTableHelper.records.forEach(item => {

            //const stuffUniqeIds: number[] = [...new Set(item.map(m => m.creatorId))];

            const exists = vouchers.find(f => f.type === "DAYEND" && f.expenseKey === "BALANCE" && f.expenseId == item.creatorId);
            if (exists) {
                exists.expenseAmount += item.dayEndCash;
            } else {
                vouchers.push({ type: "DAYEND", expenseKey: "BALANCE", expenseId: item.creatorId, expenseHead: item.creator, expenseAmount: item.dayEndCash, uid: uuidv4() } as DailyCashType);
            }



            // if(item.dayEndCash > 0) {
            //     const exists = vouchers.find(f => f.type === "INCOME" && f.incomeKey === income.key && f.incomeId === income.id);

            //     vouchers.push({ type: "INCOME", incomeKey: "BALANCE", incomeId: item.creatorId, incomeHead: item.creator, incomeAmount: item.dayEndCash, uid: uuidv4() } as DailyCashType);
            // } else if (item.dayEndCash < 0) {
            //     vouchers.push({ type: "EXPENSE", expenseKey: "BALANCE", expenseId: item.creatorId, expenseHead: item.creator, expenseAmount: item.dayEndCash, uid: uuidv4() } as DailyCashType);
            // }

            //debugger;
            item.incomeRecords.forEach(income => {
                //debugger;
                const exists = vouchers.find(f => f.type === "INCOME" && f.incomeKey === income.key && f.incomeId == income.id);
                if (exists) exists.incomeAmount += income.amount;
                else {
                    vouchers.push({ type: "INCOME", incomeKey: income.key, incomeId: income.id, incomeHead: income.displayText, incomeAmount: income.amount, uid: uuidv4() } as DailyCashType);
                }
            });

            item.expenseRecords.filter(x => x.expenseType !== 'SALARY_ADVANCE').forEach(expense => {
                //debugger;
                //&& f.expenseType !== 'SALARY_ADVANCE'
                const exists = vouchers.find(f => f.type === "EXPENSE" && f.expenseKey === expense.key && f.expenseId == expense.id && f.expenseType !== 'SALARY_ADVANCE');

                if (exists) {
                    exists.expenseAmount += expense.amount;
                }
                else {
                    vouchers.push({ type: "EXPENSE", expenseKey: expense.key, expenseType: expense.expenseType, expenseId: expense.id, expenseHead: expense.displayText, expenseAmount: expense.amount, uid: uuidv4() } as DailyCashType);
                }

            });

            item.expenseRecords.filter(x => x.expenseType === 'SALARY_ADVANCE').forEach(expense => {
                //debugger;
                //&& f.expenseType !== 'SALARY_ADVANCE'
                const exists = vouchers.find(f => f.type === "EXPENSE" && f.expenseKey === expense.key && f.expenseId == expense.id && f.expenseType === 'SALARY_ADVANCE');

                if (exists) {
                    exists.expenseAmount += expense.amount;
                }
                else {
                    vouchers.push({ type: "EXPENSE", expenseKey: expense.key, expenseType: expense.expenseType, expenseId: expense.id, expenseHead: expense.displayText, expenseAmount: expense.amount, uid: uuidv4() } as DailyCashType);
                }

            });
        });
        debugger;
        this._dataSharingService.setVoucherDate(this.date);
        this._dataSharingService.setVouchers(vouchers);
        this._router.navigateByUrl("app/daily-cash/reconciliation");
    }

    saveVouchers() {

    }

    // deleteVouchers() {
    //     abp.message.confirm(`These vouchers will be deleted`,
    //         'Are you sure?',
    //         (result: boolean) => {
    //             if (result) {
    //                 this._dailyCashService.vouchersRemove(moment(this.date)).subscribe(() => {
    //                     this.primengTableHelper.records = [];
    //                     this.primengTableHelper.totalRecordsCount = 0;
    //                     this.cd.detectChanges();
    //                     this.notify.warn(this.l('SuccessfullyDeleted'));
    //                 })
    //             }
    //         }
    //     );
    // }

    sortVouchers() {
        this.primengTableHelper.records.sort((a, b) => a.voucherNo.localeCompare(b.voucherNo));
    }

    saveDailyCash() {

    }

    finalize() {
        this.listPending = true;
        this.dailyCashDayEndCashRecords = Object.values(this.dailyCashDayEndCashRecords.reduce((acc, curr) => {
            const employeeName = this.employees.find(f => f.value == curr.employeeId.toString())?.displayText;
            curr.amount = (acc[curr.employeeId]?.amount ?? 0) + curr.amount;
            curr.head = `Cash in Hand (${employeeName})`;
            acc[curr.employeeId] = { ...acc[curr.employeeId], ...curr };
            return acc;
        }, {}));

        // this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f=> f.mtmKey != '12F15' && f.mtmKey != '13F12');
        // const a  = this.dailyCashDayEndCashRecords.find(f=> f.amount == 53433);
        // a.amount = 34433;

        // this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f=> f.amount != 1300);
        // this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f=> f.amount != 65);
        // this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f=> f.amount != 1300);
        // const b  = this.dailyCashDayEndCashRecords.find(f=> f.amount == 780);
        // b.amount = 715;

        this.dailyCashIncomeRecords = this.dailyCashIncomeRecords.filter(f => f.amount > 0);
        this.dailyCashAdvanceRecords = this.dailyCashAdvanceRecords.filter(f => f.amount > 0);
        this.dailyCashExpenseRecords = this.dailyCashExpenseRecords.filter(f => f.amount > 0);
        this.dailyCashDayEndCashRecords = this.dailyCashDayEndCashRecords.filter(f => f.amount > 0);

        this.calculateAllDailyCashTotal();
        this.listPending = false;
        this.completed = true;
        this.cd.detectChanges();

        //12F15 53,433
        //13F12
    }

    saveAll() {
        this.busy = true;
        const dayEndIncomes = this.dailyCashIncomeRecords.filter(f => f.amount !== 0).map(i => ({
            incomeId: i.id,
            key: i.key,
            head: i.head,
            amount: i.amount,
            mtmKey: i.mtmKey,
            uid: i.uid
        })) as DailyCashIncomeDetailDto[];

        const dayEndExpenses = this.dailyCashExpenseRecords.filter(f => f.amount !== 0).map(i => ({
            expenseId: i.id,
            key: i.key,
            head: i.head,
            amount: i.amount,
            uid: i.uid
        })) as DailyCashExpenseDetailDto[];

        const dayEndAdvanes = this.dailyCashAdvanceRecords.filter(f => f.amount !== 0).map(i => ({
            employeeId: i.employeeId,
            type: i.type,
            head: i.head,
            amount: i.amount,
            uid: i.uid
        })) as DailyCashAdvanceDetailDto[];

        const dayEndCashes = this.dailyCashDayEndCashRecords.filter(f => f.amount !== 0).map(i => ({
            employeeId: i.employeeId,
            type: i.type,
            head: i.head,
            amount: i.amount,
            mtmKey: i.mtmKey,
            uid: i.uid
        })) as DailyCashDayEndDetailDto[];

        const summary = this.dailyCashRecordsSummary[0];
        const dailyCashInput = {
            dailyCash: {
                id: this.dailyCashId,
                date: moment(this.date),
                totalIncome: this.dailyCashTotalIncome,
                totalExpense: this.dailyCashTotalExpense,
                totalAdvance: this.dailyCashTotalAdvance,
                totalDayEndCash: this.dailyCashTotalDayEndCash,
                paperBalance: summary.tempBalance,
                actualBalance: summary.actualBalance,
                difference: summary.difference,
                totalDue: summary.totalDue,
                balanceCD: this.startingBalanceCD,
                actualDifference: summary.actualDifference,
                completed: this.completed
            } as DailyCashEntryDto,
            incomes: dayEndIncomes,
            expenses: dayEndExpenses,
            advances: dayEndAdvanes,
            dayEndCashes: dayEndCashes
        } as CreateOrUpdateDailyCashInput;



        const vouchersInput: VoucherEntryDto[] = [];
        this.primengTableHelper.records.forEach(item => {
            const voucher = {
                date: moment(this.date),
                voucherNumber: item.voucherNo,
                creatorId: item.creatorId,
                carNumber: item.carNumber,
                totalAmount: item.totalAmount,
                incomeRecords: JSON.stringify(item.incomeRecords),
                expenseRecords: JSON.stringify(item.expenseRecords),
                dayEndCash: item.dayEndCash
            } as VoucherEntryDto;
            vouchersInput.push(voucher);
        });

        // this._dailyCashService.createOrUpdateVoucher(moment(this.date), input).subscribe(res => {
        //     this.editMode = true;
        //     this.saved = true;
        //     this.busy = false;
        //     this.cd.detectChanges();
        //     this.notify.success("Vouchers Successfully Saved");
        // })

        this._dailyCashService.createOrUpdateVouchersAndDailyCash({ date: moment(this.date), vouchers: vouchersInput, dailyCash: dailyCashInput } as VouchersAndDailyCashCreateUpdateDto).subscribe(res => {
            this.dailyCashId = res;
            this.listPending = true;
            this.busy = false;
            this.cd.detectChanges();
            this.notify.success("Successfully Saved");
            //this._router.navigateByUrl("app/daily-cash");
        });
    }
}