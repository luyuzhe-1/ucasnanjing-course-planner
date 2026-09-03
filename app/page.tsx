'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarDays, Check, ChevronDown, Clock3, Download, ListChecks, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import data from './data/courses.json';

type Meeting = { name: string; day: string; dayIndex: number; periods: number[]; weekSpec: string; weeks: number[]; room: string; semester: Semester; reference: boolean; source: string };
type Semester = '秋' | '春';
type Course = { id: string; name: string; englishName: string; code: string; school: string; discipline: string; type: string; level: string; hours: string; credits: string; note: string; limit: string; enrolled: string; teachingMethod: string; examMethod: string; chiefProfessor: string; teacher: string; plannedTerm: string; semesters: Semester[]; scheduleStatus: string; meetings: Meeting[] };

const courses = data.courses as Course[];
const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const periodTimes = data.meta.periodTimes as Record<string, string>;
const palette = [
  { bg: '#e7efff', border: '#9db9f4', ink: '#27457a' },
  { bg: '#e5f4ee', border: '#91c9b2', ink: '#205f4a' },
  { bg: '#fff0d8', border: '#e7bd78', ink: '#765019' },
  { bg: '#f0e9fb', border: '#b8a0de', ink: '#563f79' },
  { bg: '#ffe8e1', border: '#e8a491', ink: '#813d2d' },
];

