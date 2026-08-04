const fs = require('fs');

const hifzPath = 'frontend/src/pages/HifzPage.js';
let hifz = fs.readFileSync(hifzPath, 'utf8');
hifz = hifz.replace('} catch (_) {', '} catch (e) {');
hifz = hifz.replace('} catch (_) {', '} catch (e) {'); // Do it twice just in case
fs.writeFileSync(hifzPath, hifz, 'utf8');

const myTasksPath = 'frontend/src/pages/MyTasksPage.js';
let myTasks = fs.readFileSync(myTasksPath, 'utf8');
myTasks = myTasks.replace('} catch (_) {', '} catch (e) {');
fs.writeFileSync(myTasksPath, myTasks, 'utf8');

const teacherDevoirsPath = 'frontend/src/pages/teacher/TeacherDevoirsSection.js';
let teacherDevoirs = fs.readFileSync(teacherDevoirsPath, 'utf8');
teacherDevoirs = teacherDevoirs.replace('} catch (_) {', '} catch (e) {');
fs.writeFileSync(teacherDevoirsPath, teacherDevoirs, 'utf8');
