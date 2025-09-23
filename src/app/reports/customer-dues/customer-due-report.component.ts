import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ComboboxItemDto, CustomerDueReportDto, CustomerLedgerReportDto, CustomerServiceProxy, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
    selector: 'app-customer-due-report',
    standalone: false,
    templateUrl: './customer-due-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
     :host ::ng-deep .p-inputtext {
        min-width: 190px !important;
      }
    `
    ]
})
export class CustomerDueReportComponent implements OnInit {

    data: CustomerDueReportDto[] = [];
    endDate = new Date();
    startDate = (moment().subtract(30, 'days')).toDate();
    loading: boolean = true;
    customerId: string = "";
    customerName: string = "";
    customers: ComboboxItemDto[] = [];
    invalidParam: boolean = true;

    constructor(
        private cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy,
        private readonly _customerService: CustomerServiceProxy,
    ) {

    }
    ngOnInit(): void {
        this._customerService.getCustomersSelectList().subscribe(res=> {
            this.customers = res;
            this.cd.detectChanges();
        })
    }

    getReportData() {
        this.loading = true;
        this._salesService.getCustomerDueReport(parseInt(this.customerId), moment(this.startDate), moment(this.endDate))
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

    onCustomerChanged() {
        if(this.customerId) {
            this.customerName = this.customers.find(f=> f.value == this.customerId).displayText;
            this.invalidParam = false;
        } else {
            this.invalidParam = true;
            this.customerName = "";
        }
    }

    async print() {
        const data = await firstValueFrom(this._salesService.getCustomerDueReport(parseInt(this.customerId), moment(this.startDate), moment(this.endDate)));
        var dd = {
            pageSize: 'A4',
            pageMargins: [20, 40, 20, 30],
            content: [
                { text: `Due Bills of ${this.customerName}`, fontSize: 20, bold: true, alignment: 'center', marginBottom: 15 },
                {
                    table: {
                        widths: [70, '*', '*', '*', '*', '*', '*', '*', 55, 55, 55],
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
        // pdfMake.createPdf(dd).download('Customerledge.pdf');
        pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getData(data: any) {
        const body = [
            [{ text: 'Date', rowSpan: 3, style: ['headerStyle'] }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'] }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'] }, { text: 'Balance', rowSpan: 3, style: ['headerStyle'] }],
            [{ text: '' }, { text: 'Oxygen', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Air', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Nitros', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '', colSpan: 3 }, { text: '', style: ['headerStyle'] }, { text: '' }],
            [{ text: '' }, { text: '9.80' }, { text: '1.36' }, { text: '9.80' }, { text: '7.00' }, { text: '30KG' }, { text: '5KG' }, { text: '3KG' }, { text: '', colSpan: 3 }, { text: '' }, { text: '' }],
        ];
        data.forEach(item => {
            body.push(
                [
                    { text: moment(item.date).format('D MMM, YYYY').toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir7Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros30KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros5KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros3KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.invoiceNo, style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.totalDue), style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.balance), style: ['cell_style', 'margin_1'] }
                ]
            );
        });
        return body;
    }

    private thousandsSeparator(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

}
