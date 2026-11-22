/**
 * Number to Words Utility (Tafqeet / التفقيط المالي)
 * Converts numeric currency amounts into formal Arabic and English wording for financial vouchers.
 */

const ONES_AR = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS_AR = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS_AR = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertChunkArabic(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];

  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    parts.push(HUNDREDS_AR[hundreds]);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES_AR[remainder]);
    } else {
      const ones = remainder % 10;
      const tens = Math.floor(remainder / 10);
      if (ones > 0) {
        parts.push(`${ONES_AR[ones]} و${TENS_AR[tens]}`);
      } else {
        parts.push(TENS_AR[tens]);
      }
    }
  }

  return parts.join(' و');
}

export function numberToArabicWords(amount: number, currency: 'EGP' | 'USD' | string = 'EGP'): string {
  if (isNaN(amount) || amount === 0) {
    return currency === 'USD' ? 'صفر دولار أمريكي' : 'صفر جنيه مصري';
  }

  const isNegative = amount < 0;
  const absTotal = Math.abs(amount);
  const integerPart = Math.floor(absTotal);
  const decimalPart = Math.round((absTotal - integerPart) * 100);

  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const units = integerPart % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(`${convertChunkArabic(millions)} ملايين`);
    else parts.push(`${convertChunkArabic(millions)} مليون`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertChunkArabic(thousands)} آلاف`);
    else parts.push(`${convertChunkArabic(thousands)} ألف`);
  }

  if (units > 0 || parts.length === 0) {
    parts.push(convertChunkArabic(units));
  }

  let words = parts.join(' و');
  const currencyStr = currency === 'USD' ? 'دولار أمريكي' : 'جنيه مصري';

  if (decimalPart > 0) {
    const subunitStr = currency === 'USD' ? 'سنتاً' : 'قرشاً';
    words = `${words} ${currencyStr} و${convertChunkArabic(decimalPart)} ${subunitStr}`;
    return `فقط ${isNegative ? 'سالب ' : ''}${words} لا غير`;
  }

  return `فقط ${isNegative ? 'سالب ' : ''}${words} ${currencyStr} لا غير`;
}

const ONES_EN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS_EN = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunkEnglish(num: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    parts.push(`${ONES_EN[hundreds]} Hundred`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES_EN[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${TENS_EN[tens]}-${ONES_EN[ones]}` : TENS_EN[tens]);
    }
  }

  return parts.join(' ');
}

export function numberToEnglishWords(amount: number, currency: 'EGP' | 'USD' | string = 'EGP'): string {
  if (isNaN(amount) || amount === 0) {
    return currency === 'USD' ? 'Zero US Dollars' : 'Zero Egyptian Pounds';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));

  const millions = Math.floor(absAmount / 1000000);
  const thousands = Math.floor((absAmount % 1000000) / 1000);
  const units = absAmount % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    parts.push(`${convertChunkEnglish(millions)} Million`);
  }

  if (thousands > 0) {
    parts.push(`${convertChunkEnglish(thousands)} Thousand`);
  }

  if (units > 0) {
    parts.push(convertChunkEnglish(units));
  }

  const words = parts.join(' ');
  const currencyStr = currency === 'USD' ? 'US Dollars' : 'Egyptian Pounds';

  return `Only ${isNegative ? 'Negative ' : ''}${words} ${currencyStr}`;
}
