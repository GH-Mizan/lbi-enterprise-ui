import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ComboboxItemDto, MonthlySalesRankingReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
    selector: 'app-monthly-sales-ranking-report',
    standalone: false,
    templateUrl: './monthly-sales-ranking.component.html',
    animations: [appModuleAnimation()]
})
export class MonthlySalesRankingReportComponent extends PagedListingComponentBase<MonthlySalesRankingReportDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    monthId: number;
    yearId: number;
    loading: boolean = true;
    months: ComboboxItemDto[] = [];
    years: ComboboxItemDto[] = [];

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
    ) {
        super(injector, cd);
    }
    async ngOnInit() {
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

        this.pdfMake = await this.loadAndPrintPDF();
    }

    async loadAndPrintPDF() {
        const { default: pdfMake } = await import('pdfmake/build/pdfmake');
        const { default: pdfFonts } = await import('assets/vfs_fonts');
        pdfMake.addFonts({
            'TimesNewRoman': {
                normal: 'times-Regular.ttf',
                bold: 'Times New Roman Bold.ttf'
            },
            'LucidaGrande': {
                bold: 'LucidaGrandeBold.ttf'
            }
        });

        pdfMake.addVirtualFileSystem(pdfFonts);
        return pdfMake;
    }


    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._salesService.getMonthlySalesRankingReport(this.monthId, this.yearId)
            .pipe(finalize(() => {
                this.hideLoading();
            }))
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;
                this.cd.detectChanges();
            });
    }

    delete() { }

    async print() {
        this.showLoading();
        const data = await firstValueFrom(this._salesService.getMonthlySalesRankingReport(this.monthId, this.yearId));
         if (!data || data.length == 0) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        // let count = data.length + 1;
        // for (let i = count; i < 100 + count; i++) {
        //     data.push({ rank: i } as MonthlySalesRankingReportDto);
        // }

        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 20, 30, 20],
            content: this.getContent(data, logo),
            defaultStyle: {
                font: 'TimesNewRoman'
            },
            styles: {
                headerStyle: {
                    fontSize: 12,
                    bold: true,
                    alignment: 'center'
                },
                subHeader: {
                    fontSize: 10,
                    bold: true,
                    alignment: 'center'
                },
                cell_style: {
                    fontSize: 9,
                    alignment: 'center'
                },
                particularHeader: {
                    fontSize: 10,
                    bold: true,
                    alignment: 'center'
                },
                particularHeader136: {
                    marginTop: 1,
                    fontSize: 9,
                    bold: true,
                    alignment: 'center'
                },
                cellAmount: {
                    fontSize: 9,
                    alignment: 'right'
                }
            }

        };
        this.hideLoading();
        // pdfMake.createPdf(dd).download('Customerledge.pdf');
        this.pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getContent(data: MonthlySalesRankingReportDto[], logo: any) {
        const totalRows = data.length;
        let hasNextpage = false;
        const metaData: MonthlySalesRankingReportDto[][] = [];
        let slicedData: MonthlySalesRankingReportDto[] = [];
        if (totalRows > 42) {
            hasNextpage = true;
            const partition = Math.ceil(totalRows / 41);
            for (let i = 0; i < partition; i++) {
                slicedData = [];
                const itemsToTransfer = data.slice(0, 41);
                slicedData.push(...itemsToTransfer);
                data.splice(0, 41);
                metaData.push(slicedData);
            }
        }
        const selectedMonth = this.months.find(f => f.value == this.monthId.toString()).displayText;
        const selectedYear = this.years.find(f => f.value == this.yearId.toString()).displayText;

        if (!hasNextpage) {
            return [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        body: [
                            [{ text: `MONTHLY SALES RANKING (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
                        ]
                    }
                },
                { text: ' ', fontSize: 5 },
                {
                    layout: {
                        hLineColor: () => 'lightgrey',
                        vLineColor: () => 'lightgrey',
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                    },
                    table: {
                        widths: [30, '*', 25, 21, 24, 24, 24, 24, 21, 55],
                        body: this.getData(data)
                    }
                }
            ]
        } else {
            const content = [];
            metaData.forEach((items, index) => {
                content.push(
                    Utils.getReportHeaders(logo),
                    {
                        table: {
                            widths: ['*'], // Two columns, equal width
                            body: [
                                [{ text: `MONTHLY SALES RANKING (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
                            ]
                        }
                    },
                    { text: ' ', fontSize: 5 },
                    {
                        layout: {
                            hLineColor: () => 'lightgrey',
                            vLineColor: () => 'lightgrey',
                            hLineWidth: () => 1,
                            vLineWidth: () => 1,
                        },
                        table: {
                            widths: [30, '*', 25, 21, 24, 24, 24, 24, 21, 55],
                            body: this.getData(items)
                        }
                    },
                    { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                    ...(metaData.length === index + 1 ? [] : [{ text: '', pageBreak: 'after' }])
                )
            });
            return content;
        }
    }

    private getData(data: MonthlySalesRankingReportDto[]) {
        const body = [
            [{ text: 'Rank', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Client', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Revenue', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }] as any,
            [{ text: '' }, { text: '' }, { text: 'MO', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'NO', colSpan: 3, style: ['subHeader'] }, { text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '' }, { text: '9.80', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader136'] }, { text: '9.80', style: ['particularHeader'] }, { text: '7.00', style: ['particularHeader'] }, { text: '30kg', style: ['particularHeader'] }, { text: '5kg', style: ['particularHeader'] }, { text: '3kg', style: ['particularHeader'] }, { text: '' }],
        ];
        data.forEach(item => {
            body.push(
                [
                    { text: item.rank, style: ['cell_style'] },
                    { text: item.customerName, fontSize: 9 },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style'] },
                    { text: item.medicalAir7Qty, style: ['cell_style'] },
                    { text: item.nitros30KgQty, style: ['cell_style'] },
                    { text: item.nitros5KgQty, style: ['cell_style'] },
                    { text: item.nitros3KgQty, style: ['cell_style'] },
                    { text: !item.revenue ? 0 : `${Utils.thousandsSeparator(item.revenue)}/-`, style: ['cellAmount'] }
                ]
            );
        });

        return body;

    }
}