const courseKey = (course: Course) => `${course.id}-${course.name}`;
const selectionKey = (course: Course, semester: Semester) => `${semester}:${courseKey(course)}`;
const meetingsConflict = (a: Meeting, b: Meeting) => a.dayIndex === b.dayIndex && a.periods.some((period) => b.periods.includes(period)) && a.weeks.some((week) => b.weeks.includes(week));
const meetingsForSemester = (course: Course, semester: Semester) => course.meetings.filter((meeting) => meeting.semester === semester);
const coursesConflict = (a: Course, b: Course, semester: Semester) => meetingsForSemester(a, semester).some((first) => meetingsForSemester(b, semester).some((second) => meetingsConflict(first, second)));
function meetingSummary(meeting: Meeting) {
  const start = Math.min(...meeting.periods), end = Math.max(...meeting.periods);
  return `${meeting.day} 第${start}${start === end ? '' : `–${end}`}节 · ${meeting.weekSpec} · ${meeting.room}`;
}
function meetingExportSummary(meeting: Meeting) {
  const start = Math.min(...meeting.periods), end = Math.max(...meeting.periods);
  return `${meeting.day} 第${start}${start === end ? '' : `–${end}`}节（${meeting.weekSpec}）`;
}
function courseLimitLabel(course: Course) {
  if (!course.limit) return '暂未公布';
  return course.limit === '0' ? '未设限（表中为 0）' : `${course.limit} 人`;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [school, setSchool] = useState('全部开课单位');
  const [type, setType] = useState('全部课程属性');
  const [level, setLevel] = useState('全部培养层次');
  const [semester, setSemester] = useState<Semester>('秋');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [week, setWeek] = useState(2);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('nanjing-course-plan');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        setSelectedKeys(parsed.map((key) => key.startsWith('秋:') || key.startsWith('春:') ? key : `秋:${key}`));
      }
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem('nanjing-course-plan', JSON.stringify(selectedKeys)); }, [selectedKeys, hydrated]);

  const schools = useMemo(() => ['全部开课单位', ...Array.from(new Set(courses.map((course) => course.school))).sort()], []);
  const types = useMemo(() => ['全部课程属性', ...Array.from(new Set(courses.map((course) => course.type))).sort()], []);
  const levels = useMemo(() => ['全部培养层次', ...Array.from(new Set(courses.map((course) => course.level))).sort()], []);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      const haystack = [course.name, course.englishName, course.code, course.school, course.discipline, course.type, course.teacher, course.examMethod].join(' ').toLowerCase();
      return course.semesters.includes(semester) && (!needle || haystack.includes(needle)) && (school === '全部开课单位' || course.school === school) && (type === '全部课程属性' || course.type === type) && (level === '全部培养层次' || course.level === level);
    });
  }, [query, school, type, level, semester]);
  const selectedBySemester = useMemo(() => ({
    秋: courses.filter((course) => selectedKeys.includes(selectionKey(course, '秋'))),
    春: courses.filter((course) => selectedKeys.includes(selectionKey(course, '春'))),
  }), [selectedKeys]);
  const selected = selectedBySemester[semester];
  const allSelected = useMemo(() => (['秋', '春'] as Semester[]).flatMap((term) => selectedBySemester[term].map((course) => ({ course, semester: term }))), [selectedBySemester]);
  const conflictKeys = useMemo(() => {
    const result = new Set<string>();
    (['秋', '春'] as Semester[]).forEach((term) => {
      const termCourses = selectedBySemester[term];
      for (let i = 0; i < termCourses.length; i += 1) for (let j = i + 1; j < termCourses.length; j += 1) if (coursesConflict(termCourses[i], termCourses[j], term)) { result.add(selectionKey(termCourses[i], term)); result.add(selectionKey(termCourses[j], term)); }
    });
    return result;
  }, [selectedBySemester]);
  const creditsBySemester = useMemo(() => ({
    秋: selectedBySemester.秋.reduce((sum, course) => sum + (Number.parseFloat(course.credits) || 0), 0),
    春: selectedBySemester.春.reduce((sum, course) => sum + (Number.parseFloat(course.credits) || 0), 0),
  }), [selectedBySemester]);
  const totalCredits = creditsBySemester.秋 + creditsBySemester.春;
  const scheduledSelectedCount = selected.filter((course) => meetingsForSemester(course, semester).length > 0).length;
  const activeConflictCount = selected.filter((course) => conflictKeys.has(selectionKey(course, semester))).length;
  const visibleMeetings = useMemo(() => selected.flatMap((course, courseIndex) => meetingsForSemester(course, semester).filter((meeting) => meeting.weeks.includes(week)).map((meeting) => ({ course, meeting, courseIndex }))), [selected, semester, week]);

  function changeSemester(nextSemester: Semester) {
    setSemester(nextSemester);
    setWeek(nextSemester === '秋' ? 2 : 1);
    setExpanded(null);
    setNotice('');
  }
  function toggleCourse(course: Course, targetSemester = semester) {
    const key = selectionKey(course, targetSemester);
    if (selectedKeys.includes(key)) {
      setSelectedKeys((current) => current.filter((item) => item !== key));
      setNotice(`已移除「${course.name}」`);
      return;
    }
    const clashes = meetingsForSemester(course, targetSemester).length ? selectedBySemester[targetSemester].filter((item) => coursesConflict(course, item, targetSemester)) : [];
    setSelectedKeys((current) => [...current, key]);
    setNotice(clashes.length ? `注意：「${course.name}」与 ${clashes.map((item) => `「${item.name}」`).join('、')} 时间冲突` : `已加入「${course.name}」`);
  }
  function resetFilters() { setQuery(''); setSchool('全部开课单位'); setType('全部课程属性'); setLevel('全部培养层次'); }
  function exportSelectedCourses() {
    if (allSelected.length === 0) {
      setNotice('请先选择课程，再导出 Markdown 文件');
      return;
    }
    const markdown = [
      '# 2026–2027学年我的已选课程',
      '',
      `> 秋季 ${creditsBySemester.秋.toFixed(1)} 学分 · 春季 ${creditsBySemester.春.toFixed(1)} 学分 · 全学年合计 ${totalCredits.toFixed(1)} 学分`,
      '',
      ...(['秋', '春'] as Semester[]).flatMap((term) => [
        `## ${term}季学期（${creditsBySemester[term].toFixed(1)} 学分）`,
        '',
        ...selectedBySemester[term].flatMap((course, index) => [
        `### ${index + 1}. ${course.name}`,
        '',
        `- 课程代码：${course.code}`,
        `- 课程种类：${course.type}`,
        `- 学分：${course.credits}`,
        `- 上课时间：${meetingsForSemester(course, term).length ? meetingsForSemester(course, term).map(meetingExportSummary).join('；') : '暂无上一学年对应课程时间'}`,
        `- 时间性质：${term === '春' && meetingsForSemester(course, term).length ? '参考2025–2026春季课表，并非本学年正式排课' : '2026–2027学年正式排课'}`,
        `- 限选：${courseLimitLabel(course)}`,
        `- 教师：${course.teacher || '未提供'}`,
        `- 考试方式：${course.examMethod || '未提供'}`,
        '',
        ]),
      ]),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${markdown}`], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '我的已选课程.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice(`已导出 ${allSelected.length} 门课程的双学期计划`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><CalendarDays /></div>
        <div><p className="eyebrow">国科大南京学院 · 2026–2027 学年</p><h1>我的双学期选课拼图</h1></div>
        <div className="header-summary" aria-label="选课概览">
          <div className={creditsBySemester.秋 >= 10 ? 'summary-safe' : 'summary-progress'}><span>{creditsBySemester.秋.toFixed(1)} / 10</span><small>秋季最低学分</small></div>
          <div className={creditsBySemester.春 >= 10 ? 'summary-safe' : 'summary-progress'}><span>{creditsBySemester.春.toFixed(1)} / 10</span><small>春季最低学分</small></div>
          <div><span>{totalCredits.toFixed(1)}</span><small>全学年已选学分</small></div>
        </div>
      </header>

      <div className="workspace">
        <aside className="catalog-panel">
          <nav className="semester-switch" aria-label="选择学期">
            {(['秋', '春'] as Semester[]).map((term) => <button key={term} className={semester === term ? 'is-active' : ''} onClick={() => changeSemester(term)}><span>{term}季学期</span><small>{creditsBySemester[term].toFixed(1)} 学分 · {creditsBySemester[term] >= 10 ? '已达最低要求' : `还差 ${(10 - creditsBySemester[term]).toFixed(1)} 分`}</small></button>)}
          </nav>
          <div className="panel-heading"><div><p className="section-kicker">课程目录</p><h2>找到想选的课</h2></div><Badge variant="secondary">{filtered.length} 门</Badge></div>
          <div className="search-wrap"><Search aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程名、编码、学科或教师" aria-label="搜索课程" />{query && <button className="clear-search" onClick={() => setQuery('')} aria-label="清空搜索"><X /></button>}</div>
          <div className="filter-grid">
            <label><span>开课单位</span><select value={school} onChange={(event) => setSchool(event.target.value)}>{schools.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown /></label>
            <label><span>课程属性</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown /></label>
            <label><span>培养层次</span><select value={level} onChange={(event) => setLevel(event.target.value)}>{levels.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown /></label>
            <Button variant="outline" size="lg" onClick={resetFilters}><RotateCcw /> 重置</Button>
          </div>
          <div className="catalog-list">
            {filtered.length === 0 ? <div className="empty-state"><SlidersHorizontal /><strong>没有找到相符课程</strong><span>试试缩短关键词或重置筛选条件</span></div> : filtered.map((course) => {
              const key = selectionKey(course, semester), checked = selectedKeys.includes(key), hasConflict = conflictKeys.has(key);
              const semesterMeetings = meetingsForSemester(course, semester);
              return <article key={key} className={`course-card ${checked ? 'is-selected' : ''} ${hasConflict ? 'has-conflict' : ''}`}>
                <div className="course-card-main"><Checkbox checked={checked} onCheckedChange={() => toggleCourse(course)} aria-label={`${checked ? '取消' : '选择'}${course.name}`} />
                  <button className="course-copy" onClick={() => setExpanded(expanded === key ? null : key)}>
                    <span className="course-title-row"><strong>{course.name}</strong>{hasConflict && <Badge variant="destructive"><AlertTriangle />冲突</Badge>}</span>
                    <span className="course-meta">{course.code} · {course.credits} 学分 · {course.type}</span>
                    <span className="course-time"><Clock3 />{semesterMeetings.length ? semesterMeetings.map(meetingSummary).join('；') : `${semester}季暂无可参考时间`}</span>
                    {semester === '春' && semesterMeetings.length > 0 && <span className="reference-label">参考 2025–2026 春季课表</span>}
                  </button>
                </div>
                {expanded === key && <div className="course-details"><div><span>开课单位</span><b>{course.school}</b></div><div><span>所属学科</span><b>{course.discipline}</b></div><div><span>培养层次</span><b>{course.level}</b></div><div><span>学时</span><b>{course.hours || '—'}</b></div><div><span>限选人数</span><b>{courseLimitLabel(course)}</b></div><div><span>授课教师</span><b>{course.teacher || '未提供'}</b></div><div><span>考试方式</span><b>{course.examMethod || '未提供'}</b></div><div><span>授课方式</span><b>{course.teachingMethod || '未提供'}</b></div>{course.note && <p><Sparkles />{course.note}</p>}</div>}
              </article>;
            })}
          </div>
        </aside>

        <section className="schedule-panel">
          <div className="schedule-toolbar"><div><p className="section-kicker">{semester}季学期 · 周视图</p><h2>课程时间分布</h2></div><div className="schedule-actions">
            <Sheet>
              <SheetTrigger render={<Button variant="outline" className="manage-button" />}><ListChecks />管理已选<span className="manage-count">{allSelected.length}</span></SheetTrigger>
              <SheetContent className="selected-sheet">
                <SheetHeader className="selected-sheet-header">
                  <p className="section-kicker">集中管理</p>
                  <SheetTitle>全部已选课程</SheetTitle>
                  <SheetDescription>{allSelected.length ? `秋季 ${creditsBySemester.秋.toFixed(1)} 分，春季 ${creditsBySemester.春.toFixed(1)} 分，全学年共 ${totalCredits.toFixed(1)} 分。` : '还没有选择课程，可以从左侧课程目录添加。'}</SheetDescription>
                </SheetHeader>
                <div className="selected-course-list">
                  {allSelected.length === 0 ? <div className="selected-empty"><BookOpen /><strong>暂无已选课程</strong><span>关闭面板后，从课程目录勾选想上的课。</span></div> : allSelected.map(({ course, semester: courseSemester }, index) => {
                    const hasConflict = conflictKeys.has(selectionKey(course, courseSemester));
                    const semesterMeetings = meetingsForSemester(course, courseSemester);
                    return <article key={selectionKey(course, courseSemester)} className={`selected-course-card ${hasConflict ? 'has-conflict' : ''}`}>
                      <div className="selected-course-number">{index + 1}</div>
                      <div className="selected-course-copy">
                        <div className="selected-course-title"><strong>{course.name}</strong><Badge variant="secondary">{courseSemester}季</Badge>{hasConflict && <Badge variant="destructive"><AlertTriangle />冲突</Badge>}</div>
                        <span>{course.code} · {course.credits} 学分 · {course.type}</span>
                        <p><Clock3 />{semesterMeetings.length ? semesterMeetings.map(meetingExportSummary).join('；') : '暂无上一学年对应课程时间'}</p>
                        {courseSemester === '春' && semesterMeetings.length > 0 && <small className="reference-note">参考 2025–2026 春季课表</small>}
                        <small>{course.teacher || '教师未提供'} · {course.examMethod || '考试方式未提供'}</small>
                      </div>
                      <Button variant="destructive" size="icon-sm" className="remove-selected" onClick={() => toggleCourse(course, courseSemester)} aria-label={`删除${course.name}`} title={`删除${course.name}`}><Trash2 /></Button>
                    </article>;
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <Button className="export-button" onClick={exportSelectedCourses} disabled={allSelected.length === 0}><Download />导出 Markdown</Button><div className="week-picker"><label htmlFor="week">查看周次</label><button onClick={() => setWeek((value) => Math.max(1, value - 1))} aria-label="上一周">−</button><select id="week" value={week} onChange={(event) => setWeek(Number(event.target.value))}>{Array.from({ length: 20 }, (_, index) => index + 1).map((item) => <option key={item} value={item}>第 {item} 周</option>)}</select><button onClick={() => setWeek((value) => Math.min(20, value + 1))} aria-label="下一周">＋</button></div>
          </div></div>
          {notice && <div className={`notice ${notice.startsWith('注意') ? 'notice-danger' : 'notice-success'}`} role="status">{notice.startsWith('注意') ? <AlertTriangle /> : <Check />}<span>{notice}</span><button onClick={() => setNotice('')} aria-label="关闭提示"><X /></button></div>}
          {activeConflictCount > 0 && <div className="conflict-banner"><AlertTriangle /><div><strong>{semester}季检测到时间重叠</strong><span>红色课程在至少一个相同周次、星期和节次上相遇；{semester === '春' ? '结果依据上一学年参考时间。' : '请调整选择。'}</span></div></div>}
          <div className="timetable-scroll"><div className="timetable" aria-label={`第${week}周课表`}>
            <div className="corner-cell">节次</div>
            {days.map((day, index) => <div key={day} className={`day-head ${index > 4 ? 'weekend' : ''}`} style={{ gridColumn: index + 2 }}><span>{day}</span><small>{index > 4 ? '周末' : '工作日'}</small></div>)}
            {Array.from({ length: 13 }, (_, index) => index + 1).map((period) => <div key={`time-${period}`} className={`time-cell ${period === 5 || period === 10 ? 'new-session' : ''}`} style={{ gridRow: period + 1 }}><strong>{period}</strong><span>{periodTimes[String(period)]}</span></div>)}
            {days.flatMap((day, dayIndex) => Array.from({ length: 13 }, (_, index) => index + 1).map((period) => <div key={`${day}-${period}`} className={`grid-cell ${period === 5 || period === 10 ? 'new-session' : ''}`} style={{ gridColumn: dayIndex + 2, gridRow: period + 1 }} />))}
            {visibleMeetings.map(({ course, meeting, courseIndex }, index) => {
              const first = Math.min(...meeting.periods), last = Math.max(...meeting.periods), conflict = conflictKeys.has(selectionKey(course, semester)), color = palette[courseIndex % palette.length];
              return <article key={`${courseKey(course)}-${meeting.day}-${meeting.weekSpec}-${index}`} className={`schedule-event ${conflict ? 'event-conflict' : ''} ${meeting.reference ? 'event-reference' : ''}`} style={{ gridColumn: meeting.dayIndex + 1, gridRow: `${first + 1} / ${last + 2}`, background: conflict ? '#fff0ed' : color.bg, borderColor: conflict ? '#e46e57' : color.border, color: conflict ? '#8d2f20' : color.ink }} title={`${course.name}｜${meetingSummary(meeting)}${meeting.reference ? '｜参考2025–2026春季课表' : ''}`}><strong>{course.name}</strong><span><MapPin />{meeting.room}</span><small>{meeting.reference ? '参考上学年 · ' : ''}{meeting.weekSpec}</small></article>;
            })}
            {selected.length === 0 && <div className="schedule-empty"><BookOpen /><strong>{semester}季还没有选课</strong><span>从左侧勾选课程，学分会计入本学期。</span></div>}
            {selected.length > 0 && scheduledSelectedCount === 0 && <div className="schedule-empty"><CalendarDays /><strong>{semester}季暂无可参考时间</strong><span>上一学年没有找到对应课程，仍可先加入学分规划。</span></div>}
            {scheduledSelectedCount > 0 && visibleMeetings.length === 0 && <div className="schedule-empty"><CalendarDays /><strong>第 {week} 周没有已选课程</strong><span>切换周次可查看其它课程安排。</span></div>}
          </div></div>
          <footer className="schedule-footer"><span>{semester === '春' ? '春季时间参考：2025–2026学年课表（非本学年正式排课）' : '秋季时间：2026–2027学年正式课表'}</span><span>选择结果保存在当前浏览器</span></footer>
        </section>
      </div>
    </main>
  );
}
