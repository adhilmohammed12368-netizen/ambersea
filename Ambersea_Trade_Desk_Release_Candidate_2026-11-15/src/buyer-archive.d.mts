export const BUYER_CHILDREN:ReadonlyArray<{table:string,label:string}>;
export function isArchivedBuyer(buyer:any):boolean;
export function archiveBuyerData(existing:any,iso:string):Record<string,any>;
export function restoreBuyerData(existing:any):Record<string,any>;
export function buyerReferences(data:any,id:string):Array<{table:string,label:string,count:number}>;
export function buyerDeleteAllowed(data:any,id:string):boolean;
export function readableDeleteError(error:any):string;
