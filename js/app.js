/**
 * app.js — Main application logic
 * Student Attendance Management System
 * University of Makeni — Group 14, CS Year 3
 */

/* ============================================================
   AUTH
   ============================================================ */
const CREDS = { user: 'Lecturer', pass: 'admin123' };
let pendingAtt = {};

function doLogin() {
    const u = document.getElementById('uname').value.trim();
    const p = document.getElementById('upass').value;
    const err = document.getElementById('login-err');
    if (u === CREDS.user && p === CREDS.pass) {
        document.getElementById('login-page').classList.remove('active');
        const shell = document.getElementById('app-shell');
        shell.classList.add('active');
        shell.style.display = 'flex';
        document.getElementById('login-page').style.display = 'none';
        // Save session to localStorage
        localStorage.setItem('ams_session', JSON.stringify({ user: u, timestamp: Date.now() }));
        initApp();
    } else {
        err.style.display = 'block';
        setTimeout(() => { err.style.display = 'none'; }, 3000);
    }
}

document.getElementById('upass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
});

function doLogout() {
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('app-shell').classList.remove('active');
    const lp = document.getElementById('login-page');
    lp.style.display = '';
    lp.classList.add('active');
    document.getElementById('uname').value = '';
    document.getElementById('upass').value = '';
    // Clear session from localStorage
    localStorage.removeItem('ams_session');
}

// Restore session on page load
function restoreSession() {
    const session = JSON.parse(localStorage.getItem('ams_session') || 'null');
    if (session) {
        document.getElementById('login-page').classList.remove('active');
        const shell = document.getElementById('app-shell');
        shell.classList.add('active');
        shell.style.display = 'flex';
        document.getElementById('login-page').style.display = 'none';
        initApp();
    }
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function showSection(el, id) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('sec-' + id).classList.add('active');
    const renders = { dashboard: renderDashboard, attendance: renderAttendance, reports: renderReports, students: renderStudents, courses: renderCourses };
    if (renders[id]) renders[id]();
}

/* ============================================================
   INIT
   ============================================================ */
function initApp() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('att-date').value = today;
    populateCourseDropdowns();
    renderDashboard();
    renderStudents();
    renderCourses();
}

function populateCourseDropdowns() {
    ['s-course', 'att-course', 'r-course'].forEach(id => {
        const sel = document.getElementById(id);
        const cur = sel.value;
        while (sel.options.length > 1) sel.remove(1);
        db.courses.forEach(c => sel.add(new Option(c.name, c.name)));
        if (cur) sel.value = cur;
    });
}

/* ============================================================
   UTILITIES
   ============================================================ */
function toast(msg, dur = 2200) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), dur);
}

function initials(name) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
    const total = db.students.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecs = db.attendance.filter(r => r.date === todayStr);
    const present = todayRecs.filter(r => r.status === 'Present').length;
    const absent = todayRecs.filter(r => r.status === 'Absent').length;
    const late = todayRecs.filter(r => r.status === 'Late').length;

    document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card blue"><div class="label">Total students</div><div class="value">${total}</div><div class="sub">Registered</div></div>
    <div class="stat-card green"><div class="label">Present today</div><div class="value">${present}</div><div class="sub">Marked present</div></div>
    <div class="stat-card red"><div class="label">Absent today</div><div class="value">${absent}</div><div class="sub">Marked absent</div></div>
    <div class="stat-card amber"><div class="label">Late today</div><div class="value">${late}</div><div class="sub">Marked late</div></div>
  `;

    const recent = db.attendance.slice(-20).reverse();
    if (!recent.length) {
        document.getElementById('recent-table-wrap').innerHTML = '<div class="empty"><i class="ti ti-calendar-off"></i>No attendance records yet.</div>';
        return;
    }
    const rows = recent.map(r => {
        const s = db.students.find(x => x.id === r.studentId);
        return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(s ? s.name : '??')}</div><span>${s ? s.name : 'Unknown'}</span></div></td>
      <td style="color:var(--muted)">${r.course || '—'}</td>
      <td>${r.date}</td>
      <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
    </tr>`;
    }).join('');
    document.getElementById('recent-table-wrap').innerHTML = `
    <table><thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   STUDENTS
   ============================================================ */
function addStudent() {
    const id = document.getElementById('s-id').value.trim();
    const name = document.getElementById('s-name').value.trim();
    const course = document.getElementById('s-course').value;
    const level = document.getElementById('s-level').value;
    if (!id || !name) { toast('Please fill in Student ID and Name.'); return; }
    if (db.students.find(s => s.id === id)) { toast('Student ID already exists.'); return; }
    db.students.push({ id, name, course, level });
    saveDB();
    document.getElementById('s-id').value = '';
    document.getElementById('s-name').value = '';
    renderStudents();
    renderDashboard();
    toast('Student added successfully.');
}

function deleteStudent(id) {
    if (!confirm('Delete this student and all their attendance records?')) return;
    db.students = db.students.filter(s => s.id !== id);
    db.attendance = db.attendance.filter(a => a.studentId !== id);
    saveDB();
    renderStudents();
    renderDashboard();
    toast('Student removed.');
}

function renderStudents() {
    const q = (document.getElementById('student-search').value || '').toLowerCase();
    const list = db.students.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q));
    document.getElementById('student-count-label').textContent = `All students (${db.students.length})`;
    if (!list.length) {
        document.getElementById('student-table-wrap').innerHTML = '<div class="empty"><i class="ti ti-users-off"></i>No students found.</div>';
        return;
    }
    const rows = list.map(s => `<tr>
    <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);width:80px">${s.id}</td>
    <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(s.name)}</div>${s.name}</div></td>
    <td>${s.course || '—'}</td>
    <td>${s.level}</td>
    <td style="width:90px"><button class="btn-sm" onclick="deleteStudent('${s.id}')"><i class="ti ti-trash"></i></button></td>
  </tr>`).join('');
    document.getElementById('student-table-wrap').innerHTML = `
    <table><thead><tr><th style="width:80px">ID</th><th>Name</th><th>Course</th><th>Level</th><th style="width:90px">Action</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   COURSES
   ============================================================ */
