export type Reminder={id:string;category:string;recordId:string;date:string;days:number;title:string;context:string;urgency:'overdue'|'today'|'upcoming';page:string};
export function businessDate(date?:Date,timeZone?:string):string;
export function daysFromBusinessDate(iso:string,today?:string):number|null;
export function buildReminders(data:Record<string,any[]>,userId?:string,at?:Date):Reminder[];
