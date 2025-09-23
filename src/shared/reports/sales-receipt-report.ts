
import { Injectable } from '@angular/core';
import { firstValueFrom } from "rxjs";
import { SalesReceiptOutputDto, SalesRecieptProductDto, SalesServiceProxy } from "../service-proxies/service-proxies";
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Utils } from '@shared/helpers/Utils';
pdfMake.addVirtualFileSystem(pdfFonts);

@Injectable()
export class SalesReceiptReport {

    constructor(
        private readonly _salesService: SalesServiceProxy
    ) {

    }

    async generateSalesReceipt(saleId: number) {
        const data = await firstValueFrom(this._salesService.getSalesReceipt(saleId));
        const logo = await Utils.getImageDataUrl('../../assets/img/logo.png');

        var dd = {
            pageSize: 'A4',
            pageMargins: [20, 40, 20, 30],
            content: [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        body: [
                            [
                                { text: 'Sales Invoice', bold: true, fontSize: 20, alignment: 'center' },
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            return 1; // Thicker top/bottom lines
                        },
                        vLineWidth: function (i, node) {
                            return 0; // No vertical lines
                        },
                        hLineColor: function (i, node) {
                            return 'gray'; // Different colors
                        },
                        vLineColor: function (i, node) {
                            return 'black';
                        },
                        paddingLeft: function (i, node) { return 4; },
                        paddingRight: function (i, node) { return 4; },
                        paddingTop: function (i, node) { return 2; },
                        paddingBottom: function (i, node) { return 2; }
                    }

                },
                { text: ' ', fontSize: 5 },
                {
                    layout: "noBorders",
                    table: {
                        widths: [50, 3, 320, 40, 3, '*'], // Two columns, equal width
                        body: [
                            [
                                { text: 'Client' }, { text: ':' }, { text: data.customerName }, { text: 'Invoice' }, { text: ':' }, { text: data.invoiceNumber }
                            ],
                            [
                                { text: 'Address' }, { text: ':' }, { text: data.address }, { text: 'Sales' }, { text: ':' }, { text: data.saler }
                            ],
                        ]
                    }
                },
                { text: ' ', fontSize: 5 },
                {
                    table: {
                        widths: [5, 350, '*', '*', '*'],
                        body: this.getBody(data)
                    }
                },
                { text: ' ', fontSize: 5 },
                { text: `Amount in words:  ${Utils.capitalizeFirstLetter(Utils.inWords(data.totalAmount))}taka only.`, bold: true },
                { text: ' ', fontSize: 5 },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [{ text: 'Due Account', colSpan: 2, style: ['headerStyle', 'margin_1'] }, {text:''}],
                            [{ text: 'Previous Due', style: ['textRight'] }, { text: `${Utils.thousandsSeparator(data.previousDue)}/-`, style: ['textRight'] }],
                            [{ text: 'Invoice Due', style: ['textRight'] }, { text: `${Utils.thousandsSeparator(data.totalDue)}/-`, style: ['textRight'] }],
                            [{ text: 'Total Due', style: ['textRight'] }, { text: `${Utils.thousandsSeparator(data.overallDue)}/-`, style: ['textRight'] }],
                        ]
                    }
                },
                { text: ' ', fontSize: 10 },
                { text: 'Terms & Conditions', bold: true },
                { text: '1. VAT & Taxes are not includer in the above price.', marginLeft: 30 },
                { text: '2. Keep gas cylinders in a cool, dry and well-ventilated area.', marginLeft: 30 },
                { text: '3. Keep the cylinders away from flames, sparks, and heat sources.', marginLeft: 30 },
                { text: `4. Don't store oxygen cylinders with flammable materials like solvents or gas.`, marginLeft: 30, marginBottom: 50 },
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
                },
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
                textCenter: {
                    alignment: 'center'
                },
                textRight: {
                    alignment: 'right'
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
        pdfMake.createPdf(dd).download('Sales invoice.pdf');
        //pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getBody(data: SalesReceiptOutputDto) {
        const body = [
            [{ text: '#', style: ['headerStyle', 'margin_1'] }, { text: 'Particular', style: ['headerStyle', 'margin_1'] }, { text: 'Price', style: ['headerStyle', 'margin_1'] }, { text: 'Quantity', style: ['headerStyle', 'margin_1'] }, { text: 'Amount', style: ['headerStyle', 'margin_1'] }] as any,
        ];

        data.details.forEach((x, index) => {
            body.push([
                { text: (index + 1).toString(), style: ['margin_1'] },
                { text: x.product, style: ['margin_1'] },
                { text: Utils.thousandsSeparator(x.unitPrice), style: ['textCenter', 'margin_1'] },
                { text: x.qty.toString(), style: ['textCenter', 'margin_1'] },
                { text: `${Utils.thousandsSeparator(x.amount)}/-`, style: ['textCenter', 'margin_1'] }
            ])
        });

        body.push([{ text: 'Total', style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(data.totalAmount)}/-`, style: ['textCenter', 'margin_1'] }]);
        body.push([{ text: 'Paid', style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(data.totalPaid)}/-`, style: ['textCenter', 'margin_1'] }]);
        body.push([{ text: 'Due', style: ['textRight', 'margin_1'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: `${Utils.thousandsSeparator(data.totalDue)}/-`, style: ['textCenter', 'margin_1'] }]);

        return body;
    }

    
}

