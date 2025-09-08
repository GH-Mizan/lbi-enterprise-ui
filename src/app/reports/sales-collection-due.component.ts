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
  selector: 'app-sales-collection-due-report',
  standalone: false,
  templateUrl: './sales-collection-due.component.html',
  animations: [appModuleAnimation()],
  styles: [
    `
     :host ::ng-deep .p-inputtext {
        min-width: 185px !important;
      }
    `
  ]
})
export class SalesColllectionDueReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  endDate = new Date();
  startDate = (moment().subtract(30, 'days')).toDate();
  rangeDates = [this.startDate, this.endDate];


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
      moment(this.rangeDates[0]), moment(this.rangeDates[1])
    ).pipe(
      finalize(() => {
        this.primengTableHelper.hideLoadingIndicator();
      })
    )
      .subscribe((result) => {
        this.primengTableHelper.records = result;
        this.primengTableHelper.totalRecordsCount = result.length;
        this.primengTableHelper.hideLoadingIndicator();
        this.cd.detectChanges();
      });
  }

  delete() {

  }

  async print() {
    var items = await firstValueFrom(this._salesService.getSalesCollectionDueReport(
      moment(this.rangeDates[0]), moment(this.rangeDates[1])
    ));
    var dd = {
      pageSize: 'A4',
      pageMargins: [30, 40, 30, 40],
      content: [
        { text: 'Sales, Collection & Due', fontSize: 20, bold: true, alignment: 'center', marginBottom: 15 },
        {
          table: {
            widths: [70, '*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: this.getData(items)
          }
        }
      ],
      styles: {
        headerStyle: {
          fontSize: 16,
          bold: true,
          alignment: 'center'
        },
        text_green: {
          color: 'green'
        },
        text_blue: {
          color: 'blue'
        },
        text_red: {
          color: 'red'
        },
        cell_style: {
          bold: true,
          alignment: 'center'
        },
        margin_1: {
          marginTop: 1,
          marginBottom: 1
        }
      }

    };
    pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
    //pdfMake.createPdf(docDefinition).open();
    //pdfMake.createPdf(docDefinition).print();
  }

  private getData(items: any[]) {
    const body = [
      [{ text: 'Date', style: ['headerStyle'], rowSpan: 2 }, { text: "Sale", style: ['headerStyle', 'text_blue'], colSpan: 2 }, { text: '' }, { text: 'Collection', style: ['headerStyle', 'text_green'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: 'Due', style: ['headerStyle', 'text_red'], colSpan: 3 }, { text: '' }, { text: '' }],
      [{ text: '' }, { text: 'Today', style: ['text_blue', 'cell_style'] }, { text: "Balance", style: ['text_blue', 'cell_style'] }, { text: "Cash", style: ['text_green', 'cell_style'] }, { text: 'Due', style: ['text_green', 'cell_style'] }, { text: "Total", style: ['text_green', 'cell_style'] }, { text: "Balance", style: ['text_green', 'cell_style'] }, { text: 'Add', style: ['text_red', 'cell_style'] }, { text: "Deduct", style: ['text_red', 'cell_style'] }, { text: "Balance", style: ['text_red', 'cell_style'] }]
    ];
    items.forEach(item => {
      body.push(
        [{ text: moment(item.date).format('D MMM, YYYY').toString(), style: ['cell_style', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.totalSales), style: ['cell_style', 'text_blue', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.currentBalance), style: ['cell_style', 'text_blue', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.cashCollection), style: ['cell_style', 'text_green', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.dueCollection), style: ['cell_style', 'text_green', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.totalCollection), style: ['cell_style', 'text_green', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.collectedBalance), style: ['cell_style', 'text_green', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.currenctDue), style: ['cell_style', 'text_red', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.detuctedDue), style: ['cell_style', 'text_red', 'margin_1'] }, 
        { text: this.thousandsSeparator(item.dueBalance), style: ['cell_style', 'text_red', 'margin_1'] }]
      );
    });
    return body;
  }

private thousandsSeparator(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

}
