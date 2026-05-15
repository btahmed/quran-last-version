const fs = require('fs');

const content = fs.readFileSync('frontend/src/pages/AdminPage.js', 'utf8');

if (content.includes('aria-label="إغلاق" title="إغلاق"') && content.includes('aria-label="حذف الفصل" title="حذف الفصل"')) {
    console.log("PASS: aria-label and title found in AdminPage.js");
} else {
    console.error("FAIL: aria-label and title NOT found in AdminPage.js");
    process.exit(1);
}
