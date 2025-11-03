import { Component, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { TaskDetailModalComponent, TaskDetailData } from './components/task-detail-modal.component';

enum TaskType {
  CallDoctor = '打电话',
  WriteArticle = '发文章',
  SendWechat = '发微信',
  SendCircle = '朋友圈',
}

enum TaskIcon {
  CallDoctor = 'icon-dadianhua',
  WriteArticle = 'icon-tuisongpeizhi',
  SendWechat = 'icon-faweixin',
  SendCircle = 'icon-pengyouquan',
}

// 任务类型对应的颜色配置
// 方案一：专业配色（推荐）- 对比度好，语义清晰
enum TaskColor {
  CallDoctor = '#1890ff',      // 蓝色 - 重要任务（打电话）
  WriteArticle = '#52c41a',     // 绿色 - 内容创作（发文章）
  SendWechat = '#07C160',       // 微信绿 - 社交沟通（发微信）- 微信经典绿色，较亮
  SendCircle = '#00A15C',       // 微信深绿 - 社交分享（朋友圈）- 深一点的微信绿色，与发微信有明显区分
  Completed = '#bfbfbf',        // 灰色 - 已完成任务（所有类型的已完成任务都使用此颜色）
}

// 如需更换配色方案，可以取消注释以下方案并注释上面的方案：

// 方案二：柔和配色 - 更温和，适合长时间查看
// enum TaskColor {
//   CallDoctor = '#33b5ff',      // 主题蓝色
//   WriteArticle = '#36cfc9',     // 青色
//   SendWechat = '#ff9c6e',       // 橙粉色
//   SendCircle = '#b37feb',       // 淡紫色
// }

// 方案三：医疗专业配色 - 专业感强，适合医疗场景
// enum TaskColor {
//   CallDoctor = '#1890ff',      // 蓝色
//   WriteArticle = '#13c2c2',     // 青蓝色
//   SendWechat = '#ff7875',       // 珊瑚红
//   SendCircle = '#faad14',       // 金色
// }
@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    NzSpinModule,
    NzModalModule
  ],
  templateUrl: './calendar-modal.component.html',
  styleUrl: './calendar-modal.component.scss'
})
export class CalendarModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('fullCalendar') calendarComponent!: FullCalendarComponent;
  private resizeObserver?: ResizeObserver;
  private tooltipElement: HTMLElement | null = null; // 全局 tooltip 元素
  private taskDetailModalRef?: NzModalRef; // 任务详情弹窗引用

  constructor(private modal: NzModalService) {}
