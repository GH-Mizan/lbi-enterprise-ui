import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { DailySalesReportDto, SalesCollectionDueReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
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
    selector: 'app-daily-sales-report',
    standalone: false,
    templateUrl: './daily-sales-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
     :host ::ng-deep .p-inputtext {
        min-width: 185px !important;
      }
    `
    ]
})
export class DailySalesReportComponent implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    data: DailySalesReportDto;
    date = new Date();
    loading: boolean = false;

    constructor(
        private cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
    ) {
        
    }
    ngOnInit(): void {
        this.loading = true;
        this._salesService.getDailySalesReport(moment(this.date))
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cd.detectChanges();
                })
            )
            .subscribe((result) => {
                this.data = result;
                this.cd.detectChanges();
            });
    }

    // list(event?: LazyLoadEvent): void {
    //     this.primengTableHelper.showLoadingIndicator();
    //     this._salesService.getDailySalesReport(moment(this.date))
    //         .pipe(
    //             finalize(() => {
    //                 this.primengTableHelper.hideLoadingIndicator();
    //             })
    //         )
    //         .subscribe((result) => {
    //             this.data = result;
    //             this.primengTableHelper.records = result.details;
    //             this.primengTableHelper.totalRecordsCount = result.details.length;
    //             this.primengTableHelper.hideLoadingIndicator();
    //             this.cd.detectChanges();
    //         });
    // }

    delete() {

    }

    async print() {
        const data = await firstValueFrom(this._salesService.getDailySalesReport(moment(this.date)));
        var dd = {
            pageSize: 'A4',
            pageMargins: [20, 40, 20, 30],
            content: [
                { text: `Daily Sales (${moment(this.date).format('D MMM, YYYY').toString()})`, fontSize: 20, bold: true, alignment: 'center', marginBottom: 15 },
                {
                    table: {
                        widths: ['*', 25, 25, 25, 25, 25, 25, 25, 52, 55, 50],
                        body: this.getData(data)
                    }
                }
            ],
            styles: {
                headerStyle: {
                    fontSize: 15,
                    bold: true,
                    alignment: 'center'
                },
                text_green: {
                    color: 'green'
                },
                cell_style: {
                    fontSize: 13,
                    alignment: 'center'
                },
                margin_1: {
                    marginTop: 1,
                    marginBottom: 1
                },
                footerStyle: {
                    fontSize: 15,
                    bold: true,
                    alignment: 'right'
                },
                footerParticular: {
                    bold: true,
                    alignment: 'center'
                },
            }

        };
        // pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
        pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getData(data: any) {
        const body = [
            [{text: 'User', rowSpan: 3, style: ['headerStyle']}, {text: 'Particular', colSpan: 7, style: ['headerStyle']}, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle']}, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, {text: 'Bill No.', rowSpan: 3, style: ['headerStyle']}, {text: 'Amount', rowSpan: 3, style: ['headerStyle']}, {text: 'Status', rowSpan: 3, style: ['headerStyle']}],
            [{text: ''}, {text: 'Oxygen', colSpan: 2, style: ['headerStyle']}, { text: '' }, { text: 'Air', colSpan: 2 , style: ['headerStyle']}, { text: '' }, { text: 'Nitros', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '', colSpan: 3 }, {text: '', style: ['headerStyle']}, {text: ''}],
            [{text: ''}, {text: '9.80'}, { text: '1.36' }, { text: '9.80' }, { text: '7.00' }, { text: '30KG', fontSize: 10}, { text: '5KG' }, { text: '3KG' }, { text: '', colSpan: 3 }, {text: ''}, {text: ''}],
        ];
        data.details.forEach(item => {
            body.push(
                [
                    { text: item.customerName, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir7Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros30KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros5KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros3KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.invoiceNo, style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.netAmount), style: ['cell_style', 'margin_1'] },
                    { text: item.paymentStatusText == 'Partial Paid' ? 'P. Paid' : item.paymentStatusText, style: ['cell_style', 'margin_1'] }
                ]
            );
        });

        body.push([{text: ' ', colSpan: 11}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}]);
        body.push([{text: ' ', colSpan: 11}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}]);

        data.dueCollections.forEach(dc=> {
            body.push(
                [
                    {text: dc.customerName, style: ['text_green']}, {text: ' ', colSpan: 8 }, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, 
                    {text:  this.thousandsSeparator(dc.dueCollection), style: ['cell_style', 'text_green']}, {text: 'Due Col.', style: ['text_green']}
                ]
            );
        });

        body.push([{text: ' ', colSpan: 11}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}]);
        
        body.push([
            {text: 'Total Sale', style: ['footerStyle']}, 
            {text: data.medicalOxygen9_8TotalQty, style: ['footerParticular']},
            {text: data.medicalOxygen1_36TotalQty, style: ['footerParticular']},
            {text: data.medicalAir9_8TotalQty, style: ['footerParticular']},
            {text: data.medicalAir7TotalQty, style: ['footerParticular']},
            {text: data.nitros30KgTotalQty, style: ['footerParticular']},
            {text: data.nitros5KgTotalQty, style: ['footerParticular']},
            {text: data.nitros3KgTotalQty, style: ['footerParticular']}, 
            {text: `${this.thousandsSeparator(data.netTotal)}/-`, colSpan: 3, style: ['footerStyle']}, 
            {text: ''}, {text: ''}
        ]);

        body.push([
            {text: 'Cash Collection', style: ['footerStyle']}, 
            {text: `${this.thousandsSeparator(data.cashCollection)}/-`, colSpan: 10, style: ['footerStyle']}, 
            {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}
        ]);
        body.push([
            {text: 'Due Collection', style: ['footerStyle']}, 
            {text: `${this.thousandsSeparator(data.dueCollection)}/-`, colSpan: 10, style: ['footerStyle']}, 
            {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}
        ]);
        body.push([
            {text: 'Due', style: ['footerStyle']}, 
            {text: `${this.thousandsSeparator(data.due)}/-`, colSpan: 10, style: ['footerStyle']}, 
            {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}
        ]);


        return body;
    }

    private thousandsSeparator(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

}
