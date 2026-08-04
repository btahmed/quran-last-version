const fs = require('fs');

const hifzPath = 'frontend/src/pages/HifzPage.js';
let hifz = fs.readFileSync(hifzPath, 'utf8');
hifz = hifz.replace('catch (e) {', 'catch {');
hifz = hifz.replace('catch (e) {', 'catch {');
fs.writeFileSync(hifzPath, hifz, 'utf8');

const myTasksPath = 'frontend/src/pages/MyTasksPage.js';
let myTasks = fs.readFileSync(myTasksPath, 'utf8');
myTasks = myTasks.replace('catch (e) {', 'catch {');
fs.writeFileSync(myTasksPath, myTasks, 'utf8');

const teacherDevoirsPath = 'frontend/src/pages/teacher/TeacherDevoirsSection.js';
let teacherDevoirs = fs.readFileSync(teacherDevoirsPath, 'utf8');
teacherDevoirs = teacherDevoirs.replace('catch (e) {', 'catch {');
fs.writeFileSync(teacherDevoirsPath, teacherDevoirs, 'utf8');
