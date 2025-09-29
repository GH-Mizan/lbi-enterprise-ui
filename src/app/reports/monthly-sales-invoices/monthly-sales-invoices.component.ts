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
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        const selectedMonth = this.months.find(f => f.value == this.monthId.toString()).displayText;
        const selectedYear = this.years.find(f => f.value == this.yearId.toString()).displayText;
        var dd = {
            pageSize: 'A4',
            pageMargins: [40, 20, 40, 20],
            content: [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: `SALES INVOICE (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
                        ]
                    }
                },
                { text: ' ', fontSize: 3 },
                {
                    layout: "noBorders",
                    table: {
                        widths: [43, 2, 310, 35, 2, '*'],
                        body: [
                            [
                                { text: 'Client', fontSize: 11 }, { text: ':', fontSize: 11 }, { text: data.customerName, fontSize: 11 }, { text: 'Date :', fontSize: 11 }, { text: '', fontSize: 11 }, { text: moment(data.prepareDate).format('DD-MMM-YY').toString(), fontSize: 11 }
                            ],
                            [
                                { text: 'Address', fontSize: 11 }, { text: ':', fontSize: 11 }, { text: data.address, fontSize: 11 }, { text: ' ', fontSize: 11 }, { text: ' ', fontSize: 11 }, { text: ' ', fontSize: 11 }
                            ],
                        ]
                    }
                },
                { text: ' ', fontSize: 3 },
                {
                    layout: {
                        hLineColor: () => 'grey',
                        vLineColor: () => 'grey',
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                    },
                    table: {
                        widths: [70, '*', '*', '*', '*', '*', '*', '*', 60],
                        body: this.getData(data)
                    }
                },
                { text: ' ', fontSize: 5 },
                { text: `Amount in words:  ${Utils.capitalizeFirstLetter(Utils.inWords(data.totalAmount))}taka only.`, marginBottom: 20, bold: true },
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
                                        lineColor: 'grey'
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
                                        lineColor: 'grey'
                                    }
                                ]
                            }],
                            [{ text: `Client`, marginLeft: 57 }, { text: `Authorizer`, marginLeft: 148 }]
                        ]
                    }
                }
            ],
            styles: {
                headerStyle: {
                    fontSize: 12,
                    bold: true,
                    alignment: 'center'
                },
                cell_style: {
                    fontSize: 9,
                    alignment: 'center'
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
            [{ text: '' }, { text: 'MO', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'NO', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '9.80', alignment: 'center' }, { text: '1.36', alignment: 'center' }, { text: '9.80', alignment: 'center' }, { text: '7.00', alignment: 'center' }, { text: '30kg', alignment: 'center' }, { text: '5kg', alignment: 'center' }, { text: '3kg', alignment: 'center' }, { text: '' }],
        ];
        const details = data.details;
        details.forEach(item => {
            body.push(
                [
                    { text: moment(item.date).format('D-MMM-YY').toString(), style: ['cell_style'] },
                    { text: item.medicalOxygen9_8Qty.toString(), style: ['cell_style'] },
                    { text: item.medicalOxygen1_36Qty.toString(), style: ['cell_style'] },
                    { text: item.medicalAir9_8Qty.toString(), style: ['cell_style'] },
                    { text: item.medicalAir7Qty.toString(), style: ['cell_style'] },
                    { text: item.nitros30KgQty.toString(), style: ['cell_style'] },
                    { text: item.nitros5KgQty.toString(), style: ['cell_style'] },
                    { text: item.nitros3KgQty.toString(), style: ['cell_style'] },
                    { text: Utils.thousandsSeparator(item.amount), alignment: 'right', fontSize: 9 }
                ]
            );
        });

        // if (details.length < 31) {
        //     for (let i = 0; i < 31 - details.length; i++) {
        //         body.push([{ text: ' ', style: ['cell_style'] }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }])
        //     }
        // }

        body.push([
            { text: 'Total', style: ['footerParticular'] },
            { text: data.medicalOxygen9_8TotalQty.toString(), style: ['footerParticular'] },
            { text: data.medicalOxygen1_36TotalQty.toString(), style: ['footerParticular'] },
            { text: data.medicalAir9_8TotalQty.toString(), style: ['footerParticular'] },
            { text: data.medicalAir7TotalQty.toString(), style: ['footerParticular'] },
            { text: data.nitros30KgTotalQty.toString(), style: ['footerParticular'] },
            { text: data.nitros5KgTotalQty.toString(), style: ['footerParticular'] },
            { text: data.nitros3KgTotalQty.toString(), style: ['footerParticular'] },
            { text: Utils.thousandsSeparator(data.totalAmount), bold: true, alignment: 'right' },
        ]);

        return body;
    }

}
