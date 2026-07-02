import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotifyService } from 'abp-ng2-module';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CreateOrUpdateDailyCashInput, DailyCashEntryDto, DailyCashServiceProxy } from '@shared/service-proxies/service-proxies';
import moment from 'moment';

export type DailyCashType = {
    actualIncomeHead: string,
    actualIncomeAmount: number,
    actualIncomeAmountShow: number,
    actualIncomeEditMode: boolean,
    virtualIncomeHead: string,
    virtualIncomeAmount: number,
    virtualIncomeAmountShow: number,
    virtualIncomeEditMode: boolean,
    advanceHead: string,
    advanceAmount: number,
    advanceAmountShow: number,
    advanceEditMode: boolean,
    dayEndCashHead: string,
    dayEndCashAmount: number,
    dayEndCashAmountShow: number,
    dayEndCashEditMode: boolean,
    expenseHead: string,
    expenseAmount: number,
    expenseAmountShow: number,
    expenseEditMode: boolean
}

export type DailyCashSummaryType = {
    actualIncomeHead: string,
    actualIncomeAmount: number,
    virtualIncomeHead: string,
    virtualIncomeAmount: number,
    advanceHead: string,
    advanceAmount: number,
    dayEndCashHead: string,
    dayEndCashAmount: number,
    expenseHead: string,
    expenseAmount: number
}

@Component({
    selector: 'app-daily-cash-entry',
    standalone: false,
    templateUrl: './daily-cash-entry.component.html',
    styleUrl: './daily-cash-entry.component.css',
    animations: [appModuleAnimation()],
})

export class DailyCashEntryComponent implements OnInit {

    dailyCashAccounts: DailyCashType[] = [];
    totalActualIncome: number = 0;
    totalVirtualTransaction: number = 0;
    totalExpense: number = 0;
    cashBalance: number = 0;
    advanceBalance: number = 0;
    difference: number = 0;

    cashEntryStartDate = new Date(2025, 7, 8);
    //initialDate = new Date(2025, 7, 8);
    date = new Date(2025, 7, 8);
    id?: number;

    isLoading: boolean = true;
    editMode = false;
    saving: boolean = false;

    constructor(
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _dailyCashService: DailyCashServiceProxy,
        private readonly _notifyService: NotifyService,
        private readonly cd: ChangeDetectorRef
    ) {


    }

    ngOnInit(): void {
        this.id = this._activatedRoute.snapshot.params['id'];
        if (!this.id) {
            this._dailyCashService.getLastEntryDate().subscribe(res => {
                if (res) {
                    this.date = res.toDate();
                    this.date.setDate(this.date.getDate() + 1);
                }
                this.loadDataByDate();
            });

        }
        else {
            this.editMode = true;
            this.loadDataById();
        }
    }

    amountChanged(head: string, headShow: string, editField: string, a: DailyCashType) {
        a[headShow] = a[head];
        a[editField] = false;

        this.calculateBalance();
    }

    save() {
        this.createOrUpdate();
    }

    update() {
        this.createOrUpdate(this.id);
    }

    loadDataById() {
        // this._dailyCashService.get(this.id).subscribe(res => {
        //     this.populateExpectedData(res.dailyCashInfo.metadata);
        //     this.isLoading = false;
        //     this.calculateBalance();
        //     this.cd.detectChanges();
        // });
    }

    loadDataByDate() {
        this.dailyCashAccounts = [];
        this._dailyCashService.getByDate(moment(this.date)).subscribe(res => {
            // if (res.prevCashInfo && !res.dailyCashInfo) {
            //     const data = JSON.parse(res.prevCashInfo.metadata) as DailyCashSummaryType[];
            //     data.forEach(x => {
            //         this.dailyCashAccounts.push({
            //             //actualIncomeHead: x.actualIncomeHead, 
            //             //actualIncomeAmount: x.actualIncomeAmount,
            //             //actualIncomeAmountShow: x.actualIncomeAmount,
            //             //virtualIncomeHead: x.virtualIncomeHead,
            //             //virtualIncomeAmount: x.virtualIncomeAmount,
            //             //virtualIncomeAmountShow: x.virtualIncomeAmount,
            //             advanceHead: x.advanceHead,
            //             advanceAmount: x.advanceAmount,
            //             advanceAmountShow: x.advanceAmount,
            //             dayEndCashHead: x.dayEndCashHead,
            //             dayEndCashAmount: x.dayEndCashAmount,
            //             dayEndCashAmountShow: x.dayEndCashAmount,
            //             //expenseHead: x.expenseHead,
            //             //expenseAmount: x.expenseAmount,
            //             //expenseAmountShow: x.expenseAmount
            //         } as DailyCashType);
            //     });
            //     this.dailyCashAccounts[0].actualIncomeHead = "Balance B/D (Cash)";
            //     this.dailyCashAccounts[0].actualIncomeAmount = this.dailyCashAccounts[0].actualIncomeAmountShow = res.prevCashInfo.dayEndCashBalance;

            //     this.dailyCashAccounts[1].actualIncomeHead = "Balance B/D (Advance)";
            //     this.dailyCashAccounts[1].actualIncomeAmount = this.dailyCashAccounts[1].actualIncomeAmountShow = res.prevCashInfo.dayEndAdvanceBalance;
            // } else if (!res.prevCashInfo && res.dailyCashInfo) {
            //     this.populateExpectedData(res.dailyCashInfo.metadata);
            //     this.id = res.dailyCashInfo.id;
            // } else if (!res.prevCashInfo && !res.dailyCashInfo) {
            //     for (let i = 0; i < 20; i++) {
            //         //this.dailyCashAccounts = [...this.dailyCashAccounts, {actualIncomeAmount: 400, actualIncomeAmountShow: 400} as DailyCashType];
            //         this.dailyCashAccounts.push({} as DailyCashType);
            //     }
            // }
            // this.isLoading = false;
            // this.calculateBalance();
            // this.cd.detectChanges();
        })
    }

