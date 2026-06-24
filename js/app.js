/**
 * app.js — Main application logic with role-based access
 * Student Attendance Management System
 * University of Makeni — Group 14, CS Year 3
 */

/* ============================================================
   GLOBALS
   ============================================================ */
let currentUser = null; // { email, password, role, name, studentId, course, level }
let pendingAtt = {}; // date -> { studentId: status }

/* ============================================================
   PAGE SWITCHING (login / register)
   ============================================================ */
function showRegister() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('register-page').classList.add('active');
    document.getElementById('login-err').style.display = 'none';
    // populate course dropdown
    populateRegCourseDropdown();
}

function showLogin() {
    document.getElementById('register-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
    document.getElementById('reg-err').style.display = 'none';
}

function populateRegCourseDropdown() {
    const sel = document.getElementById('reg-course');
    sel.innerHTML = '<option value="">Select your course</option>';
    db.courses.forEach(c => {
        sel.add(new Option(c.name, c.name));
    });
}

/* ============================================================
   AUTH
   ============================================================ */
function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    const err = document.getElementById('login-err');

    const user = db.users.find(u => u.email === email && u.password === pass);
    if (!user) {
        err.style.display = 'block';
        setTimeout(() => err.style.display = 'none', 3000);
        return;
    }

    currentUser = user;
    localStorage.setItem('ams_session', JSON.stringify({ email: user.email, timestamp: Date.now() }));

    // Hide login page and show app
    document.getElementById('login-page').classList.remove('active');
    const shell = document.getElementById('app-shell');
    shell.classList.add('active');
    shell.style.display = 'flex';
    document.getElementById('login-page').style.display = 'none';

    initApp();
}

document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
});

function doLogout() {
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('app-shell').classList.remove('active');
    const lp = document.getElementById('login-page');
    lp.style.display = '';
    lp.classList.add('active');
    document.getElementById('login-email').value = '';
    document.getElementById('login-pass').value = '';
    currentUser = null;
    localStorage.removeItem('ams_session');
}

function restoreSession() {
    const session = JSON.parse(localStorage.getItem('ams_session') || 'null');
    if (session) {
        const user = db.users.find(u => u.email === session.email);
        if (user) {
            currentUser = user;
            document.getElementById('login-page').classList.remove('active');
            const shell = document.getElementById('app-shell');
            shell.classList.add('active');
            shell.style.display = 'flex';
            document.getElementById('login-page').style.display = 'none';
            initApp();
            return true;
        }
    }
    return false;
}

/* ============================================================
   REGISTRATION
   ============================================================ */
function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const pass2 = document.getElementById('reg-pass2').value;
    const studentId = document.getElementById('reg-student-id').value.trim();
    const level = document.getElementById('reg-level').value;
    const course = document.getElementById('reg-course').value;

    const errEl = document.getElementById('reg-err');
    errEl.style.display = 'none';
    errEl.textContent = '';

    if (!name || !email || !pass || !studentId || !course) {
        errEl.textContent = 'Please fill in all fields.';
        errEl.style.display = 'block';
        return;
    }
    if (pass !== pass2) {
        errEl.textContent = 'Passwords do not match.';
        errEl.style.display = 'block';
        return;
    }
    if (pass.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters.';
        errEl.style.display = 'block';
        return;
    }
    if (db.users.find(u => u.email === email)) {
        errEl.textContent = 'Email already registered. Please login.';
        errEl.style.display = 'block';
        return;
    }
    if (db.students.find(s => s.id === studentId)) {
        errEl.textContent = 'Student ID already exists.';
        errEl.style.display = 'block';
        return;
    }

    // Create user account
    const ok = addUser(email, pass, 'student', name, studentId, course, level);
    if (!ok) {
        errEl.textContent = 'Registration failed. Try again.';
        errEl.style.display = 'block';
        return;
    }

    // Also add to students array
    db.students.push({ id: studentId, name, course, level });
    saveDB();

    toast('Registration successful! Please login.');
    showLogin();
    document.getElementById('login-email').value = email;
    document.getElementById('login-pass').value = '';
}

/* ============================================================
   NAVIGATION & ROLE VISIBILITY
   ============================================================ */
function showSection(el, id) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('sec-' + id).classList.add('active');

    // Call render function if exists
    const renders = {
        dashboard: renderDashboard,
        'my-attendance': renderMyAttendance,
        students: renderStudents,
        courses: renderCourses,
        attendance: renderAttendance,
        reports: renderReports,
        profile: renderProfile
    };
    if (renders[id]) renders[id]();
}

/* ============================================================
   INIT
   ============================================================ */
