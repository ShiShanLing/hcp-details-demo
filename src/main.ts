import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (environment.production) {
  // 在生产环境禁用大部分 console 输出，但保留 error 和 warn 用于错误和警告
  const noop = function() {};
  // 只禁用调试相关的 console 方法，保留 error 和 warn
  const methods = ['log', 'info', 'debug', 'trace', 'dir', 'dirxml', 'table', 'group', 'groupEnd', 'groupCollapsed', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp', 'context', 'memory'];
  
  methods.forEach(method => {
    const methodName = method as keyof Console;
    if (typeof console[methodName] === 'function') {
      (console as any)[methodName] = noop;
    }
  });
  
  // console.error 和 console.warn 保留，用于生产环境的错误和警告信息
  // 如果需要完全禁用所有 console（包括 error），可以取消下面的注释
  // console.error = noop;
  // console.warn = noop;
}
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