function addCourse() {
    const code = document.getElementById('c-code').value.trim();
    const name = document.getElementById('c-name').value.trim();
    const year = document.getElementById('c-year').value;
    if (!code || !name) { toast('Please fill in all course fields.'); return; }
    if (db.courses.find(c => c.code === code)) { toast('Course code already exists.'); return; }
    db.courses.push({ code, name, year });
    saveDB();
    document.getElementById('c-code').value = '';
    document.getElementById('c-name').value = '';
    renderCourses();
    populateCourseDropdowns();
    toast('Course added.');
}

function deleteCourse(code) {
    if (!confirm('Delete this course?')) return;
    db.courses = db.courses.filter(c => c.code !== code);
    saveDB();
    renderCourses();
    populateCourseDropdowns();
    toast('Course removed.');
}

function renderCourses() {
    if (!db.courses.length) {
        document.getElementById('course-table-wrap').innerHTML = '<div class="empty"><i class="ti ti-book-off"></i>No courses yet.</div>';
        return;
    }
    const rows = db.courses.map(c => `<tr>
    <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);width:90px">${c.code}</td>
    <td>${c.name}</td>
    <td>${c.year}</td>
    <td style="width:90px"><button class="btn-sm" onclick="deleteCourse('${c.code}')"><i class="ti ti-trash"></i></button></td>
  </tr>`).join('');
    document.getElementById('course-table-wrap').innerHTML = `
    <table><thead><tr><th style="width:90px">Code</th><th>Course name</th><th>Academic year</th><th style="width:90px">Action</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
function renderAttendance() {
    const course = document.getElementById('att-course').value;
    const level = document.getElementById('att-level').value;
    const date = document.getElementById('att-date').value || new Date().toISOString().split('T')[0];
    document.getElementById('att-label').textContent = `Attendance — ${date}`;

    let students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });

    if (!students.length) {
        document.getElementById('att-table-wrap').innerHTML = '<div class="empty"><i class="ti ti-users-off"></i>No students match the filter.</div>';
        document.getElementById('att-summary').textContent = '';
        return;
    }

    if (!pendingAtt[date]) pendingAtt[date] = {};
    students.forEach(s => {
        if (pendingAtt[date][s.id] === undefined) {
            const saved = db.attendance.find(a => a.studentId === s.id && a.date === date);
            pendingAtt[date][s.id] = saved ? saved.status : null;
        }
    });

    updateAttSummary(students, date);

    const rows = students.map(s => {
        const cur = pendingAtt[date][s.id];
        return `<tr id="att-row-${s.id}">
      <td style="width:80px;font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">${s.id}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(s.name)}</div>${s.name}</div></td>
      <td>${s.course || '—'}</td>
      <td>${s.level}</td>
      <td style="width:160px">
        <div style="display:flex;gap:4px">
          <button class="att-btn p${cur === 'Present' ? ' active' : ''}" onclick="markAtt('${s.id}','Present','${date}')">Present</button>
          <button class="att-btn a${cur === 'Absent'  ? ' active' : ''}" onclick="markAtt('${s.id}','Absent','${date}')">Absent</button>
          <button class="att-btn l${cur === 'Late'    ? ' active' : ''}" onclick="markAtt('${s.id}','Late','${date}')">Late</button>
        </div>
      </td>
      <td style="width:80px"><span class="badge ${(cur || '').toLowerCase()}">${cur || '—'}</span></td>
    </tr>`;
    }).join('');

    document.getElementById('att-table-wrap').innerHTML = `
    <table><thead><tr>
      <th style="width:80px">ID</th><th>Name</th><th>Course</th><th>Level</th>
      <th style="width:160px">Mark</th><th style="width:80px">Status</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function markAtt(sid, status, date) {
    if (!pendingAtt[date]) pendingAtt[date] = {};
    pendingAtt[date][sid] = status;

    const course = document.getElementById('att-course').value;
    const level = document.getElementById('att-level').value;
    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });
    updateAttSummary(students, date);

    const row = document.getElementById('att-row-' + sid);
    if (row) {
        row.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active'));
        const btns = row.querySelectorAll('.att-btn');
        const map = { Present: 0, Absent: 1, Late: 2 };
        btns[map[status]].classList.add('active');
        const badge = row.querySelector('.badge');
        badge.className = 'badge ' + status.toLowerCase();
        badge.textContent = status;
    }
}

