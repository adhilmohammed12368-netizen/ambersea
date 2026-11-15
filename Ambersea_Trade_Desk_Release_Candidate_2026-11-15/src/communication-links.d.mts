export const OUTREACH_CHANNELS:ReadonlyArray<string>;
export function normalizeWhatsApp(value:unknown):string|null;
export function safeLinkedIn(value:unknown):string|null;
export function outreachAllowed(buyer:any):boolean;
export function outreachTemplate(buyer:any,recipient:any,brand?:string,website?:string):{subject:string,body:string};
export function channelAction(input:{channel:string,recipient:any,subject?:string,body:string,blocked?:boolean,reviewed?:boolean}):{ready:boolean,reason?:string,mode?:string,href?:string,wechatId?:string,label?:string};
export function communicationPayload(input:{buyerId:string,channel:string,direction:string,subject?:string,body:string,language?:string,evidence?:string}):any;
