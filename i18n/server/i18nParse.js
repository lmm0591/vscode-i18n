"use strict";
const i18nFunReg = /__\('(.+?)'\)/g;
// 获取一组翻译关键字的token 
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
    let i18nSyntaxs = parseI18nSyntax(line);
    i18nSyntaxs.forEach(i18nSyntax => {
        let isMatchFile = false;
        for (var fileName in fileMap) {
            for (let key in fileMap[fileName].content) {
                if (key === i18nSyntax.capture) {
                    isMatchFile = true;
                    captureFn(i18nSyntax, fileMap[fileName]);
                }
            }
        }
        let isReciveI18NMap = Object.keys(fileMap).length > 0;
        if (isReciveI18NMap && isMatchFile === false) {
            failFn && failFn(i18nSyntax);
        }
    });
}
exports.parseContent = parseContent;
//# sourceMappingURL=i18nParse.js.map