function updateAttSummary(students, date) {
    let p = 0,
        a = 0,
        l = 0;
    students.forEach(s => {
        const v = pendingAtt[date] && pendingAtt[date][s.id];
        if (v === 'Present') p++;
        else if (v === 'Absent') a++;
        else if (v === 'Late') l++;
    });
    document.getElementById('att-summary').textContent = `Present: ${p} · Absent: ${a} · Late: ${l}`;
}

function saveAttendance() {
    const date = document.getElementById('att-date').value || new Date().toISOString().split('T')[0];
    const course = document.getElementById('att-course').value;
    const level = document.getElementById('att-level').value;
    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });
    let count = 0;
    students.forEach(s => {
        const status = pendingAtt[date] && pendingAtt[date][s.id];
        if (!status) return;
        const idx = db.attendance.findIndex(a => a.studentId === s.id && a.date === date && a.course === s.course);
        if (idx >= 0) db.attendance[idx].status = status;
        else db.attendance.push({ studentId: s.id, date, status, course: s.course, level: s.level });
        count++;
    });
    saveDB();
    toast(`${count} attendance record(s) saved.`);
    renderDashboard();
}

/* ============================================================
   REPORTS
   ============================================================ */
function renderReports() {
    const course = document.getElementById('r-course').value;
    const level = document.getElementById('r-level').value;
    const period = document.getElementById('r-period').value;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });

    if (!students.length) {
        document.getElementById('report-table-wrap').innerHTML = '<div class="empty"><i class="ti ti-chart-off"></i>No students match filters.</div>';
        return;
    }

    const rows = students.map(s => {
        const recs = db.attendance.filter(a => {
            if (a.studentId !== s.id) return false;
            if (period === 'today') return a.date === todayStr;
            if (period === 'week') return new Date(a.date) >= weekAgo;
            if (period === 'month') return new Date(a.date) >= monthAgo;
            return true;
        });
        const total = recs.length;
        const present = recs.filter(r => r.status === 'Present').length;
        const absent = recs.filter(r => r.status === 'Absent').length;
        const late = recs.filter(r => r.status === 'Late').length;
        const pct = total ? Math.round((present / total) * 100) : 0;
        const cls = pct >= 75 ? 'high' : pct >= 50 ? 'mid' : 'low';
        const pctColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--danger)';
        const bar = total ?
            `<div class="prog-bar" style="width:80px"><div class="prog-fill ${cls}" style="width:${pct}%"></div></div>` :
            `<span style="color:var(--muted);font-size:12px">no data</span>`;

        return `<tr>
      <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)">${s.id}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(s.name)}</div>${s.name}</div></td>
      <td>${s.course || '—'}</td>
      <td>${s.level}</td>
      <td style="text-align:center">${present}</td>
      <td style="text-align:center">${absent}</td>
      <td style="text-align:center">${late}</td>
      <td style="text-align:center">${total}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:600;color:${pctColor}">${pct}%</span>
          ${bar}
        </div>
      </td>
    </tr>`;
    }).join('');

    document.getElementById('report-table-wrap').innerHTML = `
    <div style="overflow-x:auto">
      <table style="table-layout:auto">
        <thead><tr>
          <th>ID</th><th>Name</th><th>Course</th><th>Level</th>
          <th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Attendance %</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function exportCSV() {
    const course = document.getElementById('r-course').value;
    const level = document.getElementById('r-level').value;
    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });

    let csv = 'Student ID,Name,Course,Level,Present,Absent,Late,Total,Attendance %\n';
    students.forEach(s => {
        const recs = db.attendance.filter(a => a.studentId === s.id);
        const total = recs.length;
        const present = recs.filter(r => r.status === 'Present').length;
        const absent = recs.filter(r => r.status === 'Absent').length;
        const late = recs.filter(r => r.status === 'Late').length;
        const pct = total ? Math.round((present / total) * 100) : 0;
        csv += `${s.id},"${s.name}","${s.course}",${s.level},${present},${absent},${late},${total},${pct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'attendance_report.csv';
    a.click();
    toast('CSV exported successfully.');
}