function initApp() {
    // Role-based UI
    const isLecturer = currentUser.role === 'lecturer';
    document.getElementById('role-badge').textContent = isLecturer ? 'Lecturer' : 'Student';

    // Show/hide nav items
    document.getElementById('nav-students').style.display = isLecturer ? '' : 'none';
    document.getElementById('nav-courses').style.display = isLecturer ? '' : 'none';
    document.getElementById('nav-attendance').style.display = isLecturer ? '' : 'none';
    document.getElementById('nav-reports').style.display = isLecturer ? '' : 'none';
    document.getElementById('nav-my-attendance').style.display = isLecturer ? 'none' : '';

    // If student, redirect to 'my-attendance' if they were on a lecturer-only section
    if (!isLecturer) {
        const activeSec = document.querySelector('.section.active');
        const id = activeSec ? activeSec.id.replace('sec-', '') : '';
        const lecturerOnly = ['students', 'courses', 'attendance', 'reports'];
        if (lecturerOnly.includes(id)) {
            // switch to dashboard or my-attendance
            const nav = document.querySelector('.nav-item[data-sec="dashboard"]');
            if (nav) showSection(nav, 'dashboard');
        }
    }

    // Set date for attendance
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('att-date').value = today;
    document.getElementById('my-att-date').value = today;

    populateCourseDropdowns();
    renderDashboard();
    if (!isLecturer) renderMyAttendance();
    else {
        renderStudents();
        renderCourses();
    }
    renderProfile();
}

function populateCourseDropdowns() {
    ['s-course', 'att-course', 'r-course', 'my-att-course'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const cur = sel.value;
        while (sel.options.length > 1) sel.remove(1);
        db.courses.forEach(c => sel.add(new Option(c.name, c.name)));
        if (cur) sel.value = cur;
    });
    populateRegCourseDropdown();
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
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ============================================================
   DASHBOARD (shared, but stats differ)
   ============================================================ */
function renderDashboard() {
    const isLecturer = currentUser.role === 'lecturer';
    const todayStr = new Date().toISOString().split('T')[0];

    let total, present, absent, late, recent;

    if (isLecturer) {
        total = db.students.length;
        const todayRecs = db.attendance.filter(r => r.date === todayStr);
        present = todayRecs.filter(r => r.status === 'Present').length;
        absent = todayRecs.filter(r => r.status === 'Absent').length;
        late = todayRecs.filter(r => r.status === 'Late').length;
        recent = db.attendance.slice(-20).reverse();
    } else {
        // Student: only their own stats
        const myId = currentUser.studentId;
        const myRecs = db.attendance.filter(r => r.studentId === myId);
        total = myRecs.length;
        present = myRecs.filter(r => r.status === 'Present').length;
        absent = myRecs.filter(r => r.status === 'Absent').length;
        late = myRecs.filter(r => r.status === 'Late').length;
        recent = myRecs.slice(-20).reverse();
    }

    document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card blue"><div class="label">${isLecturer ? 'Total students' : 'Total classes'}</div><div class="value">${total}</div><div class="sub">${isLecturer ? 'Registered' : 'Recorded'}</div></div>
        <div class="stat-card green"><div class="label">Present</div><div class="value">${present}</div><div class="sub">${isLecturer ? 'Today' : 'Overall'}</div></div>
        <div class="stat-card red"><div class="label">Absent</div><div class="value">${absent}</div><div class="sub">${isLecturer ? 'Today' : 'Overall'}</div></div>
        <div class="stat-card amber"><div class="label">Late</div><div class="value">${late}</div><div class="sub">${isLecturer ? 'Today' : 'Overall'}</div></div>
    `;

    const wrap = document.getElementById('recent-table-wrap');
    document.getElementById('recent-title').textContent = isLecturer ? 'Recent attendance activity' : 'My recent attendance';

    if (!recent || !recent.length) {
        wrap.innerHTML = '<div class="empty"><i class="ti ti-calendar-off"></i>No attendance records yet.</div>';
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
    wrap.innerHTML = `
        <table><thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   MY ATTENDANCE (student only)
   ============================================================ */
function renderMyAttendance() {
    if (currentUser.role !== 'student') return;
    const myId = currentUser.studentId;
    const course = document.getElementById('my-att-course').value;
    const date = document.getElementById('my-att-date').value;

    let recs = db.attendance.filter(r => r.studentId === myId);
    if (course) recs = recs.filter(r => r.course === course);
    if (date) recs = recs.filter(r => r.date === date);

    recs.sort((a, b) => b.date.localeCompare(a.date));

    document.getElementById('my-att-label').textContent = `Your attendance records (${recs.length})`;

    const present = recs.filter(r => r.status === 'Present').length;
    const absent = recs.filter(r => r.status === 'Absent').length;
    const late = recs.filter(r => r.status === 'Late').length;
    document.getElementById('my-att-summary').textContent = `Present: ${present} · Absent: ${absent} · Late: ${late}`;

    const wrap = document.getElementById('my-att-table-wrap');
    if (!recs.length) {
        wrap.innerHTML = '<div class="empty"><i class="ti ti-calendar-off"></i>No attendance records match.</div>';
        return;
    }

    const rows = recs.map(r => {
        return `<tr>
            <td>${r.date}</td>
            <td>${r.course || '—'}</td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
        </tr>`;
    }).join('');
    wrap.innerHTML = `
        <table><thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   STUDENTS (lecturer only)
   ============================================================ */
function addStudent() {
    const id = document.getElementById('s-id').value.trim();
    const name = document.getElementById('s-name').value.trim();
    const course = document.getElementById('s-course').value;
    const level = document.getElementById('s-level').value;
    if (!id || !name) { toast('Please fill in Student ID and Name.'); return; }
    if (db.students.find(s => s.id === id)) { toast('Student ID already exists.'); return; }
    // Also create a user account with default password
    const email = id + '@unimak.edu.sl'; // convention
    if (db.users.find(u => u.email === email)) { toast('User with this email already exists.'); return; }
    addUser(email, 'student123', 'student', name, id, course, level);
    db.students.push({ id, name, course, level });
    saveDB();
    document.getElementById('s-id').value = '';
    document.getElementById('s-name').value = '';
    renderStudents();
    renderDashboard();
    toast('Student added with default password: student123');
}

function deleteStudent(id) {
    if (!confirm('Delete this student and all their attendance records?')) return;
    db.students = db.students.filter(s => s.id !== id);
    db.attendance = db.attendance.filter(a => a.studentId !== id);
    // Also remove user account
    const user = db.users.find(u => u.studentId === id);
    if (user) db.users = db.users.filter(u => u.email !== user.email);
    saveDB();
    renderStudents();
    renderDashboard();
    toast('Student removed.');
}

function renderStudents() {
    const q = (document.getElementById('student-search').value || '').toLowerCase();
    const list = db.students.filter(s => s.name.toLowerCase().includes(q) || s.id.includes(q));
    document.getElementById('student-count-label').textContent = `All students (${db.students.length})`;
    const wrap = document.getElementById('student-table-wrap');
    if (!list.length) {
        wrap.innerHTML = '<div class="empty"><i class="ti ti-users-off"></i>No students found.</div>';
        return;
    }
    const rows = list.map(s => `<tr>
        <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);width:80px">${s.id}</td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(s.name)}</div>${s.name}</div></td>
        <td>${s.course || '—'}</td>
        <td>${s.level}</td>
        <td style="width:90px"><button class="btn-sm" onclick="deleteStudent('${s.id}')"><i class="ti ti-trash"></i></button></td>
    </tr>`).join('');
    wrap.innerHTML = `
        <table><thead><tr><th style="width:80px">ID</th><th>Name</th><th>Course</th><th>Level</th><th style="width:90px">Action</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   COURSES (lecturer only)
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
    const wrap = document.getElementById('course-table-wrap');
    if (!db.courses.length) {
        wrap.innerHTML = '<div class="empty"><i class="ti ti-book-off"></i>No courses yet.</div>';
        return;
    }
    const rows = db.courses.map(c => `<tr>
        <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);width:90px">${c.code}</td>
        <td>${c.name}</td>
        <td>${c.year}</td>
        <td style="width:90px"><button class="btn-sm" onclick="deleteCourse('${c.code}')"><i class="ti ti-trash"></i></button></td>
    </tr>`).join('');
    wrap.innerHTML = `
        <table><thead><tr><th style="width:90px">Code</th><th>Course name</th><th>Academic year</th><th style="width:90px">Action</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
}

/* ============================================================
   ATTENDANCE (lecturer only)
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

    const wrap = document.getElementById('att-table-wrap');
    if (!students.length) {
        wrap.innerHTML = '<div class="empty"><i class="ti ti-users-off"></i>No students match the filter.</div>';
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

    wrap.innerHTML = `
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
    // If lecturer, also update reports if visible
    if (document.getElementById('sec-reports').classList.contains('active')) renderReports();
}

