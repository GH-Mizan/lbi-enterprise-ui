import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from "@angular/core";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PagedListingComponentBase } from "@shared/paged-listing-component-base";
import { ComboboxItemDto, SalaryEntryInputDto, SalaryEntryOutputDto, SalaryServiceProxy } from "@shared/service-proxies/service-proxies";
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { Utils } from "@shared/helpers/Utils";


@Component({
    selector: 'app-salary-entry',
    templateUrl: './salary-entry.component.html',
    standalone: false,
    animations: [appModuleAnimation()],
    styles: [
        `
            :host ::ng-deep .p-datepicker .p-inputtext {
                width: 110px !important;
            }

            :host ::ng-deep .p-datepicker {
                margin-left: -20px;
                margin-right: -20px;
            }

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

export class SalaryEntryComponent extends PagedListingComponentBase<SalaryEntryOutputDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;
    saving: boolean = false;

    months: ComboboxItemDto[] = [];
    years: ComboboxItemDto[] = [];

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salaryService: SalaryServiceProxy,
    ) {
        super(injector, cd);
    }

    ngOnInit(): void {
        this.months = Utils.getMonths();
        const currentYear: number = new Date().getFullYear();
        for (let i = currentYear - 2; i <= currentYear; i++) {
            this.years.push({ value: i.toString(), displayText: i.toString() } as ComboboxItemDto);
        }
        this.years.push({ value: (currentYear + 1).toString() , displayText: (currentYear + 1).toString() } as ComboboxItemDto);
        this.cd.detectChanges();
    }

    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._salaryService.getSalaryEntryInfo()
            .pipe(
                finalize(() => {
                    this.hideLoading();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;
                this.cd.detectChanges();
            });
    }

    delete() { }

    onSalaryChanged(item: SalaryEntryOutputDto) {
        item.paid = item.amount + item.lastSalaryAmount;
        item.due = item.payable - item.paid;
    }

    onAttandanceChanged(item: SalaryEntryOutputDto) {
        const perDaySalary = item.currentSalary / item.totalDays;
        item.payable = Math.ceil(perDaySalary * item.workingDays);
        item.due = item.payable - item.paid;
    }

    save(item: SalaryEntryOutputDto) {
        this.saving = true;
        this.showLoading();

        if(item.paid > item.payable) {
            abp.message.error("You can't pay more than the Payable amount", "Invalid");
            this.hideLoading();
            this.saving = false;
            return;
        }

        if(item.amount === 0) {
            this.hideLoading();
            abp.message.error("Salary amount must be greater than 0", "Invalid");
            this.saving = false;
            return;
        }

        const input = { 
            employeeId: item.employeeId,
            date: item.salaryDate,
            year: item.year,
            month: item.month,
            amount: item.amount,
            remarks: item.remarks,
            payable: item.payable,
            fullPaid: item.paid === item.payable,
            workingDays: item.workingDays
        } as SalaryEntryInputDto;

        this._salaryService.createOrUpdateSalary(input).subscribe(res=> {
            this.refresh();
            this.notify.info("Successfully Saved");
            this.hideLoading();
            this.saving = false;
        })
    }

    bulkSave() {
        this.saving = true;
        // this.showLoading();
        // this._salaryService.createOrUpdateBulkSalaryAdvance(this.primengTableHelper.records).subscribe(res=> {
        //     this.notify.info("Successfully Saved");
        //     this.refresh();
        //     this.hideLoading();
        // })
    }

}