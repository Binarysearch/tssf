import { Ta } from './example/ta';
import { Injector } from './injection/injector';


const ta: Ta = Injector.resolve(Ta);

console.log(ta);
console.log('----------');

ta.saySomething();