/* ============================================================
   BULK ATTENDANCE ACTIONS (NEW FEATURE)
   ============================================================ */
function markAllPresent() {
    const course = document.getElementById('att-course').value;
    const level = document.getElementById('att-level').value;
    const date = document.getElementById('att-date').value || new Date().toISOString().split('T')[0];
    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });
    if (!students.length) { toast('No students to mark.'); return; }
    if (!pendingAtt[date]) pendingAtt[date] = {};
    students.forEach(s => pendingAtt[date][s.id] = 'Present');
    updateAttSummary(students, date);
    renderAttendance();
    toast(`All ${students.length} students marked as Present.`);
}

function markAllAbsent() {
    const course = document.getElementById('att-course').value;
    const level = document.getElementById('att-level').value;
    const date = document.getElementById('att-date').value || new Date().toISOString().split('T')[0];
    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });
    if (!students.length) { toast('No students to mark.'); return; }
    if (!pendingAtt[date]) pendingAtt[date] = {};
    students.forEach(s => pendingAtt[date][s.id] = 'Absent');
    updateAttSummary(students, date);
    renderAttendance();
    toast(`All ${students.length} students marked as Absent.`);
}

function clearAllMarks() {
    const date = document.getElementById('att-date').value || new Date().toISOString().split('T')[0];
    const course = document.getElementById('att-course').value;
    const level = document.getElementById('att-level').value;
    const students = db.students.filter(s => {
        if (course && s.course !== course) return false;
        if (level && s.level !== level) return false;
        return true;
    });
    if (!students.length) { toast('No students to clear.'); return; }
    if (!pendingAtt[date]) pendingAtt[date] = {};
    students.forEach(s => pendingAtt[date][s.id] = null);
    document.getElementById('att-summary').textContent = '';
    renderAttendance();
    toast(`Cleared marks for ${students.length} students.`);
}

/* ============================================================
   EDIT ATTENDANCE RECORDS (NEW FEATURE)
   ============================================================ */
function editAttendanceRecord(studentId, date) {
    const status = prompt('Enter new status (Present, Absent, Late, or leave blank to remove):', '');
    if (status === null) return;

    if (status === '') {
        db.attendance = db.attendance.filter(a => !(a.studentId === studentId && a.date === date));
    } else if (['Present', 'Absent', 'Late'].includes(status)) {
        const idx = db.attendance.findIndex(a => a.studentId === studentId && a.date === date);
        if (idx >= 0) {
            db.attendance[idx].status = status;
        } else {
            const student = db.students.find(s => s.id === studentId);
            if (student) {
                db.attendance.push({ studentId, date, status, course: student.course, level: student.level });
            }
        }
    } else {
        toast('Invalid status. Use: Present, Absent, or Late');
        return;
    }
    saveDB();
    renderDashboard();
    renderReports();
    toast('Attendance record updated.');
}

/* ============================================================
   STUDENT STATISTICS (NEW FEATURE)
   ============================================================ */
function getStudentStats(studentId) {
    const recs = db.attendance.filter(a => a.studentId === studentId);
    const total = recs.length;
    const present = recs.filter(r => r.status === 'Present').length;
    const absent = recs.filter(r => r.status === 'Absent').length;
    const late = recs.filter(r => r.status === 'Late').length;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, percentage: pct };
}

/* ============================================================
   ENHANCED INITIALIZATION
   ============================================================ */
window.addEventListener('load', () => {
    // Try to restore session on page load
    restoreSession();
});