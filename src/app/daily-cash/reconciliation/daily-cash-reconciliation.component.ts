import { ChangeDetectorRef, Component, Injector, OnInit } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { DataSharingService } from "@shared/services/data-sharing.service";
import { DailyCashType } from "../voucher-entry/voucher-entry.component";
import { CreateOrUpdateDailyCashInput, DailyCashAdvanceDetailDto, DailyCashDayEndDetailDto, DailyCashEntryDto, DailyCashExpenseDetailDto, DailyCashIncomeDetailDto, DailyCashServiceProxy, SalaryServiceProxy } from "@shared/service-proxies/service-proxies";
import { firstValueFrom } from "rxjs";
import moment from "moment";
import { AppComponentBase } from "@shared/app-component-base";
import { Router } from '@angular/router';

export type IncomeType = {
    key: string,
    id: number,
    head: string | undefined,
    amount: number,
    mtmKey: string | undefined,
    uid: string | undefined
}

export type ExpenseType = {
    key: string,
    id: number,
    head: string | undefined,
    amount: number,
    uid: string | undefined
}

export type AdvanceType = {
    //key: string | undefined;
    employeeId: number;
    head: string | undefined,
    type: string,
    amount: number,
    uid: string | undefined
}

export type DayEndCashType = {
    employeeId: number,
    type: string,
    head: string | undefined,
    amount: number,
    mtmKey: string | undefined,
    uid: string | undefined
}

export type ManToManAccountType = {
    type: string,
    id: number,
    name: string,
    amount: number
}

export type RecordsSummary = {
    head: string,
    type: string,
    amount: number | undefined
}

@Component({
    selector: 'daily-cash-reconciliation',
    templateUrl: './daily-cash-reconciliation.component.html',
    standalone: false,
    animations: [appModuleAnimation()],
    styles: [
        `
            .green {
                background: #38f348
            }

            .red {
                background: #f34d4d
            }
        `
    ]
})

export class DailyCashReconciliationComponent extends AppComponentBase implements OnInit {
    date = new Date();
    incomeRecords: IncomeType[] = [];
    expenseRecords: ExpenseType[] = [];
    advanceRecords: AdvanceType[] = [];
    dayEndCashRecords: DayEndCashType[] = [];
    recordsSummary: RecordsSummary[] = [];
    totalIncome: number = 0;
    totalExpense: number = 0;
    totalAdvance: number = 0;
    balanceBDAdvance: number = 0;
    totalDayEndCash: number = 0;
    difference: number;
    vouchers: DailyCashType[] = [];

