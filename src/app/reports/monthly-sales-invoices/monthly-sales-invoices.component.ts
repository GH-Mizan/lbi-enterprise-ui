import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ComboboxItemDto, CustomerServiceProxy, MonthlySalesInvoiceReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { finalize } from "rxjs/operators";
import moment, { invalid } from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Utils } from '@shared/helpers/Utils';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
    selector: 'app-monthly-sales-invoice-report',
    standalone: false,
    templateUrl: './monthly-sales-invoices.component.html',
    animations: [appModuleAnimation()]
})
export class MonthlySalesInvoiceReportComponent implements OnInit {

    data: MonthlySalesInvoiceReportDto;
    customerId: string = "";
    customers: ComboboxItemDto[] = [];
    monthId: number;
    yearId: number;
    loading: boolean = true;
    months: ComboboxItemDto[] = [];
    years: ComboboxItemDto[] = [];

    constructor(
        private cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy,
        private readonly _customerService: CustomerServiceProxy,
    ) {

    }
    ngOnInit(): void {
        const currentYear: number = new Date().getFullYear();
        this.months = Utils.getMonths();
        this.years = Utils.getYears(currentYear);
        this.monthId = new Date().getMonth() + 1;
        this.yearId = currentYear;
        this._customerService.getCustomersSelectList().subscribe(res => {
            this.customers = res;
            this.cd.detectChanges();
        })

        //this.getReportData();
    }

    getReportData() {
        this.loading = true;
        this._salesService.getMonthlySalesInvoiceReport(this.monthId, this.yearId, parseInt(this.customerId))
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

    async print() {
        const data = await firstValueFrom(this._salesService.getMonthlySalesInvoiceReport(this.monthId, this.yearId, parseInt(this.customerId)));
        const logo = await Utils.getImageDataUrl('../../assets/img/logo.png');
        const selectedMonth = this.months.find(f => f.value == this.monthId.toString()).displayText;
        const selectedYear = this.years.find(f => f.value == this.yearId.toString()).displayText;
        var dd = {
            pageSize: 'A4',
            pageMargins: [20, 40, 20, 30],
            content: [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        headerRows: 2,
                        body: [
                            [{ text: 'SALES INVOICE', bold: true, fontSize: 20, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'] }],
                            [{ text: `For the month of ${selectedMonth}, ${selectedYear}`, alignment: 'center',  border: [false, false, false, false] }]
                        ]
                    }
                },
                { text: ' ', fontSize: 10 },
                {
                    layout: "noBorders",
                    table: {
                        widths: [50, 3, 320, 40, 3, '*'], // Two columns, equal width
                        body: [
                            [
                                { text: 'Client' }, { text: ':' }, { text: data.customerName }, { text: 'Date :' }, { text: '' }, { text: moment(data.prepareDate).format('D MMM, YYYY').toString() }
                            ],
                            [
                                { text: 'Address' }, { text: ':' }, { text: data.address }, { text: ' ' }, { text: ' ' }, { text: ' ' }
                            ],
                        ]
                    }
                },
                { text: ' ', fontSize: 10 },
                {
                    table: {
                        widths: [80, '*', '*', '*', '*', '*', '*', '*', 55],
                        body: this.getData(data)
                    }
                },
                { text: ' ', fontSize: 5 },
                { text: `Amount in words:  ${Utils.capitalizeFirstLetter(Utils.inWords(data.totalAmount))}taka only.`, marginBottom: 50, bold: true },
                {
                    layout: 'noBorders',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [{
                                canvas: [
                                    {
                                        type: 'line',
                                        x1: 0, y1: 50, // Starting point
                                        x2: 150, y2: 50, // Ending point
                                        lineWidth: 1,
                                        lineColor: 'black'
                                    }
                                ],
                            },
                            {
                                canvas: [
                                    {
                                        type: 'line',
                                        x1: 100, y1: 50, // Starting point
                                        x2: 250, y2: 50, // Ending point
                                        lineWidth: 1,
                                        lineColor: 'black'
                                    }
                                ]
                            }],
                            [{text: `Client’s Signature`, marginLeft: 25 }, {text: `Authorized Signature`, marginLeft: 118}]
                        ]
                    }
                }
            ],
            styles: {
                headerStyle: {
                    fontSize: 13,
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

    private getData(data: MonthlySalesInvoiceReportDto) {
        const body = [
            [{ text: 'Date', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }] as any,
            [{ text: '' }, { text: 'Oxygen', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Air', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Nitros', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '9.80', alignment: 'center' }, { text: '1.36', alignment: 'center' }, { text: '9.80', alignment: 'center' }, { text: '7.00', alignment: 'center' }, { text: '30KG', alignment: 'center' }, { text: '5KG', alignment: 'center' }, { text: '3KG', alignment: 'center' }, { text: '' }],
        ];
        data.details.forEach(item => {
            body.push(
                [
                    { text: moment(item.date).format('D MMM, YYYY').toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen9_8Qty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen1_36Qty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir9_8Qty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir7Qty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.nitros30KgQty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.nitros5KgQty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: item.nitros3KgQty.toString(), style: ['cell_style', 'margin_1'] },
                    { text: Utils.thousandsSeparator(item.amount), style: ['cell_style', 'margin_1'] }
                ]
            );
        });
        body.push([
            {text: ' ', colSpan: 9}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}, {text: ''}
        ]);
        body.push([
            {text: 'Total', style: ['footerParticular']},
            {text: data.medicalOxygen9_8TotalQty.toString(), style: ['footerParticular']},
            {text: data.medicalOxygen1_36TotalQty.toString(), style: ['footerParticular']},
            {text: data.medicalAir9_8TotalQty.toString(), style: ['footerParticular']},
            {text: data.medicalAir7TotalQty.toString(), style: ['footerParticular']},
            {text: data.nitros30KgTotalQty.toString(), style: ['footerParticular']},
            {text: data.nitros5KgTotalQty.toString(), style: ['footerParticular']},
            {text: data.nitros3KgTotalQty.toString(), style: ['footerParticular']},
            {text: Utils.thousandsSeparator(data.totalAmount), style: ['footerParticular']},
        ]);
        
        return body;
    }

}
