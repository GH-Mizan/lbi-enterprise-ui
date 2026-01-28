import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { DataSharingService } from "@shared/services/data-sharing.service";
import { DailyCashType } from "../voucher-entry/voucher-entry.component";
import { SalaryServiceProxy } from "@shared/service-proxies/service-proxies";
import { firstValueFrom } from "rxjs";

type IncomeType = {
    key: string,
    id: number,
    head: string,
    amount: number
}

type ExpenseType = {
    key: string,
    id: number,
    head: string,
    amount: number
}

type AdvanceType = {
    employeeId: number;
    head: string,
    amount: number
}

type DayEndCashType = {
    head: string,
    amount: number
}

type ManToManAccountType = {
    type: string,
    id: number,
    name: string,
    amount: number
}

@Component({
    selector: 'daily-cash-reconciliation',
    templateUrl: './daily-cash-reconciliation.component.html',
    standalone: false,
    animations: [appModuleAnimation()]
})

export class DailyCashReconciliationComponent implements OnInit {

    incomeRecords: IncomeType[] = [];
    expenseRecords: ExpenseType[] = [];
    advanceRecords: AdvanceType[] = [];
    dayEndCashRecords: DayEndCashType[] = [];

    vouchers: DailyCashType[] = [];

    constructor(
        private _dataSharingService: DataSharingService,
        private _salaryService: SalaryServiceProxy,
        private cd: ChangeDetectorRef
    ) {

    }

    ngOnInit() {
        this._dataSharingService.currentVouchers$.subscribe(res => {
            this.vouchers = res;



            const manToManAccounts: ManToManAccountType[] = [];
            res.forEach(item => {
                if (item.type === "INCOME" && item.incomeKey === "CLIENT") {
                    const exists = this.incomeRecords.find(f => f => f.key === "Client" && f.id == item.incomeId);
                    if (exists) exists.amount += item.incomeAmount;
                    else this.incomeRecords.push({ key: "Client", id: item.incomeId, head: item.incomeHead, amount: item.incomeAmount } as IncomeType);
                } else if (item.type === "EXPENSE" && item.expenseKey !== "INTERNAL_STUFF") {
                    const exists = this.expenseRecords.find(f => f => f.key === item.expenseKey && f.id == item.expenseId);
                    if (exists) exists.amount += item.expenseAmount;
                    else this.expenseRecords.push({ key: item.expenseKey, id: item.expenseId, head: item.expenseHead, amount: item.expenseAmount } as ExpenseType);
                }



                if ((item.type === "INCOME" || item.type === "EXPENSE") && (item.incomeKey === "INTERNAL_STUFF" || item.expenseKey === "INTERNAL_STUFF")) {
                    const mtm = { type: item.type } as ManToManAccountType;
                    if (item.type === "INCOME") {
                        mtm.id = item.incomeId;
                        mtm.name = item.incomeHead;
                        mtm.amount = item.incomeAmount;
                    } else {
                        mtm.id = item.expenseId;
                        mtm.name = item.expenseHead;
                        mtm.amount = item.expenseAmount;
                    }
                    manToManAccounts.push(mtm);
                }
            })
            const stuffUniqeIds: number[] = [...new Set(manToManAccounts.map(m => m.id))];
            stuffUniqeIds.forEach(id => {
                const incomeTotal = (manToManAccounts.filter(f => f.type === "INCOME" && f.id == id).reduce((accumulator, item) => {
                    accumulator.amount += item.amount;
                    return accumulator;
                }, { amount: 0 })).amount;
                const expenseTotal = (manToManAccounts.filter(f => f.type === "EXPENSE" && f.id == id).reduce((accumulator, item) => {
                    accumulator.amount += item.amount;
                    return accumulator;
                }, { amount: 0 })).amount;

                if (incomeTotal > expenseTotal) {
                    const incomeRecord = {
                        key: "INTERNAL_STUFF",
                        id: id,
                        head: manToManAccounts.find(f => f.type === "INCOME" && f.id == id).name,
                        amount: incomeTotal - expenseTotal
                    } as IncomeType;
                    this.incomeRecords.push(incomeRecord);
                } else if (expenseTotal > incomeTotal) {
                    const expenseRecord = {
                        key: "INTERNAL_STUFF",
                        id: id,
                        head: manToManAccounts.find(f => f.type === "EXPENSE" && f.id == id).name,
                        amount: expenseTotal - incomeTotal
                    } as ExpenseType;
                    this.expenseRecords.push(expenseRecord);
                }
            })
            this.cd.detectChanges();
        });
        this._salaryService.getSalaryAdvanceList().subscribe(res => {
            const advanceRecords = res.filter(f => f.advance > 0);
            if (advanceRecords.length > 0) {
                advanceRecords.forEach(r => {
                    this.advanceRecords.push({ employeeId: r.employeeId, head: r.employeeName, amount: r.advance } as AdvanceType);
                })
            }
            this.cd.detectChanges();
        });


    }

}