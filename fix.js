const fs = require("fs");

const files = [
  "frontend/src/pages/StudentDashboard.tsx",
  "frontend/src/pages/AdminDashboard.tsx",
  "frontend/src/pages/VerifyCertificatePage.tsx",
  "frontend/src/pages/LandingPage.tsx",
  "frontend/src/pages/LoginPage.tsx"
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");

    // StudentDashboard.tsx
    content = content.replace(/setEditUsername\(\.username/g, "setEditUsername(user.username");
    content = content.replace(/<span className="text-xs font-bold text-foreground hidden sm:block">\{\.username\}<\/span>/g, `<span className="text-xs font-bold text-foreground hidden sm:block">{user?.username}</span>`);
    content = content.replace(/<span className="font-bold text-foreground block">\{\.username\}<\/span>/g, `<span className="font-bold text-foreground block">{student.username}</span>`);
    content = content.replace(/<span className="font-bold text-sm text-foreground truncate">\{\.username\}<\/span>/g, `<span className="font-bold text-sm text-foreground truncate">{winner.username}</span>`);
    content = content.replace(/\{selectedEvent\.\.username\}/g, "{selectedEvent.facultyCoordinator?.username}");
    content = content.replace(/\{user\?\.username \|\| registerUsername\}/g, "{user?.username || registerUsername}");
    content = content.replace(/              \{\.username\}/g, "                 {user?.username}");

    // LandingPage.tsx
    content = content.replace(/\{w\.place === '1st' \? '🥇' : w\.place === '2nd' \? '🥈' : '🥉'\} \{\.username\}/g, "{w.place === '1st' ? '🥇' : w.place === '2nd' ? '🥈' : '🥉'} {w.username}");
    
    // VerifyCertificatePage.tsx
    content = content.replace(/\{data\.\.username\}/g, "{data.student.username}");

    // AdminDashboard.tsx
    content = content.replace(/setWinner1st\(\{ username: \.username/g, "setWinner1st({ username: w1.username");
    content = content.replace(/setWinner2nd\(\{ username: \.username/g, "setWinner2nd({ username: w2.username");
    content = content.replace(/setWinner3rd\(\{ username: \.username/g, "setWinner3rd({ username: w3.username");
    content = content.replace(/setCoordinatorName\(event\.\.username\)/g, "setCoordinatorName(event.facultyCoordinator?.username)");
    content = content.replace(/setStudentCoordinatorName\(event\.\.username\)/g, "setStudentCoordinatorName(event.studentCoordinator?.username)");
    content = content.replace(/r\.\.username/g, "r.studentId?.username");
    content = content.replace(/<span className="font-bold text-foreground block">\{reg\.\.username \|\| 'Deleted student'\}<\/span>/g, `<span className="font-bold text-foreground block">{reg.studentId?.username || 'Deleted student'}</span>`);
    content = content.replace(/<h4 className="text-base font-bold text-foreground">\{\.username\}<\/h4>/g, `<h4 className="text-base font-bold text-foreground">{coord.username}</h4>`);
    content = content.replace(/window\.confirm\(\`Are you sure you want to permanently delete coordinator \$\{\.username\}\?\`\)/g, "window.confirm(`Are you sure you want to permanently delete coordinator ${coord.username}?`)");
    content = content.replace(/<td className="p-4 font-bold text-foreground">\{\.username\}<\/td>/g, `<td className="p-4 font-bold text-foreground">{member.username}</td>`);
    content = content.replace(/\{\(\.username \|\| 'S'\)\.charAt\(0\)\.toUpperCase\(\)\}/g, "{(s?.username || 'S').charAt(0).toUpperCase()}");
    content = content.replace(/<p className="font-semibold text-foreground">\{\.username \|\| '—'\}<\/p>/g, `<p className="font-semibold text-foreground">{s?.username || '—'}</p>`);
    content = content.replace(/<input type="text" value=\{\.username\} onChange=\{e => setWinner1st/g, `<input type="text" value={winner1st.username} onChange={e => setWinner1st`);
    content = content.replace(/<input type="text" value=\{\.username\} onChange=\{e => setWinner2nd/g, `<input type="text" value={winner2nd.username} onChange={e => setWinner2nd`);
    content = content.replace(/<input type="text" value=\{\.username\} onChange=\{e => setWinner3rd/g, `<input type="text" value={winner3rd.username} onChange={e => setWinner3rd`);
    content = content.replace(/if \(\.username\) validWinners\.push\(\{ place: '1st', \.\.\.winner1st \}\);/g, "if (winner1st.username) validWinners.push({ place: '1st', ...winner1st });");
    content = content.replace(/if \(\.username\) validWinners\.push\(\{ place: '2nd', \.\.\.winner2nd \}\);/g, "if (winner2nd.username) validWinners.push({ place: '2nd', ...winner2nd });");
    content = content.replace(/if \(\.username\) validWinners\.push\(\{ place: '3rd', \.\.\.winner3rd \}\);/g, "if (winner3rd.username) validWinners.push({ place: '3rd', ...winner3rd });");
    content = content.replace(/1st Place: \$\{\.username\}\\n2nd Place: \$\{\.username\}\\n3rd Place: \$\{\.username\}/g, "1st Place: ${winner1st.username}\\n2nd Place: ${winner2nd.username}\\n3rd Place: ${winner3rd.username}");
    content = content.replace(/\{\.username \|\| 'Student Name'\}/g, "{student?.username || 'Student Name'}");
    content = content.replace(/reg\.\.username \|\|/g, "reg.studentId?.username ||");
    content = content.replace(/\{d\.\.username\}/g, "{d.username}");
    content = content.replace(/\{\.username\}/g, "{d.username}"); // Any leftovers in AdminDashboard

    fs.writeFileSync(file, content, "utf8");
  }
});

console.log("Fixes applied.");
