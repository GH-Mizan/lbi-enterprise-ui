
import { Injectable } from '@angular/core';
import { firstValueFrom } from "rxjs";
import { PurchaseReceiptOutputDto, PurchaseServiceProxy } from "../service-proxies/service-proxies";
import { Utils } from '@shared/helpers/Utils';
import moment from 'moment';

@Injectable()
export class PurchaseReceiptReport {

    pdfMake: any;

    constructor(
        private readonly _purchaseService: PurchaseServiceProxy
    ) { }

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

    async generatePurchaseReceipt(purchaseId: number) {
        if (!this.pdfMake)
            this.pdfMake = await this.loadAndPrintPDF();

        const data = await firstValueFrom(this._purchaseService.getPurchaseReceipt(purchaseId));
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');

        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 20, 30, 20],
            content: [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        body: [
                            [{ text: 'PURCHASE INVOICE', bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }]
                        ]
                    }
                },
                { text: ' ', fontSize: 15 },
                {
                    layout: "noBorders",
                    table: {
                        widths: [43, 2, 360, 35, 2, '*'], // Two columns, equal width
                        body: [
                            [
                                { text: 'Client', fontSize: 11 }, { text: ':', fontSize: 11 }, { text: data.supplierName, fontSize: 11 }, { text: 'Invoice', fontSize: 11 }, { text: ':', fontSize: 11 }, { text: data.invoiceNumber, fontSize: 11 }
                            ],
                            [
                                { text: 'Address', fontSize: 11 }, { text: ':', fontSize: 11 }, { text: data.address, fontSize: 11 }, { text: 'Date', fontSize: 11 }, { text: ':', fontSize: 11 }, { text: moment(data.invoiceDate).format('DD-MMM-YY').toString(), fontSize: 11 }
                            ],
                        ]
                    }
                },
                { text: ' ', fontSize: 10 },
                { text: `Purchase Person: ${data.purchaser}`, fontSize: 11 },
                { text: ' ', fontSize: 10 },
                {
                    layout: {
                        hLineColor: () => 'lightgrey',
                        vLineColor: () => 'lightgrey',
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                    },
                    table: {
                        widths: [5, '*', 70, 70, 70],
                        body: this.getBody(data)
                    }
                },
                { text: ' ', fontSize: 5 },
                { text: `Amount in words:  ${Utils.capitalizeFirstLetter(Utils.inWords(data.totalAmount))}taka only.`, bold: true },
                { text: ' ', fontSize: 25 },
                {
                    layout: {
                        hLineColor: () => 'lightgrey',
                        vLineColor: () => 'lightgrey',
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                    },
                    table: {
                        widths: [100, 100],
                        body: [
                            [{ text: 'Due Account', colSpan: 2, style: ['headerStyle', 'margin_1'], fillColor: 'lightgrey' }, { text: '' }],
                            [{ text: 'Previous Due' }, { text: `${Utils.thousandsSeparator(data.previousDue)}/-`, style: ['textRight'] }],
                            [{ text: 'Invoice Due' }, { text: `${Utils.thousandsSeparator(data.totalDue)}/-`, style: ['textRight'] }],
                            [{ text: 'Total Due' }, { text: `${Utils.thousandsSeparator(data.overallDue)}/-`, style: ['textRight'] }],
                        ]
                    }
                },
                { text: ' ', fontSize: 20 },
                { text: 'Terms & Conditions', bold: true, fontSize: 13, marginBottom: 5 },
                { text: '1. VAT & Taxes are not included in the above price. ' },
                { text: '2. All payments are to be rendered in cash at the time of delivery.' },
                { text: '3. Clients are responsible for safe handling and storage of medical oxygen. Cylinders must be secured upright.' },
                { text: '4. Keep them in a cool & well-ventilated area and keep them away from flames, sparks, and heat sources.' },
                { text: '5. Emergency or after-hours deliveries are subject to additional charges.', marginBottom: 50 },
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
                            [{ text: `Client`, marginLeft: 57 }, { text: `Authorizer`, marginLeft: 150 }]
                        ]
                    }
                },
            ],
            defaultStyle: {
                font: 'TimesNewRoman'
            },
            styles: {
                headerStyle: {
                    fontSize: 13,
                    bold: true,
                    alignment: 'center'
                },
                textCenter: {
                    alignment: 'center'
                },
                textRight: {
                    alignment: 'right'
                },
                margin_1: {
                    marginTop: 1,
                    marginBottom: 1
                }
            }

        };
        this.pdfMake.createPdf(dd).download('Purchases invoice.pdf');
        //pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getBody(data: PurchaseReceiptOutputDto) {
        const body = [
            [{ text: '#', style: ['headerStyle', 'margin_1'] }, { text: 'Particular', style: ['headerStyle', 'margin_1'] }, { text: 'Price', style: ['headerStyle', 'margin_1'] }, { text: 'Quantity', style: ['headerStyle', 'margin_1'] }, { text: 'Amount', style: ['headerStyle', 'margin_1'] }] as any,
        ];

        data.details.forEach((x, index) => {
            body.push([
                { text: (index + 1).toString(), style: ['margin_1'] },
                { text: x.product, style: ['margin_1'] },
                { text: Utils.thousandsSeparator(x.unitPrice), style: ['textCenter', 'margin_1'] },
                { text: x.qty.toString(), style: ['textCenter', 'margin_1'] },
                { text: `${Utils.thousandsSeparator(x.amount)}/-`, style: ['textRight', 'margin_1'] }
            ])
        });

        body.push([{ text: 'Total', style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(data.totalAmount)}/-`, style: ['textRight', 'margin_1'] }]);
        //body.push([{ text: 'Paid', style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(data.totalPaid)}/-`, style: ['textRight', 'margin_1'] }]);
        data.paymentBreakdown.forEach(x => {
            body.push([{ text: `Paid (${moment(x.paymentDate).format('DD-MMM-YY').toString()})`, style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(x.amount)}/-`, style: ['textRight', 'margin_1'] }]);
        });
        body.push([{ text: 'Due', style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(data.totalDue)}/-`, style: ['textRight', 'margin_1'] }]);

        return body;
    }


}

