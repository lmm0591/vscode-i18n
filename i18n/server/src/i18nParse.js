"use strict";
const i18nFunReg = /__\('(.+?)'\)/g;
function parseI18nSyntax(text) {
    let syntaxs = [];
    text.replace(i18nFunReg, (matching, capture, startIndex, content) => {
        syntaxs.push({
            start: startIndex + 3,
            end: startIndex + matching.length - 1,
            capture: capture
        });
        return matching;
    });
    return syntaxs;
}
exports.parseI18nSyntax = parseI18nSyntax;
function parseContent(line, fileMap, captureFn, failFn) {
    let i18nSyntax = parseI18nSyntax(line);
    if (i18nSyntax) {
        let isMatchTranslateFile = false;
        for (var fileName in fileMap) {
            for (let key in fileMap[fileName].content) {
                if (key === i18nSyntax.capture) {
                    isMatchTranslateFile = true;
                    captureFn(i18nSyntax);
                }
            }
        }
        let isReciveI18NMap = Object.keys(fileMap).length > 0;
        if (isReciveI18NMap && isMatchTranslateFile === false) {
            failFn(i18nSyntax);
        }
    }
}
exports.parseContent = parseContent;
//# sourceMappingURL=i18nParse.js.map