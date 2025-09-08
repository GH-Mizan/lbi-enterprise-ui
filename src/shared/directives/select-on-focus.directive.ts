import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[selectOnFocus]'
})
export class SelectOnFocusDirective {

  constructor(private el: ElementRef) { }

  @HostListener('focus') onFocus() {
    this.el.nativeElement.select();
  }
}