import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { SalesCollectionDueReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
    selector: 'app-customer-overall-dues-report',
    standalone: false,
    templateUrl: './customer-overall-dues-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
        :host ::ng-deep .p-inputtext {
            min-width: 185px !important;
        }
        `
    ]
})
export class CustomerOverallDuesReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    endDate = new Date();
    startDate = (moment().subtract(30, 'days')).toDate();
    rangeDates = [this.startDate, this.endDate];

    previousDue: number;
    currentSales: number;
    currentPaymnet: number;
    currentDue: number;


    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
    ) {
        super(injector, cd);
    }

    list(event?: LazyLoadEvent): void {
        this.primengTableHelper.showLoadingIndicator();
        this._salesService.getCustomersOverallDueReport(moment(this.rangeDates[0]), moment(this.rangeDates[1]))
            .pipe(
                finalize(() => {
                    this.primengTableHelper.hideLoadingIndicator();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;

                const values = result.reduce((accumulator, item) => {
                    accumulator.previousDue += item.previousDue;
                    accumulator.currentSales += item.currentSales;
                    accumulator.currentPaymnet += item.currentPaymnet;
                    accumulator.currentDue += item.currentDue;
                    return accumulator;
                }, { previousDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 });

                this.previousDue = values.previousDue;
                this.currentSales = values.currentSales;
                this.currentPaymnet = values.currentPaymnet;
                this.currentDue = values.currentDue;

                this.primengTableHelper.hideLoadingIndicator();
                this.cd.detectChanges();
            });
    }

    delete() {

    }

    async print() {
        const items = await firstValueFrom(this._salesService.getCustomersOverallDueReport(
            moment(this.rangeDates[0]), moment(this.rangeDates[1])
        ));
        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 40, 30, 40],
            content: [
                { text: 'Users’ Due/Balance (Total Market Due)', fontSize: 20, bold: true, alignment: 'center', marginBottom: 2 },
                { text: `From ${moment(this.rangeDates[0]).format('D MMM, YYYY')} to ${moment(this.rangeDates[1]).format('D MMM, YYYY')}`, fontSize: 17, bold: true, alignment: 'center', marginBottom: 15 },
                {
                    table: {
                        widths: [20, 150, '*', '*', '*', '*'],
                        body: this.getData(items)
                    }
                }
            ],
            styles: {
                headerStyle: {
                    fillColor: '#D1D1D1',
                    fontSize: 16,
                    bold: true,
                    alignment: 'center'
                },
                cell_style: {
                    bold: true,
                    alignment: 'center'
                },
                center: {
                    alignment: 'center'
                },
                cellLightGrey: {
                    fillColor: '#F2F2F2'
                },
                cellTotal: {
                    fontSize: 14,
                    bold: true,
                    alignment: 'right'
                },
                margin_1: {
                    marginTop: 1,
                    marginBottom: 1
                },
                margin_2: {
                    marginTop: 2,
                    marginBottom: 2
                }
            }

        };
        //pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
        pdfMake.createPdf(dd).open();
        //pdfMake.createPdf(docDefinition).print();
    }

    private getData(items: any[]) {
        const body = [
            [{ text: '#', style: ['headerStyle'], colSpan: 1 }, { text: "User", style: ['headerStyle'] }, { text: "Previous Due", style: ['headerStyle', 'center'] }, { text: "Sales", style: ['headerStyle', 'center'] }, { text: "Payment", style: ['headerStyle', 'center'] }, { text: "Current Due", style: ['headerStyle', 'center'] }],
        ];
        items.forEach(item => {
            body.push(
                [
                    { text: item.serial, style: ['cell_style', 'margin_1'] },
                    { text: item.customerName, style: ['margin_1'] },
                    { text: this.thousandsSeparator(item.previousDue), style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.currentSales), style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.currentPaymnet), style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.currentDue), style: ['cell_style', 'margin_1'] }
                ]
            );
        });
        const values = items.reduce((accumulator, item) => {
            accumulator.previousDue += item.previousDue;
            accumulator.currentSales += item.currentSales;
            accumulator.currentPaymnet += item.currentPaymnet;
            accumulator.currentDue += item.currentDue;
            return accumulator;
        }, { previousDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 });

        body.push(
                [
                    { text: "Total", style: ['cellTotal', 'margin_2', 'cellLightGrey'], colSpan: 2 },
                    { text: '', style: ['margin_2'] },
                    { text: this.thousandsSeparator(values.previousDue), style: ['cell_style', 'margin_2', 'cellLightGrey'] },
                    { text: this.thousandsSeparator(values.currentSales), style: ['cell_style', 'margin_2', 'cellLightGrey'] },
                    { text: this.thousandsSeparator(values.currentPaymnet), style: ['cell_style', 'margin_2', 'cellLightGrey'] },
                    { text: this.thousandsSeparator(values.currentDue), style: ['cell_style', 'margin_2', 'cellLightGrey'] }
                ]
            );

        return body;
    }

    private thousandsSeparator(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

}
