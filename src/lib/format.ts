export const money = (n:number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const statuses = ['diterima','diproses','siap','selesai'] as const;
