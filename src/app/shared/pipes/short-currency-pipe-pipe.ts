import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortCurrencyPipe',
})
export class ShortCurrencyPipePipe implements PipeTransform {
transform(value: any, currencySymbol: string = '$'): string {
    if (value === null || value === undefined || isNaN(value)) return '-';

    const num = Number(value);

    // إذا كان الرقم مليون أو أكثر
    if (num >= 1000000) {
      return `${currencySymbol}${(num / 1000000).toFixed(2)}M`;
    }
    // إذا كان الرقم ألف أو أكثر (إختياري لو حابب تظهر K)
    if (num >= 1000) {
      return `${currencySymbol}${(num / 1000).toFixed(1)}K`;
    }

    // الرقم العادي
    return `${currencySymbol}${num.toString()}`;
  }
}