/* ============================================================
   BULK ATTENDANCE ACTIONS
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
   REPORTS (lecturer only)
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

    const wrap = document.getElementById('report-table-wrap');
    if (!students.length) {
        wrap.innerHTML = '<div class="empty"><i class="ti ti-chart-off"></i>No students match filters.</div>';
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

    wrap.innerHTML = `
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
   PROFILE (all users)
   ============================================================ */
function renderProfile() {
    const user = currentUser;
    if (!user) return;
    document.getElementById('profile-avatar').textContent = initials(user.name);
    document.getElementById('profile-name').textContent = user.name || '—';
    document.getElementById('profile-role').textContent = user.role === 'lecturer' ? 'Lecturer' : 'Student';
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-student-id').value = user.studentId || 'N/A';
    document.getElementById('profile-course').value = user.course || 'N/A';
    document.getElementById('profile-level').value = user.level || 'N/A';

    if (user.role === 'student') {
        const stats = getStudentStats(user.studentId);
        document.getElementById('profile-total').value = stats.total;
        document.getElementById('profile-present').value = stats.present;
        document.getElementById('profile-absent').value = stats.absent;
        document.getElementById('profile-late').value = stats.late;
        document.getElementById('profile-pct').value = stats.percentage + '%';
        document.getElementById('profile-stats-row').style.display = '';
    } else {
        document.getElementById('profile-stats-row').style.display = 'none';
    }
}

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
    // Try to restore session
    const restored = restoreSession();
    if (!restored) {
        // show login by default
        document.getElementById('login-page').classList.add('active');
    }
});