import { Component, AfterViewInit, ViewChild, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import zhCnLocale from '@fullcalendar/core/locales/zh-cn';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { TaskDetailData } from './components/task-detail-modal.component';

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
    NzModalModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzTagModule,
    NzDividerModule
  ],
  templateUrl: './calendar-modal.component.html',
  styleUrl: './calendar-modal.component.scss'
})
export class CalendarModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('fullCalendar') calendarComponent!: FullCalendarComponent;
  private resizeObserver?: ResizeObserver;
  private tooltipElement: HTMLElement | null = null; // 全局 tooltip 元素
  
  // 浮动面板相关
  showTaskPanel = false; // 是否显示任务详情面板
  currentTaskData: TaskDetailData | null = null; // 当前显示的任务数据
  panelPosition = { top: '100px', left: '100px' }; // 面板位置（初始值，避免在 0,0 位置）
  panelProcessing = false; // 处理任务中
  private hidePanelTimeout?: number; // 延迟隐藏面板的定时器
  
  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}
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
      id: 'task-1011', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-1011', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-2011', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-2011', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 昨天的日期
      color: this.getTaskColor(TaskType.CallDoctor, false) // 使用配置的颜色
    },
    {
      id: 'task-3011', // 添加唯一ID
      title: '欧乐欣', // 标题用于显示，但会被 eventContent 覆盖
      extendedProps: {
        taskId: 'task-3011', // 也在 extendedProps 中保存ID
        brand: '欧乐欣',
        icon: TaskIcon.CallDoctor,
        taskType: TaskType.CallDoctor,
        taskDescription: '这是拜访备注-可能是没有拜访成功',
        isCompleted: false // 未完成
      },
      start: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // 昨天的日期
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
    // 阻止点击事件（改为悬停显示）
    eventClick: (arg) => {
      arg.jsEvent.preventDefault();
      arg.jsEvent.stopPropagation();
      // 不执行任何操作，只阻止默认行为
      return false;
    },
    // 鼠标悬停事件 - FullCalendar 原生支持
    eventMouseEnter: (arg) => {
      this.handleEventMouseEnter(arg);
    },
    eventMouseLeave: (arg) => {
      this.handleEventMouseLeave(arg);
    },
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
      
      // 获取事件ID用于匹配和设置元素ID
      const eventId = extendedProps.taskId || event.id || '';
      const eventElementId = `task-event-${eventId}`;
      
      const html = `
        <div class="fc-custom-event" data-event-id="${eventId}" id="${eventElementId}">
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
      
      // 延迟初始化 tooltip 和鼠标事件，等待日历完全渲染
      setTimeout(() => {
        this.initTooltips();
        this.initEventMouseHandlers();
      }, 200);
    }, 100);
    
    // 监听事件渲染完成，重新初始化 tooltip 和鼠标事件
    if (this.calendarComponent?.getApi()) {
      const api = this.calendarComponent.getApi();
      api.on('eventsSet', () => {
        setTimeout(() => {
          this.initTooltips();
          this.initEventMouseHandlers();
        }, 100);
      });
      

      setTimeout(() => {
        this.initEventMouseHandlers();
      }, 600);
      
    
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

  //MARK:鼠标进入任务事件（使用 FullCalendar 的 eventMouseEnter）
  handleEventMouseEnter(arg: any): void {
    const event = arg.event;
    const extendedProps = event.extendedProps as any;
    
    // 清除之前的隐藏定时器
    if (this.hidePanelTimeout) {
      clearTimeout(this.hidePanelTimeout);
      this.hidePanelTimeout = undefined;
    }
    
    // 构建任务详情数据
    const taskDetailData: TaskDetailData = {
      brand: extendedProps.brand || '未知',
      taskType: extendedProps.taskType || '未知',
      taskDescription: extendedProps.taskDescription || '无',
      isCompleted: extendedProps.isCompleted || false,
      startDate: event.start ? new Date(event.start).toLocaleString('zh-CN') : '未知',
      endDate: event.end ? new Date(event.end).toLocaleString('zh-CN') : (event.start ? new Date(event.start).toLocaleString('zh-CN') : '未知'),
      icon: extendedProps.icon || '',
      processedTime: extendedProps.processedTime || undefined,
      processedBy: extendedProps.processedBy || undefined,
      taskId: extendedProps.taskId || event.id || undefined
    };
    
    this.currentTaskData = taskDetailData;
    
    // 通过元素ID或arg.el获取元素位置
    const eventId = extendedProps.taskId || event.id || '';
    const eventElementId = `task-event-${eventId}`;
    
    // 尝试通过ID获取元素，如果没有则使用arg.el
    let targetElement = document.getElementById(eventElementId) || arg.el as HTMLElement;
    
    // 如果找不到，尝试通过查找包含data-event-id的元素
    if (!targetElement || !targetElement.getBoundingClientRect) {
      const customEventElement = document.querySelector(`[data-event-id="${eventId}"]`);
      if (customEventElement) {
        targetElement = customEventElement.closest('.fc-event') as HTMLElement || customEventElement as HTMLElement;
      }
    }
    
    // 打印任务元素的位置坐标
    if (targetElement) {
      const elementRect = targetElement.getBoundingClientRect();
      console.log('=== 任务元素位置信息 ===');
      console.log('任务品牌:', extendedProps.brand);
      console.log('元素ID:', eventElementId);
      console.log('元素位置 (getBoundingClientRect):', {
        left: elementRect.left,
        top: elementRect.top,
        right: elementRect.right,
        bottom: elementRect.bottom,
        width: elementRect.width,
        height: elementRect.height
      });
      console.log('元素相对位置 (offsetLeft/Top):', {
        offsetLeft: (targetElement as HTMLElement).offsetLeft,
        offsetTop: (targetElement as HTMLElement).offsetTop
      });
      
      // 获取模态框信息
      const modalWrapper = document.querySelector('.calendar-modal-wrapper') as HTMLElement;
      const modalContent = modalWrapper?.querySelector('.ant-modal-content') as HTMLElement;
      if (modalContent) {
        const modalRect = modalContent.getBoundingClientRect();
        console.log('模态框位置:', {
          left: modalRect.left,
          top: modalRect.top,
          right: modalRect.right,
          bottom: modalRect.bottom,
          width: modalRect.width,
          height: modalRect.height
        });
        
        // 计算元素在模态框中的相对位置
        const elementLeftInModal = elementRect.left - modalRect.left;
        const elementTopInModal = elementRect.top - modalRect.top;
        console.log('元素在模态框中的相对位置:', {
          left: elementLeftInModal,
          top: elementTopInModal,
          right: elementLeftInModal + elementRect.width,
          bottom: elementTopInModal + elementRect.height
        });
        console.log('位置计算验证:', {
          '元素视口top': elementRect.top,
          '模态框视口top': modalRect.top,
          '差值（元素在模态框中）': elementRect.top - modalRect.top,
          '应该等于相对位置top': elementTopInModal
        });
      }
      console.log('========================');
    }
    
    // 先计算位置（不更新绑定值），然后一次性更新所有绑定
    let calculatedPosition = { top: '100px', left: '100px' };
    
    if (targetElement) {
      // 临时计算位置，但不更新 this.panelPosition
      const position = this.calculatePanelPositionByElement(targetElement);
      if (position) {
        calculatedPosition = position;
      }
    } else if (arg.jsEvent) {
      // 备用方案：使用鼠标事件位置
      const position = this.calculatePanelPositionByMouseEvent(arg.jsEvent);
      if (position) {
        calculatedPosition = position;
      }
    }
    
    // 打印计算后的面板位置
    console.log('计算后的面板位置:', calculatedPosition);
    console.log('面板将显示在:', {
      left: calculatedPosition.left,
      top: calculatedPosition.top,
      '相对于元素位置': targetElement ? {
        '元素right': (targetElement as HTMLElement).getBoundingClientRect().right,
        '面板left数值': calculatedPosition.left.replace('px', ''),
        '差值': parseFloat(calculatedPosition.left) - (targetElement as HTMLElement).getBoundingClientRect().right
      } : '无'
    });
    
    // 同时更新位置和显示状态，避免分步更新导致变更检测错误
    this.panelPosition = calculatedPosition;
    this.showTaskPanel = true;
    
    // 使用 markForCheck 而不是 detectChanges，避免在变更检测周期中触发错误
    this.cdr.markForCheck();
    
    // 如果需要更精确的位置，在下一帧微调
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        if (targetElement && this.showTaskPanel) {
          const position = this.calculatePanelPositionByElement(targetElement);
          if (position) {
            this.ngZone.run(() => {
              this.panelPosition = position;
              this.cdr.markForCheck();
            });
          }
        }
      });
    });
  }
  
  //MARK:鼠标离开任务事件（使用 FullCalendar 的 eventMouseLeave）
  handleEventMouseLeave(arg: any): void {
    const extendedProps = arg.event.extendedProps as any;
    console.log('鼠标离开事件:', extendedProps.brand);
    
    // 延迟隐藏面板，给用户时间移动鼠标到面板上
    this.hidePanelTimeout = window.setTimeout(() => {
      this.showTaskPanel = false;
      this.currentTaskData = null;
    }, 200);
  }
  
  //MARK:初始化事件鼠标处理器（保留作为备用，现在主要使用 FullCalendar 的 eventMouseEnter/Leave）
  initEventMouseHandlers(): void {
    // 清理旧的事件处理器
    this.cleanupEventMouseHandlers();
    
    const api = this.calendarComponent?.getApi();
    if (!api) {
      console.warn('Calendar API not available');
      return;
    }
    
    // 获取所有事件
    const events = api.getEvents();
    console.log('初始化鼠标事件处理器，找到', events.length, '个事件');
    
    // 查找所有事件元素（只查找 .fc-event，不查找内部的 .fc-custom-event）
    const eventElements = document.querySelectorAll('.fc-event');
    console.log('找到', eventElements.length, '个事件DOM元素');
    
    eventElements.forEach((element, index) => {
      const eventElement = element as HTMLElement;
      
      let matchedEvent: any = null;
      
      // 方法1: 从内部的 fc-custom-event 元素获取 data-event-id
      const customEventElement = eventElement.querySelector('.fc-custom-event') as HTMLElement;
      const eventId = customEventElement?.getAttribute('data-event-id');
      
      if (eventId) {
        matchedEvent = api.getEventById(eventId);
        if (matchedEvent) {
          console.log(`事件 ${index} 通过 ID 匹配成功:`, eventId);
        }
      }
      
      // 方法2: 尝试通过 FullCalendar 的内部属性获取事件
      if (!matchedEvent && (eventElement as any).__event) {
        matchedEvent = (eventElement as any).__event;
        if (matchedEvent) {
          console.log(`事件 ${index} 通过内部属性匹配成功`);
        }
      }
      
      // 方法3: 通过事件文本内容匹配（品牌名称）
      if (!matchedEvent) {
        const elementText = eventElement.textContent?.trim() || '';
        if (elementText) {
          matchedEvent = events.find((evt: any) => {
            const extendedProps = evt.extendedProps as any;
            const brand = extendedProps?.brand || '';
            return brand && elementText.includes(brand);
          });
          if (matchedEvent) {
            console.log(`事件 ${index} 通过文本匹配成功:`, elementText.substring(0, 20));
          }
        }
      }
      
      // 方法4: 通过日期和位置匹配
      if (!matchedEvent && events.length > 0) {
        const dayElement = eventElement.closest('.fc-day') || eventElement.closest('[data-date]');
        if (dayElement) {
          const dateStr = (dayElement as HTMLElement).getAttribute('data-date');
          if (dateStr) {
            const eventDateStr = dateStr.split('T')[0];
            const sameDateEvents = events.filter((evt: any) => {
              if (evt.start) {
                const evtDateStr = new Date(evt.start).toISOString().split('T')[0];
                return evtDateStr === eventDateStr;
              }
              return false;
            });
            
            // 找到同一天中未匹配的事件
            const alreadyMatchedIds = new Set(
              Array.from(document.querySelectorAll('.fc-event[data-matched-event-id]'))
                .map(el => el.getAttribute('data-matched-event-id'))
            );
            
            matchedEvent = sameDateEvents.find((evt: any) => {
              const id = evt.id || evt.extendedProps?.taskId;
              return id && !alreadyMatchedIds.has(String(id));
            }) || sameDateEvents[0];
            
            if (matchedEvent) {
              console.log(`事件 ${index} 通过日期匹配成功:`, eventDateStr);
            }
          }
        }
      }
      
      if (matchedEvent) {
        const extendedProps = matchedEvent.extendedProps as any;
        
        // 标记这个元素已经匹配了事件
        const matchedId = matchedEvent.id || extendedProps.taskId || '';
        eventElement.setAttribute('data-matched-event-id', matchedId);
        
        // 创建鼠标进入处理器
        const mouseEnterHandler = (e: MouseEvent) => {
          console.log('鼠标进入事件:', extendedProps.brand);
          e.stopPropagation();
          
          // 清除之前的隐藏定时器
          if (this.hidePanelTimeout) {
            clearTimeout(this.hidePanelTimeout);
            this.hidePanelTimeout = undefined;
          }
    
    // 构建任务详情数据
          const taskDetailData: TaskDetailData = {
      brand: extendedProps.brand || '未知',
      taskType: extendedProps.taskType || '未知',
      taskDescription: extendedProps.taskDescription || '无',
      isCompleted: extendedProps.isCompleted || false,
            startDate: matchedEvent.start ? new Date(matchedEvent.start).toLocaleString('zh-CN') : '未知',
            endDate: matchedEvent.end ? new Date(matchedEvent.end).toLocaleString('zh-CN') : (matchedEvent.start ? new Date(matchedEvent.start).toLocaleString('zh-CN') : '未知'),
      icon: extendedProps.icon || '',
      processedTime: extendedProps.processedTime || undefined,
      processedBy: extendedProps.processedBy || undefined,
            taskId: extendedProps.taskId || matchedEvent.id || undefined
          };
          
          this.currentTaskData = taskDetailData;
          
          // 计算面板位置
          this.updatePanelPosition(e);
          
          // 显示面板
          this.showTaskPanel = true;
          console.log('面板显示状态:', this.showTaskPanel);
        };
        
        // 创建鼠标离开处理器
        const mouseLeaveHandler = () => {
          console.log('鼠标离开事件:', extendedProps.brand);
          // 延迟隐藏面板，给用户时间移动鼠标到面板上
          this.hidePanelTimeout = window.setTimeout(() => {
            this.showTaskPanel = false;
            this.currentTaskData = null;
          }, 200);
        };
        
        // 直接绑定到 .fc-event 元素
        eventElement.addEventListener('mouseenter', mouseEnterHandler);
        eventElement.addEventListener('mouseleave', mouseLeaveHandler);
        
        // 保存处理器以便清理
        (eventElement as any)._mouseHandlers = {
          mouseEnterHandler,
          mouseLeaveHandler,
          event: matchedEvent
        };
        
        console.log(`事件 ${index} 绑定成功`);
      } else {
        console.warn(`事件 ${index} 未能匹配到事件数据`);
      }
    });
    
    console.log('鼠标事件绑定完成');
  }
  
  //MARK:清理事件鼠标处理器
  cleanupEventMouseHandlers(): void {
    const eventElements = document.querySelectorAll('.fc-event');
    eventElements.forEach((element) => {
      const eventElement = element as HTMLElement;
      const handlers = (eventElement as any)._mouseHandlers;
      if (handlers) {
        eventElement.removeEventListener('mouseenter', handlers.mouseEnterHandler);
        eventElement.removeEventListener('mouseleave', handlers.mouseLeaveHandler);
        delete (eventElement as any)._mouseHandlers;
      }
    });
  }

  //MARK:根据元素位置计算面板位置（直接使用元素绝对位置，简化逻辑）
  calculatePanelPositionByElement(element: HTMLElement): { top: string; left: string } | null {
    if (!element) return null;
    
    // 直接获取元素的绝对位置
    const elementRect = element.getBoundingClientRect();
    
    const panelWidth = 350; // 面板宽度
    const panelHeight = 300; // 预估面板高度（减少高度，避免空间不够时距离太远）
    const offset = 15; // 偏移量
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left: number;
    let top: number;
    
    // 判断元素在视口中的位置，决定面板显示在左边还是右边
    const spaceOnRight = viewportWidth - elementRect.right;
    const spaceOnLeft = elementRect.left;
    
    // 判断元素在视口中的位置（左侧、中间、右侧）
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const viewportCenterX = viewportWidth / 2;
    const isElementOnLeft = elementCenterX < viewportCenterX;
    
    console.log('空间计算 - 水平方向:', {
      '视口宽度': viewportWidth,
      '视口中心': viewportCenterX,
      '元素中心': elementCenterX,
      '元素位置': isElementOnLeft ? '左侧' : '右侧',
      '元素right': elementRect.right,
      '元素left': elementRect.left,
      '右边空间': spaceOnRight,
      '左边空间': spaceOnLeft,
      '需要空间': panelWidth + offset,
      '右边是否足够': spaceOnRight >= panelWidth + offset,
      '左边是否足够': spaceOnLeft >= panelWidth + offset
    });
    
    // 智能选择位置：
    // 1. 如果元素在左侧，优先显示在元素右边（如果空间足够）
    // 2. 如果元素在右侧，优先显示在元素左边（如果空间足够）
    // 3. 如果首选位置空间不够，则使用另一侧
    if (isElementOnLeft) {
      // 元素在左侧
      console.log('=== 左侧任务定位 ===');
      console.log('元素位置 - left:', elementRect.left, 'right:', elementRect.right);
      console.log('空间情况 - 右边:', spaceOnRight, '左边:', spaceOnLeft, '需要:', panelWidth + offset);
      
      if (spaceOnRight >= panelWidth + offset) {
        // 右边有足够空间，显示在右边（推荐）
        left = elementRect.right + offset;
        console.log('✅ 面板位置: 元素在左侧，显示在右边, left =', left, '计算:', elementRect.right, '+', offset);
      } else if (spaceOnLeft >= panelWidth + offset) {
        // 左边有足够空间，显示在左边（备选）
        left = elementRect.left - panelWidth - offset;
        console.log('⚠️ 面板位置: 元素在左侧，显示在左边（备选）, left =', left, '计算:', elementRect.left, '-', panelWidth, '-', offset);
      } else {
        // 两边空间都不够，选择空间更大的一边
        console.log('❌ 两边空间都不够，右边:', spaceOnRight, '左边:', spaceOnLeft);
        if (spaceOnRight > spaceOnLeft) {
          left = viewportWidth - panelWidth - 10;
          console.log('面板位置: 靠右（空间不足），left =', left);
        } else {
          left = 10;
          console.log('面板位置: 靠左（空间不足），left =', left);
        }
      }
      console.log('最终水平位置:', left);
      console.log('==================');
    } else {
      // 元素在右侧
      if (spaceOnLeft >= panelWidth + offset) {
        // 左边有足够空间，显示在左边（推荐）
        left = elementRect.left - panelWidth - offset;
        console.log('面板位置: 元素在右侧，显示在左边, left =', left);
      } else if (spaceOnRight >= panelWidth + offset) {
        // 右边有足够空间，显示在右边（备选）
        left = elementRect.right + offset;
        console.log('面板位置: 元素在右侧，显示在右边（备选）, left =', left);
      } else {
        // 两边空间都不够，选择空间更大的一边
        if (spaceOnLeft > spaceOnRight) {
          left = 10;
          console.log('面板位置: 靠左（空间不足），left =', left);
        } else {
          left = viewportWidth - panelWidth - 10;
          console.log('面板位置: 靠右（空间不足），left =', left);
        }
      }
    }
    
    // 垂直方向：优先显示在元素下方，如果空间不够则尽量靠近元素
    const spaceBelow = viewportHeight - elementRect.bottom;
    const spaceAbove = elementRect.top;
    
    console.log('空间计算 - 垂直方向:', {
      '视口高度': viewportHeight,
      '元素bottom': elementRect.bottom,
      '元素top': elementRect.top,
      '下方空间': spaceBelow,
      '上方空间': spaceAbove,
      '需要空间': panelHeight + offset,
      '下方是否足够': spaceBelow >= panelHeight + offset,
      '上方是否足够': spaceAbove >= panelHeight + offset
    });
    
    if (spaceBelow >= panelHeight + offset) {
      // 下方有足够空间，显示在下方
      top = elementRect.bottom + offset;
      console.log('面板位置: 下方, top =', top);
    } else if (spaceAbove >= panelHeight + offset) {
      // 上方有足够空间，显示在上方
      top = elementRect.top - panelHeight - offset;
      console.log('面板位置: 上方, top =', top);
    } else {
      // 上下空间都不够，使用更智能的策略：尽量靠近元素
      if (spaceBelow >= spaceAbove) {
        // 下方空间更大，优先尝试下方
        // 尽量从元素下方开始，但确保不超出视口
        const preferredTop = elementRect.bottom + offset;
        if (preferredTop + panelHeight <= viewportHeight) {
          // 可以直接放在下方，不会超出
          top = preferredTop;
          console.log('面板位置: 下方（空间不足，但可完整显示）, top =', top);
        } else {
          // 会超出视口，使用更智能的策略：尽量让面板与元素底部对齐
          // 优先尝试：让面板顶部对齐到元素底部
          const alignToElementBottom = elementRect.bottom + offset;
          const maxTop = viewportHeight - panelHeight - 10;
          
          if (alignToElementBottom + panelHeight <= viewportHeight) {
            // 从元素底部开始可以完整显示
            top = alignToElementBottom;
            console.log('面板位置: 下方（顶部对齐元素底部）, top =', top);
          } else {
            // 不能完整显示，但尽量靠近元素
            // 计算能显示的最大高度
            const maxAvailableHeight = viewportHeight - alignToElementBottom - 10;
            if (maxAvailableHeight > 100) {
              // 如果至少有100px空间，让面板尽可能高，顶部对齐到元素底部
              top = alignToElementBottom;
              console.log('面板位置: 下方（自适应，尽量靠近元素）, top =', top, '可用高度:', maxAvailableHeight);
            } else {
              // 空间太小，对齐到视口底部
              top = maxTop;
              console.log('面板位置: 视口底部（空间太小）, top =', top);
            }
          }
        }
      } else {
        // 上方空间更大，优先尝试上方
        // 尽量从元素上方开始，但确保不超出视口
        const preferredTop = elementRect.top - panelHeight - offset;
        if (preferredTop >= 10) {
          // 可以直接放在上方，不会超出
          top = preferredTop;
          console.log('面板位置: 上方（空间不足，但可完整显示）, top =', top);
        } else {
          // 会超出视口，使用更智能的策略：尽量让面板与元素顶部对齐
          // 优先尝试：让面板底部对齐到元素顶部
          const alignToElementTop = elementRect.top - panelHeight;
          if (alignToElementTop >= 10) {
            top = alignToElementTop;
            console.log('面板位置: 上方（底部对齐元素顶部）, top =', top);
          } else {
            // 如果还是不行，尽量靠近元素，但至少保留一些间距
            // 计算能显示的最大高度，然后尽量靠近元素
            const maxAvailableHeight = elementRect.top - 10;
            if (maxAvailableHeight > 100) {
              // 如果至少有100px空间，让面板尽可能高，但顶部对齐到元素
              top = elementRect.top - Math.min(panelHeight, maxAvailableHeight);
              console.log('面板位置: 上方（自适应高度，尽量靠近元素）, top =', top, '可用高度:', maxAvailableHeight);
            } else {
              // 空间太小，放在视口顶部
              top = 10;
              console.log('面板位置: 视口顶部（空间太小）, top =', top);
            }
          }
        }
      }
    }
    
    // 确保不超出视口边界（最终检查）
    const originalLeft = left;
    const originalTop = top;
    if (left < 0) left = 10;
    if (left + panelWidth > viewportWidth) left = viewportWidth - panelWidth - 10;
    if (top < 0) top = 10;
    if (top + panelHeight > viewportHeight) top = viewportHeight - panelHeight - 10;
    
    if (originalLeft !== left || originalTop !== top) {
      console.log('位置调整 - 超出边界:', {
        '原始left': originalLeft,
        '调整后left': left,
        '原始top': originalTop,
        '调整后top': top
      });
    }
    
    const finalPosition = {
      left: `${left}px`,
      top: `${top}px`
    };
    
    console.log('最终面板位置:', finalPosition);
    
    // 直接使用计算出的绝对位置（因为面板使用position: fixed）
    return finalPosition;
  }
  
  //MARK:根据元素位置更新面板位置（保持向后兼容）
  updatePanelPositionByElement(element: HTMLElement): void {
    const position = this.calculatePanelPositionByElement(element);
    if (position) {
      this.panelPosition = position;
    }
  }
  
  //MARK:根据Rect计算面板位置（备用方案）- 返回位置对象，不直接更新
  calculatePanelPositionByRect(rect: DOMRect): { top: string; left: string } {
    const offset = 15;
    const panelWidth = 350;
    const panelHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = rect.right + offset;
    let top = rect.top + offset;
    
    // 如果右边空间不够，显示在左边
    if (left + panelWidth > viewportWidth) {
      left = rect.left - panelWidth - offset;
    }
    
    // 如果下边空间不够，显示在上边
    if (top + panelHeight > viewportHeight) {
      top = rect.bottom - panelHeight - offset;
    }
    
    // 确保不超出边界
    if (left < 0) left = offset;
    if (top < 0) top = offset;
    
    return {
      left: `${left}px`,
      top: `${top}px`
    };
  }
  
  //MARK:根据Rect更新面板位置（保持向后兼容）
  updatePanelPositionByRect(rect: DOMRect): void {
    this.panelPosition = this.calculatePanelPositionByRect(rect);
  }
  
  //MARK:根据鼠标事件计算面板位置（备用方案）- 返回位置对象，不直接更新
  calculatePanelPositionByMouseEvent(event: MouseEvent): { top: string; left: string } | null {
    if (!event) {
      return null;
    }
    
    const rect = {
      left: event.pageX,
      top: event.pageY,
      right: event.pageX,
      bottom: event.pageY,
      width: 0,
      height: 0
    } as DOMRect;
    
    return this.calculatePanelPositionByRect(rect);
  }
  
  //MARK:更新面板位置（使用鼠标事件，备用方案）
  updatePanelPosition(event: MouseEvent) {
    const position = this.calculatePanelPositionByMouseEvent(event);
    if (position) {
      this.panelPosition = position;
    }
  }
  
  //MARK:鼠标进入面板
  handlePanelMouseEnter() {
    // 清除隐藏定时器
    if (this.hidePanelTimeout) {
      clearTimeout(this.hidePanelTimeout);
      this.hidePanelTimeout = undefined;
    }
  }
  
  //MARK:鼠标离开面板
  handlePanelMouseLeave() {
    // 延迟隐藏面板
    this.hidePanelTimeout = window.setTimeout(() => {
      this.showTaskPanel = false;
      this.currentTaskData = null;
    }, 200);
  }
  
  //MARK:处理任务
  handleCompleteTask() {
    if (!this.currentTaskData) return;
    
    this.panelProcessing = true;
    
    // 模拟异步操作
    setTimeout(() => {
      // 更新任务数据
      this.currentTaskData!.isCompleted = true;
      
      // 设置处理时间和处理人
      const now = new Date();
      this.currentTaskData!.processedTime = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      this.currentTaskData!.processedBy = '张三'; // 演示用的处理人
      
      this.panelProcessing = false;
      
      // 更新日历中的事件
      this.updateCalendarEvent(this.currentTaskData!);
    }, 500);
  }
  
  //MARK:更新日历事件
  private updateCalendarEvent(updatedData: TaskDetailData) {
    if (!updatedData.taskId) return;
    
    // 查找并更新 calendarEvents
    const index = this.calendarEvents.findIndex((e: any) => {
      const eTaskId = e.id || (e.extendedProps as any)?.taskId;
      return eTaskId === updatedData.taskId;
    });
    
    if (index !== -1) {
      const originalEvent = this.calendarEvents[index] as any;
      if (originalEvent.extendedProps) {
        originalEvent.extendedProps = {
          ...originalEvent.extendedProps,
          isCompleted: true,
          processedTime: updatedData.processedTime,
          processedBy: updatedData.processedBy
        };
        originalEvent.color = this.getTaskColor(originalEvent.extendedProps.taskType, true);
      }
    }
    
    // 使用 FullCalendar API 更新事件
    const api = this.calendarComponent?.getApi();
    if (api) {
      const event = api.getEventById(updatedData.taskId);
      if (event) {
        const extendedProps = event.extendedProps as any;
        event.setProp('color', this.getTaskColor(extendedProps.taskType, true));
        event.setExtendedProp('isCompleted', true);
        event.setExtendedProp('processedTime', updatedData.processedTime);
        event.setExtendedProp('processedBy', updatedData.processedBy);
      }
      
      // 重新渲染
      api.render();
      
      // 重新初始化 tooltip
      setTimeout(() => {
        this.initTooltips();
      }, 100);
    }
  }

  // 清理面板定时器
  ngOnDestroy() {
    if (this.hidePanelTimeout) {
      clearTimeout(this.hidePanelTimeout);
    }
    
    // 移除事件监听
    window.removeEventListener('resize', this.updateCalendarSize);
    
    // 断开 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 清理 tooltip
    this.cleanupTooltips();
    
    // 清理鼠标事件处理器
    this.cleanupEventMouseHandlers();
    
    // 移除全局 tooltip 元素
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }
  }
  
  // 更新任务完成后的状态（已废弃，保留以防其他地方调用）
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