    constructor(
        injector: Injector,
        private _dataSharingService: DataSharingService,
        private _salaryService: SalaryServiceProxy,
        private _dailyCashService: DailyCashServiceProxy,
        private _router: Router,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    async ngOnInit() {

        // const advanceInfo = await firstValueFrom(this._salaryService.getSalaryAdvanceList());
        // const dayStartBalance = await firstValueFrom(this._dailyCashService.getPreviousDailyCash(moment(this.date)));
        

        // this.incomeRecords.push({ key: "Client", id: -2, head: "Balance B/D (Cash)", amount: dayStartBalance.totalDayEndCash } as IncomeType);
        // this.incomeRecords.push({ key: "Client", id: -1, head: "Balance B/D (Advance)", amount: dayStartBalance.totalAdvance } as IncomeType);

        // const advanceRecords = advanceInfo.advances.filter(f => f.advance > 0);
        // debugger;
        // if (advanceRecords.length > 0) {
        //     advanceRecords.forEach(r => {
        //         this.advanceRecords.push({ employeeId: r.employeeId, head: r.employeeName, type: 'INTERNAL_STUFF', amount: r.advance } as AdvanceType);
        //     })
        // }

        // const partiesAdvance = advanceInfo.additionalParitesAdvances.filter(f => f.advance > 0);
        // if (partiesAdvance.length > 0) {
        //     partiesAdvance.forEach(r => {
        //         this.advanceRecords.push({ employeeId: r.id, head: r.partyName, type: 'ADDITIONAL_PARTIES', amount: r.advance } as AdvanceType);
        //     })
        // }

        // // this.totalAdvance = this.advanceRecords.reduce((accumulator, currentItem) => {
        // //     return accumulator + currentItem.amount;
        // // }, 0);

        // this.balanceBDAdvance = advanceInfo.totalAdvance + advanceInfo.totalAdditionalPartiesAdvance;
        // this.cd.detectChanges();

        // this._dataSharingService.voucherDate$.subscribe(res=> {
        //     this.date = res;
        //     this.cd.detectChanges();
        // });

        // this._dataSharingService.currentVouchers$.subscribe(res => {
        //     this.vouchers = res;
        //     //const manToManAccounts: ManToManAccountType[] = [];
        //     res.forEach(item => {
        //         if (item.type === "INCOME" && item.incomeKey === "CLIENT") {
        //             const exists = this.incomeRecords.find(f => f.key === "Client" && f.id == item.incomeId);
        //             if (exists) exists.amount += item.incomeAmount;
        //             else this.incomeRecords.push({ key: "Client", id: item.incomeId, head: item.incomeHead, amount: item.incomeAmount } as IncomeType);
        //         } else if (item.type === "EXPENSE" && item.expenseKey !== "INTERNAL_STUFF" && item.expenseKey !== "BALANCE" && item.expenseKey !== "ADDITIONAL_PARTIES") {
        //             const exists = this.expenseRecords.find(f => f.key === item.expenseKey && f.id == item.expenseId);
        //             if (exists) exists.amount += item.expenseAmount;
        //             else this.expenseRecords.push({ key: item.expenseKey, id: item.expenseId, head: item.expenseHead, amount: item.expenseAmount } as ExpenseType);
        //         }

        //         if (item.type === "DAYEND" && item.expenseKey === "BALANCE") {
        //             if (item.expenseAmount > 0) {
        //                 this.dayEndCashRecords.push({ employeeId: item.expenseId, type: 'MAN_TO_MAN', head: `Cash In Hand (${item.expenseHead})`, amount: item.expenseAmount } as DayEndCashType);
        //             } else if (item.expenseAmount < 0) {
        //                 this.incomeRecords.push({ key: "BALANCE", id: item.expenseId, type: 'MAN_TO_MAN', head: `Due/Loan (${item.expenseHead})`, amount: -(item.expenseAmount) } as IncomeType);
        //             }
        //         }

        //         if (item.type === "EXPENSE" && item.expenseType === "DAY_END_CASH") {
        //             const exists = this.dayEndCashRecords.find(f => f.employeeId === item.expenseId);
        //             if (exists) {
        //                 exists.amount += item.expenseAmount;
        //             } else {
        //                 this.dayEndCashRecords.push({ employeeId: item.expenseId, head: item.expenseHead, type: 'DAY_END_CASH', amount: item.expenseAmount } as DayEndCashType);
        //             }
        //         }

        //         if (item.type === "EXPENSE" && item.expenseType === "SALARY_ADVANCE" && (item.expenseKey === "INTERNAL_STUFF" || item.expenseKey === "ADDITIONAL_PARTIES")) {
        //             debugger;
        //             if (item.expenseKey === "INTERNAL_STUFF") {
        //                 const exists = this.advanceRecords.find(f => f.type === "INTERNAL_STUFF" && f.employeeId == item.expenseId);
        //                 if (exists) {
        //                     exists.amount += item.expenseAmount;
        //                 } else {
        //                     this.advanceRecords.push({ employeeId: item.expenseId, head: item.expenseHead, type: 'INTERNAL_STUFF', amount: item.expenseAmount } as AdvanceType);
        //                 }
        //             } else {
        //                 const exists = this.advanceRecords.find(f => f.type === "ADDITIONAL_PARTIES" && f.employeeId == item.expenseId);
        //                 if (exists) {
        //                     exists.amount += item.expenseAmount;
        //                 } else {
        //                     this.advanceRecords.push({ employeeId: item.expenseId, head: item.expenseHead, type: 'ADDITIONAL_PARTIES', amount: item.expenseAmount } as AdvanceType);
        //                 }
        //             }
        //         }

        //         // if ((item.type === "INCOME" || item.type === "EXPENSE") && (item.incomeKey === "INTERNAL_STUFF" || item.expenseKey === "INTERNAL_STUFF")) {
        //         //     debugger;
        //         //     const mtm = { type: item.type } as ManToManAccountType;
        //         //     if (item.type === "INCOME") {
        //         //         mtm.id = item.incomeId;
        //         //         mtm.name = item.incomeHead;
        //         //         mtm.amount = item.incomeAmount;
        //         //     } else {
        //         //         mtm.id = item.expenseId;
        //         //         mtm.name = item.expenseHead;
        //         //         mtm.amount = item.expenseAmount;
        //         //     }
        //         //     manToManAccounts.push(mtm);
        //         // }
        //     })

        //     // bdc: Balance B/D (Cash) -2
        //     // bda: Balance B/D (Advance)-1

        //     //
        //     //this.incomeRecords.unshift({ key: "Client", id: -2, head: "Balance B/D (Cash)", amount: 152961 } as IncomeType);

        //     //this.dayEndCashRecords.push({ employeeId: 15, head: 'Cash In Hand (Mubarak)', type: 'DAY_END_CASH', amount: 480 } as DayEndCashType);

        //     //this.dayEndCashRecords.find(f => f.employeeId == 40).amount = 853;
        //     //this.dayEndCashRecords.find(f => f.employeeId == 5).amount = 20581;
        //     //this.dayEndCashRecords.find(f => f.employeeId == 19).amount = 9029;

        //     // const stuffUniqeIds: number[] = [...new Set(manToManAccounts.map(m => m.id))];
        //     // stuffUniqeIds.forEach(id => {
        //     //     const incomeTotal = (manToManAccounts.filter(f => f.type === "INCOME" && f.id == id).reduce((accumulator, item) => {
        //     //         accumulator.amount += item.amount;
        //     //         return accumulator;
        //     //     }, { amount: 0 })).amount;
        //     //     const expenseTotal = (manToManAccounts.filter(f => f.type === "EXPENSE" && f.id == id).reduce((accumulator, item) => {
        //     //         accumulator.amount += item.amount;
        //     //         return accumulator;
        //     //     }, { amount: 0 })).amount;

        //     //     if (incomeTotal > expenseTotal) {
        //     //         const incomeRecord = {
        //     //             key: "INTERNAL_STUFF",
        //     //             id: id,
        //     //             head: manToManAccounts.find(f => f.type === "INCOME" && f.id == id).name,
        //     //             amount: incomeTotal - expenseTotal
        //     //         } as IncomeType;
        //     //         this.incomeRecords.push(incomeRecord);
        //     //     } else if (expenseTotal > incomeTotal) {
        //     //         const expenseRecord = {
        //     //             key: "INTERNAL_STUFF",
        //     //             id: id,
        //     //             head: manToManAccounts.find(f => f.type === "EXPENSE" && f.id == id).name,
        //     //             amount: expenseTotal - incomeTotal
        //     //         } as ExpenseType;
        //     //         this.expenseRecords.push(expenseRecord);
        //     //     }
        //     // })
        //     // this.totalIncome = this.incomeRecords.reduce((accumulator, currentItem) => {
        //     //     return accumulator + currentItem.amount;
        //     // }, 0);
        //     this.totalExpense = this.expenseRecords.reduce((accumulator, currentItem) => {
        //         return accumulator + currentItem.amount;
        //     }, 0);
        //     // this.totalAdvance = this.advanceRecords.reduce((accumulator, currentItem) => {
        //     //     return accumulator + currentItem.amount;
        //     // }, 0);
        //     this.totalAdvance = this.advanceRecords.reduce((accumulator, currentItem) => {
        //         return accumulator + currentItem.amount;
        //     }, 0);
        //     //this.incomeRecords.unshift({ key: "Client", id: -1, head: "Balance B/D (Advance)", amount: this.balanceBDAdvance } as IncomeType);
        //     this.totalIncome = this.incomeRecords.reduce((accumulator, currentItem) => {
        //         return accumulator + currentItem.amount;
        //     }, 0);
        //     this.totalDayEndCash = this.dayEndCashRecords.reduce((accumulator, currentItem) => {
        //         return accumulator + currentItem.amount;
        //     }, 0);


        //     this.recordsSummary.push({ head: 'Total Income', type: "", amount: this.totalIncome });
        //     this.recordsSummary.push({ head: 'Total Expense', type: "", amount: this.totalExpense });
        //     this.recordsSummary.push({ head: 'Temp Balance', type: "", amount: this.totalIncome - this.totalExpense });

        //     this.recordsSummary.push({ head: '', type: "", amount: undefined });
        //     this.recordsSummary.push({ head: '', type: "", amount: undefined });

        //     this.recordsSummary.push({ head: 'Cash (B/D)', type: "", amount: this.totalDayEndCash });
        //     this.recordsSummary.push({ head: 'Advance (B/D)', type: "", amount: this.totalAdvance });
        //     this.recordsSummary.push({ head: 'Actual Balance', type: "", amount: this.totalDayEndCash + this.totalAdvance });

        //     this.recordsSummary.push({ head: '', type: "", amount: undefined });
        //     this.difference = (this.totalDayEndCash + this.totalAdvance) - (this.totalIncome - this.totalExpense);
        //     this.recordsSummary.push({ head: 'Difference', type: "DIFFERENCE", amount: this.difference });

        //     this.cd.detectChanges();
        // });

    }

    save() {
        const dayEndIncomes = this.incomeRecords.map(i => ({
            incomeId: i.id,
            key: i.key,
            head: i.head,
            amount: i.amount
        })) as DailyCashIncomeDetailDto[];

        const dayEndExpenses = this.expenseRecords.map(i => ({
            expenseId: i.id,
            key: i.key,
            head: i.head,
            amount: i.amount
        })) as DailyCashExpenseDetailDto[];

        const dayEndAdvanes = this.advanceRecords.map(i => ({
            employeeId: i.employeeId,
            type: i.type,
            head: i.head,
            amount: i.amount
        })) as DailyCashAdvanceDetailDto[];

        const dayEndCashes = this.dayEndCashRecords.map(i => ({
            employeeId: i.employeeId,
            type: i.type,
            head: i.head,
            amount: i.amount
        })) as DailyCashDayEndDetailDto[];

        const input = {
            dailyCash: {
                date: moment(this.date),
                totalIncome: this.totalIncome,
                totalExpense: this.totalExpense,
                totalAdvance: this.totalAdvance,
                totalDayEndCash: this.totalDayEndCash,
                paperBalance: this.totalIncome - this.totalExpense,
                actualBalance: this.totalDayEndCash + this.totalAdvance,
                difference: this.difference
            } as DailyCashEntryDto,
            incomes: dayEndIncomes,
            expenses: dayEndExpenses,
            advances: dayEndAdvanes,
            dayEndCashes: dayEndCashes
        } as CreateOrUpdateDailyCashInput;

        this._dailyCashService.createOrUpdateDailyCash(input).subscribe(res=> {
            this.notify.success("Successfully saved");
            this._router.navigateByUrl("app/daily-cash");
        });
    }

}