/*
任务展示的元素:品牌、任务类型（打电话，发文章，发朋友圈，发微信）、任务描述。
*/
  // 根据任务类型和完成状态获取对应的颜色
  getTaskColor(taskType: string, isCompleted: boolean = false): string {
    // 如果任务已完成，统一返回灰色
    if (isCompleted) {
      return TaskColor.Completed;
    }
    
    // 未完成的任务根据类型返回对应颜色
    switch (taskType) {
      case TaskType.CallDoctor:
        return TaskColor.CallDoctor;
      case TaskType.WriteArticle:
        return TaskColor.WriteArticle;
      case TaskType.SendWechat:
        return TaskColor.SendWechat;
      case TaskType.SendCircle:
        return TaskColor.SendCircle;
      default:
        return '#ff6b35'; // 默认颜色
    }
  }

  calendarEvents: EventInput[] = [
    {
      id: 'task-001', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-001', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date().toISOString().split('T')[0],
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-002',
      title: '全再乐',
      extendedProps: {
        taskId: 'task-002',
        brand: '全再乐',
        icon: TaskIcon.WriteArticle,
        taskType: TaskType.WriteArticle,
        taskDescription: '这是文章备注-可能是没有文章成功',
        isCompleted: false // 未完成
      },
      start: new Date().toISOString().split('T')[0],
      color: this.getTaskColor(TaskType.WriteArticle, false) // 使用配置的颜色
    },
    {
      id: 'task-003',
      title: '舒利迭',
      extendedProps: {
        taskId: 'task-003',
        brand: '舒利迭',
        icon: TaskIcon.SendWechat,
        taskType: TaskType.SendWechat,
        taskDescription: '这是微信备注-可能是没有微信成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7天后的日期
      color: this.getTaskColor(TaskType.SendWechat, false) // 使用配置的颜色
    },
    {
      id: 'task-004',
      title: '测试朋友圈',
      extendedProps: {
        taskId: 'task-004',
        brand: '测试品牌',
        icon: TaskIcon.SendCircle,
        taskType: TaskType.SendCircle,
        taskDescription: '这是朋友圈备注-测试朋友圈功能',
        isCompleted: false // 未完成
      },
      start: new Date().toISOString().split('T')[0],
      color: this.getTaskColor(TaskType.SendCircle, false) // 使用配置的颜色
    },
    // 已完成任务的示例
    {
      id: 'task-005',
      title: '已完成任务-欧乐欣',
      extendedProps: {
        taskId: 'task-005',
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是已完成的拜访任务',
        isCompleted: true, // 已完成
        processedTime: new Date().toLocaleString('zh-CN'),
        processedBy: '李四'
      },
      start: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, true) // 灰色（已完成）
    },
  ];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: zhCnLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek' // 只保留月视图和周视图，周视图不显示时间
    },
    events: this.calendarEvents,
    editable: false, // 禁用编辑（拖拽、调整大小）
    selectable: false, // 禁用选择日期范围
    dayMaxEvents: true,
    weekends: true,
    height: '100%', // 使用100%填充父容器，通过CSS min-height限制最小高度
    contentHeight: 'auto', // 内容高度自动
    eventClick: this.handleEventClick.bind(this),
    // 自定义事件内容显示（多行展示）
    eventContent: (arg) => {
      const event = arg.event;
      const extendedProps = event.extendedProps as any;
      const brand = extendedProps.brand || '';
      const taskType = extendedProps.taskType || '';
      const taskDescription = extendedProps.taskDescription || '';
      const icon = extendedProps.icon || '';
      const isCompleted = extendedProps.isCompleted || false;
      
      // 创建多行内容，图标放在任务类型前面
      // 为任务描述添加 title 属性，用于 tooltip（直接在这里设置，更可靠）
      const descriptionHtml = taskDescription 
        ? `<div class="fc-event-desc" title="${this.escapeHtml(taskDescription)}" data-full-description="${this.escapeHtml(taskDescription)}">${this.escapeHtml(taskDescription)}</div>` 
        : '';
      
      // 已完成标识
      const completedBadge = isCompleted ? '<span class="fc-event-completed">已完成</span>' : '';
      
      const html = `
        <div class="fc-custom-event">
          <div class="fc-event-brand">
            ${brand}
            ${completedBadge}
          </div>
          <div class="fc-event-type">
            ${icon ? `<i class="iconfont ${icon}"></i>` : ''}
            <span>${taskType}</span>
          </div>
          ${descriptionHtml}
        </div>
      `;
      
      return { html };
    }
  };

  isShowCalendar = false;
  
  // 年月跳转相关
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1; // 1-12
  
  // 生成年份列表（当前年份前后各10年）
  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }
  
  // 月份列表
  months: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // 获取月份名称（中文）
  getMonthName(month: number): string {
    return `${month}月`;
  }
  
  // 转义 HTML 特殊字符，用于 title 属性
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  ngAfterViewInit() {
    // 视图初始化完成后，多次延迟更新日历尺寸以确保宽度正确
    // 模态框打开需要时间，需要等待模态框完全渲染
    setTimeout(() => {
      // this.updateCalendarSize();
      this.isShowCalendar = true;
      
      // 延迟初始化 tooltip，等待日历完全渲染
      setTimeout(() => {
        this.initTooltips();
      }, 200);
    }, 100);
    
    // 监听事件渲染完成，重新初始化 tooltip
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.on('eventsSet', () => {
        setTimeout(() => {
          this.initTooltips();
        }, 100);
      });
    }
    // setTimeout(() => {
      
    //   this.updateCalendarSize();
    // }, 100);
    
    // setTimeout(() => {
    //   this.updateCalendarSize();
    // }, 300);
    
    // setTimeout(() => {
    //   this.updateCalendarSize();
    // }, 500);
    
    // 使用 ResizeObserver 监听容器尺寸变化
    if (typeof ResizeObserver !== 'undefined') {
      const wrapper = document.querySelector('.calendar-wrapper');
      if (wrapper) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateCalendarSize();
        });
        this.resizeObserver.observe(wrapper);
      }
    }
    
    // 监听窗口大小变化，确保日历宽度正确
    window.addEventListener('resize', this.updateCalendarSize);
  }

  ngOnDestroy() {
    // 移除事件监听
    window.removeEventListener('resize', this.updateCalendarSize);
    
    // 断开 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 清理 tooltip
    this.cleanupTooltips();
    
    // 移除全局 tooltip 元素
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }
  }
  
  //MARK:初始化 tooltip
  initTooltips(): void {
    // 先清理旧的 tooltip 实例
    this.cleanupTooltips();
    
    // 创建全局 tooltip 元素（如果还没有）
    if (!this.tooltipElement) {
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.className = 'custom-tooltip';
      this.tooltipElement.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        max-width: 300px;
        word-wrap: break-word;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      `;
      document.body.appendChild(this.tooltipElement);
    }
    
    const descElements = document.querySelectorAll('.fc-event-desc');
    descElements.forEach((element) => {
      const descElement = element as HTMLElement;
      const fullDescription = descElement.getAttribute('data-full-description');
      
      if (fullDescription) {
        // 解码 HTML 实体
        const decodedDescription = this.decodeHtml(fullDescription);
        
        // 检查内容是否被截断
        const isTruncated = descElement.scrollHeight > descElement.clientHeight || 
                           descElement.offsetWidth < descElement.scrollWidth;
        
        // 如果内容被截断或者有完整描述，添加 tooltip 功能
        if (isTruncated || decodedDescription) {
          descElement.classList.add('has-tooltip');
          
          // 添加鼠标事件监听
          const showHandler = (e: MouseEvent) => this.showCustomTooltip(e, decodedDescription);
          const hideHandler = () => this.hideCustomTooltip();
          const moveHandler = (e: MouseEvent) => this.moveCustomTooltip(e);
          
          descElement.addEventListener('mouseenter', showHandler);
          descElement.addEventListener('mouseleave', hideHandler);
          descElement.addEventListener('mousemove', moveHandler);
          
          // 保存事件处理器以便清理
          (descElement as any)._tooltipHandlers = { showHandler, hideHandler, moveHandler };
        }
      }
    });
  }
  
  // 显示自定义 tooltip
  showCustomTooltip(event: MouseEvent, text: string): void {
    if (!this.tooltipElement) return;
    
    this.tooltipElement.textContent = text;
    // 先设置为不可见但存在，以便计算尺寸
    this.tooltipElement.style.visibility = 'hidden';
    this.tooltipElement.style.opacity = '0';
    // 强制浏览器重新计算布局
    this.tooltipElement.offsetHeight;
    
    // 计算位置
    this.moveCustomTooltip(event);
    
    // 然后显示 tooltip
    this.tooltipElement.style.visibility = 'visible';
    this.tooltipElement.style.opacity = '1';
  }
  
  // 隐藏自定义 tooltip
  hideCustomTooltip(): void {
    if (!this.tooltipElement) return;
    this.tooltipElement.style.opacity = '0';
  }
  
  // 移动 tooltip 位置（带边界检测）
  moveCustomTooltip(event: MouseEvent): void {
    if (!this.tooltipElement) return;
    
    const offset = 10;
    const tooltipWidth = this.tooltipElement.offsetWidth || 300;
    const tooltipHeight = this.tooltipElement.offsetHeight || 50;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = event.pageX + offset;
    let y = event.pageY + offset;
    
    // 如果 tooltip 会超出右边界，显示在鼠标左边
    if (x + tooltipWidth > viewportWidth) {
      x = event.pageX - tooltipWidth - offset;
    }
    
    // 如果 tooltip 会超出下边界，显示在鼠标上方
    if (y + tooltipHeight > viewportHeight) {
      y = event.pageY - tooltipHeight - offset;
    }
    
    // 确保不会超出左边界
    if (x < 0) {
      x = offset;
    }
    
    // 确保不会超出上边界
    if (y < 0) {
      y = offset;
    }
    
    this.tooltipElement.style.left = `${x}px`;
    this.tooltipElement.style.top = `${y}px`;
  }
  
  // 解码 HTML 实体
  private decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
  
  // 清理 tooltip
  cleanupTooltips(): void {
    // 移除所有事件监听器
    const descElements = document.querySelectorAll('.fc-event-desc');
    descElements.forEach((element) => {
      const descElement = element as HTMLElement;
      const handlers = (descElement as any)._tooltipHandlers;
      if (handlers) {
        descElement.removeEventListener('mouseenter', handlers.showHandler);
        descElement.removeEventListener('mouseleave', handlers.hideHandler);
        descElement.removeEventListener('mousemove', handlers.moveHandler);
        delete (descElement as any)._tooltipHandlers;
      }
    });
    
    // 隐藏 tooltip
    this.hideCustomTooltip();
  }
  

  // 更新日历尺寸
  updateCalendarSize = () => {
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      // 触发日历重新计算尺寸
      api.updateSize();
    }
  }

  //MARK:点击任务
  handleEventClick(arg: any) {
    const event = arg.event;
    const extendedProps = event.extendedProps as any;
    
    // 保存事件引用，用于后续更新
    (event as any)._originalEvent = event;
    
    // 构建任务详情数据
    const taskDetailData: TaskDetailData & { _eventBrand?: string; _eventStart?: string } = {
      brand: extendedProps.brand || '未知',
      taskType: extendedProps.taskType || '未知',
      taskDescription: extendedProps.taskDescription || '无',
      isCompleted: extendedProps.isCompleted || false,
      startDate: event.start ? new Date(event.start).toLocaleString('zh-CN') : '未知',
      endDate: event.end ? new Date(event.end).toLocaleString('zh-CN') : (event.start ? new Date(event.start).toLocaleString('zh-CN') : '未知'),
      icon: extendedProps.icon || '',
      processedTime: extendedProps.processedTime || undefined,
      processedBy: extendedProps.processedBy || undefined,
      taskId: extendedProps.taskId || event.id || undefined,
      // 保存事件信息，用于查找原始数据（内部使用）
      _eventBrand: extendedProps.brand,
      _eventStart: event.start ? new Date(event.start).toISOString().split('T')[0] : undefined
    };

    // 打开任务详情弹窗
    this.taskDetailModalRef = this.modal.create({
      nzTitle: '任务详情',
      nzContent: TaskDetailModalComponent,
      nzWidth: 600,
      nzData: taskDetailData, // 传递数据给组件
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: true,
      nzWrapClassName: 'task-detail-modal-wrapper'
    });

    // 监听弹窗关闭事件，处理任务状态更新
    this.taskDetailModalRef.afterClose.subscribe((result: any) => {
      if (result?.success && result?.data) {
        // 任务已标记为已完成，更新日历中的事件
        this.updateEventAfterComplete(event, result.data);
      }
    });
  }

  // 更新任务完成后的状态（用于演示，直接修改内存中的数据）
  private updateEventAfterComplete(event: any, updatedData: TaskDetailData & { _eventBrand?: string; _eventStart?: string }): void {
    const extendedProps = event.extendedProps as any;
    
    // 通过 taskId 或 event.id 来查找对应的事件（优先使用ID）
    const taskId = updatedData.taskId || extendedProps.taskId || event.id;
    
    if (taskId) {
      const index = this.calendarEvents.findIndex((e: any) => {
        const eTaskId = e.id || (e.extendedProps as any)?.taskId;
        return eTaskId === taskId;
      });
      
      if (index !== -1) {
        // 更新 calendarEvents 数组中的原始数据（这是可写的）
        const originalEvent = this.calendarEvents[index] as any;
        if (originalEvent.extendedProps) {
          // 创建新的 extendedProps 对象，避免只读属性错误
          originalEvent.extendedProps = {
            ...originalEvent.extendedProps,
            isCompleted: true,
            processedTime: updatedData.processedTime,
            processedBy: updatedData.processedBy
          };
          originalEvent.color = this.getTaskColor(originalEvent.extendedProps.taskType, true);
          
          console.log('任务已更新:', originalEvent);
        }
      } else {
        console.warn('未找到对应的任务，taskId:', taskId);
      }
    } else {
      // 如果没有ID，使用品牌和日期匹配（备用方案）
      const eventBrand = updatedData._eventBrand || extendedProps.brand;
      const eventStart = updatedData._eventStart || (event.start ? new Date(event.start).toISOString().split('T')[0] : undefined);
      
      if (eventBrand && eventStart) {
        const index = this.calendarEvents.findIndex((e: any) => {
          const eBrand = (e.extendedProps as any)?.brand;
          const eStart = e.start ? new Date(e.start).toISOString().split('T')[0] : undefined;
          return eBrand === eventBrand && eStart === eventStart;
        });
        
        if (index !== -1) {
          const originalEvent = this.calendarEvents[index] as any;
          if (originalEvent.extendedProps) {
            // 创建新的 extendedProps 对象，避免只读属性错误
            originalEvent.extendedProps = {
              ...originalEvent.extendedProps,
              isCompleted: true,
              processedTime: updatedData.processedTime,
              processedBy: updatedData.processedBy
            };
            originalEvent.color = this.getTaskColor(originalEvent.extendedProps.taskType, true);
            
            console.log('任务已更新（通过品牌和日期匹配）:', originalEvent);
          }
        }
      }
    }

    // 使用 FullCalendar API 更新事件（不要直接修改 extendedProps，因为它是只读的）
    const api = this.calendarComponent?.getApi();
    if (api && taskId) {
      // 通过 setProp 方法更新事件属性
      event.setProp('color', this.getTaskColor(extendedProps.taskType, true));
      
      // 使用 setExtendedProp 更新 extendedProps（这是 FullCalendar 推荐的方式）
      event.setExtendedProp('isCompleted', true);
      event.setExtendedProp('processedTime', updatedData.processedTime);
      event.setExtendedProp('processedBy', updatedData.processedBy);
    }

    // 重新渲染事件
    if (api) {
      api.render();
      
      // 重新初始化 tooltip
      setTimeout(() => {
        this.initTooltips();
      }, 100);
    }
  }

  // 跳转到指定年月
  gotoDate(): void {
    // 创建日期对象（设置为该月第一天）
    const date = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      // 跳转到指定日期（会自动跳转到该日期所在的月份）
      api.gotoDate(date);
      // 更新日历尺寸
      this.updateCalendarSize();
    }
  }

  // 跳转到今天
  goToToday(): void {
    const today = new Date();
    this.selectedYear = today.getFullYear();
    this.selectedMonth = today.getMonth() + 1;
    
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.today();
      this.updateCalendarSize();
    }
  }
}

