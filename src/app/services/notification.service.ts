import { Injectable } from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';

//品牌变化订阅枚举
export enum BrandChangeEnum {
  QcWechatList = 'QcWechatList',
  QcWechatDetail = 'QcWechatDetail',

  QcWechatAiList = 'QcWechatAiList',
  QcWechatAiDetail = 'QcWechatAiDetail',

  QcPhoneList = 'QcPhoneList',
  QcPhoneDetail = 'QcPhoneDetail',
  //医生拜访历史
  QcPhoneSearchList = 'QcPhoneSearchList',

  RMRVisitList = 'RMRVisitList',

  //我的电话质检
  MyVisitPhoneList = 'MyVisitPhoneList',
  MyVisitPhoneDetail = 'MyVisitPhoneDetail',
  MyVisitWechatList = 'MyVisitWechatList',
  MyVisitWechatDetail = 'MyVisitWechatDetail',
  ClearAll = 'ClearAll',
}

//浏览器窗口大小变化订阅枚举
export enum BrowserWindowSizeChangeEnum {
  HcpDetails = 'HcpDetails',
  QcWechatList = 'QcWechatList',
  QcWechatDetail = 'QcWechatDetail',
  QcWechatAiList = 'QcWechatAiList',
  QcWechatAiDetail = 'QcWechatAiDetail',
  QcPhoneList = 'QcPhoneList',
  QcPhoneDetail = 'QcPhoneDetail',
  QcWechatSearchList = 'QcWechatSearchList',
  QcPhoneSearchList = 'QcPhoneSearchList',
  MyVisitPhoneVisit = 'MyVisitPhoneVisit',
  MyVisitWechatVisit = 'MyVisitWechatVisit',
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  //用于质检中心弹出添加规则弹框
  private qcAddRuleSubject: Subject<any> = new Subject();

  //浏览器窗口变化
  private browserWindowSizeChangeSubject: Subject<any> = new Subject();
  browserWindowSizeChangeSubscription = new Map<string, Subscription>();

  //品牌切换
  private brandChangeSubject: Subject<any> = new Subject();
  private brandChangeSubscriptions = new Map<string, Subscription>();


  constructor() { }
  //发送 点击了添加规则
  sendQCClickAddRuleNotification() {
    this.qcAddRuleSubject.next('');
  }
  //订阅模块加载状态--
  getQCClickAddRuleNotification(): Observable<any> {
    return this.qcAddRuleSubject.asObservable();
  }

  /**发送浏览器窗口大小发生变化通知*/
  sendBrowserWindowSizeChangeNotification(message: any) {
    this.browserWindowSizeChangeSubject.next(message);
  }

  /**获取浏览器窗口大小发生变化通知的Observable*/
  private getBrowserWindowSizeChangeNotification(): Observable<any> {
    return this.browserWindowSizeChangeSubject.asObservable();
  }

  /**添加订阅浏览器窗口大小发生变化*/
  subscribeToBrowserWindowSizeChange(componentId: BrowserWindowSizeChangeEnum, callback: (message: any) => void) {
    this.unsubscribeBrowserWindowSizeChangeNotification(componentId);
    const subscription = this.getBrowserWindowSizeChangeNotification().subscribe(callback);
    this.browserWindowSizeChangeSubscription.set(componentId, subscription);
  }
  /**取消浏览器窗口大小发生变化订阅*/
  unsubscribeBrowserWindowSizeChangeNotification(componentId: BrowserWindowSizeChangeEnum) {
    const subscription = this.browserWindowSizeChangeSubscription.get(componentId);
    if (subscription) {
      subscription.unsubscribe();
      this.browserWindowSizeChangeSubscription.delete(componentId);
    }
  }

  // 发送品牌变更通知
  sendBrandChangeNotification(brand: any) {
    this.brandChangeSubject.next(brand);
  }
  // 获取品牌变更通知的Observable
  private getBrandChangeNotification(): Observable<any> {
    return this.brandChangeSubject.asObservable();
  }
  // 添加订阅
  subscribeToBrandChange(componentId: BrandChangeEnum, callback: (brand: any) => void) {
    // 如果已经存在订阅，先取消之前的订阅
    this.unsubscribeFromBrandChange(componentId);
    // 创建新的订阅并保存
    const subscription = this.getBrandChangeNotification().subscribe(callback);
    this.brandChangeSubscriptions.set(componentId, subscription);
  }
  // 取消订阅
  unsubscribeFromBrandChange(componentId: BrandChangeEnum) {
    const subscription = this.brandChangeSubscriptions.get(componentId);

    if (subscription) {
      subscription.unsubscribe();
      this.brandChangeSubscriptions.delete(componentId);
    }

  }

  // 清理所有订阅
  clearAllSubscriptions() {
    this.brandChangeSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.brandChangeSubscriptions.clear();
  }

}
