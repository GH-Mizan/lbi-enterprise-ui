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
import { Utils } from '@shared/helpers/Utils';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
  selector: 'app-sales-collection-due-report',
  standalone: false,
  templateUrl: './sales-collection-due.component.html',
  animations: [appModuleAnimation()]
})
export class SalesColllectionDueReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  endDate = new Date();
  startDate = (moment().subtract(31, 'days')).toDate();
  maxDate = this.endDate;


  constructor(
    injector: Injector,
    cd: ChangeDetectorRef,
    private _salesService: SalesServiceProxy
  ) {
    super(injector, cd);
    //(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
  }

  list(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();
    this._salesService.getSalesCollectionDueReport(
      moment(this.startDate), moment(this.endDate)
    ).pipe(
      finalize(() => {
        this.primengTableHelper.hideLoadingIndicator();
      })
    )
      .subscribe((result) => {
        const items = result.filter(f => !f.empty);
        this.primengTableHelper.records = items;
        this.primengTableHelper.totalRecordsCount = items.length;
        this.primengTableHelper.hideLoadingIndicator();
        this.cd.detectChanges();
      });
  }

  delete() {

  }

  async print() {
    const items = await firstValueFrom(this._salesService.getSalesCollectionDueReport(
      moment(this.startDate), moment(this.endDate)
    ));
    const logo = await Utils.getImageDataUrl('assets/img/logo.png');

    var dd = {
      pageSize: 'A4',
      pageMargins: [30, 20, 30, 20],
      content: [
        Utils.getReportHeaders(logo),
        {
          table: {
            widths: ['*'],
            body: [
              [{ text: 'SALE, COLLECTION & DUE', bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
            ]
          }
        },
        { text: ' ', fontSize: 5 },
        {
          layout: {
            hLineColor: () => 'grey',
            vLineColor: () => 'grey',
            hLineWidth: () => 1,
            vLineWidth: () => 1,
          },
          table: {
            widths: [46, '*', '*', '*', 39, '*', '*', '*', '*', '*'],
            body: this.getData(items)
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
          fontSize: 10,
          alignment: 'right'
        },
        subHeader: {
          fontSize: 10,
          alignment: 'center'
        },
        highlight: {
          fillColor: '#E6E6E6'
        }
      }

    };
    //pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
    pdfMake.createPdf(dd).open();
    //pdfMake.createPdf(docDefinition).print();
  }

  private getData(items: any[]) {
    const body = [
      [{ text: 'Date', style: ['headerStyle'], rowSpan: 2, marginTop: 11 }, { text: "Sale", style: ['headerStyle'], colSpan: 2 }, { text: '' }, { text: 'Collection', style: ['headerStyle', 'highlight'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: 'Due', style: ['headerStyle'], colSpan: 3 }, { text: '' }, { text: '' }] as any,
      [{ text: '' }, { text: 'Today', style: ['subHeader'] }, { text: "Balance", style: ['subHeader'] }, { text: "Cash", style: ['highlight', 'subHeader'] }, { text: 'Due', style: ['highlight', 'subHeader'] }, { text: "Total", style: ['highlight', 'subHeader'] }, { text: "Balance", style: ['highlight', 'subHeader'] }, { text: 'Today', style: ['subHeader'] }, { text: "Collection", style: ['subHeader'] }, { text: "Balance", style: ['subHeader'] }]
    ];
    items.filter(f => !f.empty).forEach(item => {
      body.push(
        [{ text: moment(item.date).format('DD-MMM-YY').toString(), style: ['subHeader'], },
        { text: Utils.thousandsSeparator(item.totalSales), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.currentBalance), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.cashCollection), style: ['cell_style', 'highlight'] },
        { text: Utils.thousandsSeparator(item.dueCollection), style: ['cell_style', 'highlight'] },
        { text: Utils.thousandsSeparator(item.totalCollection), style: ['cell_style', 'highlight'] },
        { text: Utils.thousandsSeparator(item.collectedBalance), style: ['cell_style', 'highlight'] },
        { text: Utils.thousandsSeparator(item.currenctDue), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.detuctedDue), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.dueBalance), style: ['cell_style'] }]
      );
    });
    return body;
  }

  startDateChanged() {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + 31);
    this.maxDate = this.endDate;
    this.cd.detectChanges();
  }

}
