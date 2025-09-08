import { AfterViewInit, Directive, ElementRef, Input, NgModule } from '@angular/core';

const focusableElements = [
  'input',
  'select',
  'button',
  'a',
];

@Directive({
  selector: '[autofocus]',
})
export class AutofocusDirective implements AfterViewInit {

  @Input()
  public set autofocus(shouldFocus: boolean) {
    this.shouldFocus = shouldFocus;
    this.checkFocus();
  }

  private shouldFocus = true;

  constructor(
    private readonly elementRef: ElementRef
  ) {
  }

  public ngAfterViewInit() {
    this.checkFocus();
    setTimeout(() => {
      this.elementRef.nativeElement.select();
    }, 1);
    
  }

  private checkFocus() {
    if (!this.shouldFocus) return;
    const hostElement = (
      <HTMLElement>
      this.elementRef.nativeElement
    );
    if (!hostElement) return;
    if (focusableElements.includes(
      hostElement.tagName.toLowerCase())
    ) {
      hostElement.focus?.();
    } else if (hostElement?.querySelector) {
      for (const tagName of focusableElements) {
        const childElement = (
          <HTMLInputElement>
          hostElement.querySelector(tagName)
        );
        if (childElement) {
          childElement?.focus?.();
          break;
        }
      }
    }
  }
}