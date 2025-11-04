import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (environment.production) {
  // 重写console对象的方法
  window.console.log = function(){};
}
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
