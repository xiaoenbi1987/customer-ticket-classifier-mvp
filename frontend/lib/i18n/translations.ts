export const translations = {
  zh: {
    "page.title": "客服工单智能分类系统",
    "page.subtitle": "按优先级排序的工单列表，支持确认或人工调整建议优先级",

    "common.loading": "加载中...",
    "common.noData": "暂无数据",

    "stats.total": "工单总数",
    "stats.processed": "已处理",
    "stats.pending": "待处理",
    "stats.avgHandlingTime": "平均处理时长",
    "stats.hoursUnit": "小时",

    "table.priority": "优先级",
    "table.content": "工单内容",
    "table.customer": "客户",
    "table.reason": "评分理由",
    "table.decisionStatus": "决策状态",
    "table.actions": "操作",
    "table.empty": "暂无工单数据",

    "priority.low": "低",
    "priority.medium": "中",
    "priority.high": "高",
    "priority.urgent": "紧急",
    "priority.unscored": "未评分",

    "status.pending": "待决策",
    "status.confirmed": "已确认",
    "status.adjusted": "已调整",

    "actions.confirm": "确认",
    "actions.adjust": "调整",
    "actions.confirmDisabledChanged": "已选择与建议不同的优先级，请点「调整」提交；如需认可建议值，请把下拉框改回建议优先级",
    "actions.confirmDisabledDecided": "该工单已完成决策，如需修改请在下拉框选择不同的优先级后点「调整」",
    "actions.adjustDisabledSame": "下拉框当前就是系统建议的优先级，请点「确认」提交；「调整」只用于提交与建议不同的优先级",
    "actions.bothDisabledSame": "该工单已完成决策，且下拉框当前是系统建议值。如需再次修改，请先在下拉框选择一个不同的优先级",

    "errors.loadFailed": "加载失败，请确认后端服务是否已启动",
    "errors.confirmFailed": "确认失败",
    "errors.adjustFailed": "调整失败",

    "rule.keywordSingle": "含{groups}关键词",
    "rule.keywordCombo": "含{groups}等多重关键词组合，历史平均处理耗时更长",
    "rule.highTierCustomer": "客户为{plan}高付费套餐，需优先响应",
    "rule.repeatCustomer": "该客户{days}天内已提交{count}次工单，存在反复问题风险",
    "rule.noRulesMatched": "常规工单，未命中高优先级规则",

    "rule.group.billing": "扣费异常",
    "rule.group.login": "登录失败",
    "rule.group.refund": "退款",
  },
  en: {
    "page.title": "Customer Ticket Intelligent Classification System",
    "page.subtitle":
      "Tickets sorted by priority — confirm or manually adjust the suggested priority",

    "common.loading": "Loading...",
    "common.noData": "No data",

    "stats.total": "Total Tickets",
    "stats.processed": "Processed",
    "stats.pending": "Pending",
    "stats.avgHandlingTime": "Avg. Handling Time",
    "stats.hoursUnit": "hrs",

    "table.priority": "Priority",
    "table.content": "Ticket Content",
    "table.customer": "Customer",
    "table.reason": "Reason",
    "table.decisionStatus": "Decision Status",
    "table.actions": "Actions",
    "table.empty": "No tickets",

    "priority.low": "Low",
    "priority.medium": "Medium",
    "priority.high": "High",
    "priority.urgent": "Urgent",
    "priority.unscored": "Unscored",

    "status.pending": "Pending",
    "status.confirmed": "Confirmed",
    "status.adjusted": "Adjusted",

    "actions.confirm": "Confirm",
    "actions.adjust": "Adjust",
    "actions.confirmDisabledChanged":
      "You picked a priority different from the suggestion — submit it with “Adjust”. To accept the suggestion instead, set the dropdown back to the suggested priority.",
    "actions.confirmDisabledDecided":
      "This ticket has already been decided. To change it, pick a different priority and use “Adjust”.",
    "actions.adjustDisabledSame":
      "The dropdown still shows the suggested priority — use “Confirm”. “Adjust” is only for submitting a priority that differs from the suggestion.",
    "actions.bothDisabledSame":
      "This ticket has already been decided and the dropdown currently shows the suggested priority. To change it again, pick a different priority first.",

    "errors.loadFailed": "Failed to load. Please check that the backend service is running.",
    "errors.confirmFailed": "Confirm failed",
    "errors.adjustFailed": "Adjust failed",

    "rule.keywordSingle": "Contains {groups} keyword",
    "rule.keywordCombo":
      "Contains {groups} and other multiple keyword combinations — historically longer resolution time",
    "rule.highTierCustomer": "Customer is on the {plan} high-tier plan, requires priority response",
    "rule.repeatCustomer":
      "This customer has submitted {count} tickets in the last {days} days — risk of a recurring issue",
    "rule.noRulesMatched": "Routine ticket — no high-priority rules triggered",

    "rule.group.billing": "Billing Anomaly",
    "rule.group.login": "Login Failure",
    "rule.group.refund": "Refund Request",
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;
