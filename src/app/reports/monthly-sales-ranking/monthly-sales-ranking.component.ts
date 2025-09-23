import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ComboboxItemDto, CustomerDueReportDto, CustomerLedgerReportDto, CustomerServiceProxy, MonthlySalesRankingReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { finalize } from "rxjs/operators";
import moment, { invalid } from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
    selector: 'app-monthly-sales-ranking-report',
    standalone: false,
    templateUrl: './monthly-sales-ranking.component.html',
    animations: [appModuleAnimation()]
})
export class MonthlySalesRankingReportComponent implements OnInit {

    data: MonthlySalesRankingReportDto[] = [];
    monthId: number;
    yearId: number;
    loading: boolean = true;
    months: ComboboxItemDto[] = [];
    years: ComboboxItemDto[] = [];

    constructor(
        private cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
    ) {

    }
    ngOnInit(): void {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        months.forEach((m, index) => {
            this.months = [...this.months, { value: (index + 1).toString(), displayText: m } as ComboboxItemDto];
        });

        const currentYear: number = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear; i++) {
            this.years = [...this.years, { value: i.toString(), displayText: i.toString() } as ComboboxItemDto];
        }
        this.monthId = new Date().getMonth() + 1;
        this.yearId = currentYear;

        this.getReportData();
    }

    getReportData() {
        this.loading = true;
        this._salesService.getMonthlySalesRankingReport(this.monthId, this.yearId)
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
        const data = await firstValueFrom(this._salesService.getMonthlySalesRankingReport(this.monthId, this.yearId));
        const selectedMonth = this.months.find(f=> f.value == this.monthId.toString()).displayText;
        const selectedYear = this.years.find(f=> f.value == this.yearId.toString()).displayText;
        var dd = {
            pageSize: 'A4',
            pageMargins: [20, 40, 20, 30],
            content: [
                { text: `Monthly Sales Ranking`, fontSize: 20, bold: true, alignment: 'center', marginBottom: 3 },
                { text: `For the month of ${selectedMonth}, ${selectedYear}`, fontSize: 16, bold: true, alignment: 'center', marginBottom: 15 },
                {
                    table: {
                        widths: [35, 170, '*', '*', '*', '*', '*', '*', '*', 55],
                        body: this.getData(data)
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

    private getData(data: any) {
        const body = [
            [{ text: 'Rank', rowSpan: 3, style: ['headerStyle'] }, { text: 'User', rowSpan: 3, style: ['headerStyle'] }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Revenue', rowSpan: 3, style: ['headerStyle'] }],
            [{ text: '' }, { text: '' }, { text: 'Oxygen', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Air', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Nitros', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: ''}],
            [{ text: '' }, { text: '' }, { text: '9.80' }, { text: '1.36' }, { text: '9.80' }, { text: '7.00' }, { text: '30KG' }, { text: '5KG' }, { text: '3KG' }, { text: '' }],
        ];
        data.forEach(item => {
            body.push(
                [
                    { text: item.rank, style: ['cell_style', 'margin_1'] },
                    { text: item.customerName, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir7Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros30KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros5KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros3KgQty, style: ['cell_style', 'margin_1'] },
                    { text: this.thousandsSeparator(item.revenue), style: ['cell_style', 'margin_1'] }
                ]
            );
        });
        return body;
    }

    private thousandsSeparator(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

}