    populateExpectedData(metadata: string) {
        const data = JSON.parse(metadata) as DailyCashSummaryType[];
        data.forEach(x => {
            this.dailyCashAccounts.push({
                actualIncomeHead: x.actualIncomeHead,
                actualIncomeAmount: x.actualIncomeAmount,
                actualIncomeAmountShow: x.actualIncomeAmount,
                virtualIncomeHead: x.virtualIncomeHead,
                virtualIncomeAmount: x.virtualIncomeAmount,
                virtualIncomeAmountShow: x.virtualIncomeAmount,
                advanceHead: x.advanceHead,
                advanceAmount: x.advanceAmount,
                advanceAmountShow: x.advanceAmount,
                dayEndCashHead: x.dayEndCashHead,
                dayEndCashAmount: x.dayEndCashAmount,
                dayEndCashAmountShow: x.dayEndCashAmount,
                expenseHead: x.expenseHead,
                expenseAmount: x.expenseAmount,
                expenseAmountShow: x.expenseAmount
            } as DailyCashType);
        });

    }

    onDateChanged() {
        this.loadDataByDate();
    }

    createOrUpdate(id?: number) {
        this.saving = true;
        const data: DailyCashSummaryType[] = [];
        this.dailyCashAccounts.forEach(x => {
            data.push({
                actualIncomeHead: x.actualIncomeHead,
                actualIncomeAmount: x.actualIncomeAmount,
                virtualIncomeHead: x.virtualIncomeHead,
                virtualIncomeAmount: x.virtualIncomeAmount,
                advanceHead: x.advanceHead,
                advanceAmount: x.advanceAmount,
                dayEndCashHead: x.dayEndCashHead,
                dayEndCashAmount: x.dayEndCashAmount,
                expenseHead: x.expenseHead,
                expenseAmount: x.expenseAmount
            } as DailyCashSummaryType)
        });
        // const input = {
        //     id: id,
        //     date: moment(this.date),
        //     totalActualIncome: this.totalActualIncome,
        //     totalVirtualTransaction: this.totalVirtualTransaction,
        //     totalExpense: this.totalExpense,
        //     //dayStartCashBalance: this.
        //     //dayStartAdvanceBalance
        //     dayEndCashBalance: this.cashBalance,
        //     dayEndAdvanceBalance: this.advanceBalance,
        //     difference: this.difference,
        //     metadata: JSON.stringify(data)
        // } as DailyCashEntryDto;
        // this._dailyCashService.createOrUpdateDailyCash({ dailyCashInfo: input, prevCashInfo: null } as CreateOrUpdateDailyCashInput).subscribe(id => {
        //     this.id = id;
        //     this.saving = false;
        //     this.cd.detectChanges();
        //     this._notifyService.success("Successfully " + id ? 'Saved' : 'Updated' + "");
        // });
    }

    calculateBalance() {
        this.totalActualIncome = 0;
        this.totalVirtualTransaction = 0;
        this.totalExpense = 0;
        this.cashBalance = 0;
        this.advanceBalance = 0;
        this.difference = 0;
        this.dailyCashAccounts.forEach(x => {
            if (x.actualIncomeAmount && x.actualIncomeAmount > 0)
                this.totalActualIncome += x.actualIncomeAmount;

            if (x.virtualIncomeAmount && x.virtualIncomeAmount > 0)
                this.totalVirtualTransaction += x.virtualIncomeAmount;

            if (x.advanceAmount && x.advanceAmount > 0)
                this.advanceBalance += x.advanceAmount;

            if (x.dayEndCashAmount && x.dayEndCashAmount > 0)
                this.cashBalance += x.dayEndCashAmount;

            if (x.expenseAmount && x.expenseAmount > 0)
                this.totalExpense += x.expenseAmount;

            this.difference = this.totalActualIncome + this.totalVirtualTransaction - this.totalExpense - this.cashBalance - this.advanceBalance;
        })
    }

    addRows() {
        for (let i = 0; i < 3; i++) {
            this.dailyCashAccounts.push({} as DailyCashType);
        }
    }
}
