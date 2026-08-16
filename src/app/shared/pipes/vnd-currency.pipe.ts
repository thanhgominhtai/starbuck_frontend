import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndCurrency',
  standalone: true,
})
export class VndCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0 đ';
    }
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
