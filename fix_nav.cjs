const fs = require('fs');

const filePath = 'frontend/src/core/NavManager.js';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace('    initNotificationCenter,\n', '');
fs.writeFileSync(filePath, content, 'utf8');

const hifzPath = 'frontend/src/pages/HifzPage.js';
let hifz = fs.readFileSync(hifzPath, 'utf8');
hifz = hifz.replace('    const { _, hifz } = JSON.parse(task.description);', '    const { hifz } = JSON.parse(task.description);');
hifz = hifz.replace('    const { _ } = await import(\'../services/hifz.js\');', '    await import(\'../services/hifz.js\');');
fs.writeFileSync(hifzPath, hifz, 'utf8');

const myTasksPath = 'frontend/src/pages/MyTasksPage.js';
let myTasks = fs.readFileSync(myTasksPath, 'utf8');
myTasks = myTasks.replace('            const { _, hifz } = parsed;', '            const { hifz } = parsed;');
fs.writeFileSync(myTasksPath, myTasks, 'utf8');

const teacherDevoirsPath = 'frontend/src/pages/teacher/TeacherDevoirsSection.js';
let teacherDevoirs = fs.readFileSync(teacherDevoirsPath, 'utf8');
teacherDevoirs = teacherDevoirs.replace('                const { text, hifz } = _parseTaskDescription(task.description);', '                const { text, hifz } = _parseTaskDescription(task.description);\n                // _');
teacherDevoirs = teacherDevoirs.replace('// _', '').replace('                const { text, hifz } = _parseTaskDescription(task.description);\n', '                const { text, hifz } = _parseTaskDescription(task.description);');
fs.writeFileSync(teacherDevoirsPath, teacherDevoirs, 'utf8');
