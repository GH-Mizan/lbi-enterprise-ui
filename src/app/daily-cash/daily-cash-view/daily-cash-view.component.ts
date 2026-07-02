import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotifyService } from 'abp-ng2-module';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { DailyCashServiceProxy } from '@shared/service-proxies/service-proxies';
import moment from 'moment';
import { AdvanceType, DayEndCashType, ExpenseType, IncomeType, RecordsSummary } from '../reconciliation/daily-cash-reconciliation.component';
import { DailyCashSummaryType } from '../voucher-entry/voucher-entry.component';

@Component({
    selector: 'app-daily-cash-view',
    standalone: false,
    templateUrl: './daily-cash-view.component.html',
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

export class DailyCashViewComponent implements OnInit {
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
    startingBalanceCD: number | undefined;
    
    date: any;

    constructor(
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _dailyCashService: DailyCashServiceProxy,
        private cd: ChangeDetectorRef
    ) {


    }

    ngOnInit(): void {
        const id = this._activatedRoute.snapshot.params['id'];
        this._dailyCashService.get(id).subscribe((res) => {
            this.date = res.dailyCash.date;
            res.incomes.forEach(x => {
                this.dailyCashIncomeRecords.push({ key: x.key, id: x.incomeId, head: x.head, amount: x.amount, mtmKey: x.mtmKey, uid: x.uid } as IncomeType);
            });
            res.expenses.forEach(x => {
                this.dailyCashExpenseRecords.push({ key: x.key, id: x.expenseId, head: x.head, amount: x.amount, uid: x.uid } as ExpenseType);
            });

            res.advances.forEach(x => {
                this.dailyCashAdvanceRecords.push({ type: x.type, employeeId: x.employeeId, head: x.head, amount: x.amount, uid: x.uid } as AdvanceType);
            });

            res.dayEndCashes.forEach(x => {
                this.dailyCashDayEndCashRecords.push({ type: x.type, employeeId: x.employeeId, head: x.head, amount: x.amount, mtmKey: x.mtmKey, uid: x.uid } as DayEndCashType);
            });

            this.calculateAllDailyCashTotal();
            this.startingBalanceCD = res.dailyCash.balanceCD;
            const summaryInput = {
                totalIncome: res.dailyCash.totalIncome,
                totalExpense: res.dailyCash.totalExpense,
                tempBalance: res.dailyCash.paperBalance,
                cashBD: res.dailyCash.totalDayEndCash,
                advanceBD: res.dailyCash.totalAdvance,
                actualBalance: res.dailyCash.actualBalance,
                difference: res.dailyCash.difference,
                totalDue: res.dailyCash.totalDue,
                balanceCD: res.dailyCash.balanceCD,
                actualDifference: res.dailyCash.actualDifference
            } as DailyCashSummaryType;
            this.pupulateDailyCashSummary(summaryInput);

            this.cd.detectChanges();
        })
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

    pupulateDailyCashSummary(summary: DailyCashSummaryType) {
        this.dailyCashRecordsSummary = [];
        this.dailyCashRecordsSummary.push(summary);
    }
}

