// lib/dayjs.ts
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 全局配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 导出配置好的实例
export default dayjs;