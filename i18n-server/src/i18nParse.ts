
export interface I18nSyntax {
	start: number,
	end: number,
	capture: string
}

export interface AutoCompletionList {
  label: string,
  filePath: string,
  message: string
}

export interface i18nFile {
	path: string,
	content: Object
}

const i18nFunReg = /__\('(.+?)'\)/g
// 获取一组翻译关键字的token
function parseI18nSyntax(text: string): I18nSyntax [] {
  let syntaxs = [];
	text.replace(i18nFunReg, (matching, capture, startIndex, content) => {
		syntaxs.push({
			start: startIndex + 3,
			end: startIndex + matching.length - 1,
			capture: capture
		})
		return matching
	})
	return syntaxs
}

function getI18nKeyList(fileMap: Object, filter : RegExp = new RegExp('^.+$', "i")): AutoCompletionList[] {
  let completionList: AutoCompletionList[] = []
  for (var fileName in fileMap) {
    if (filter.test(fileName)) {
      var file = <i18nFile>fileMap[fileName];
      for (let key in file.content) {
        completionList.push({
          label: key,
          message: file.content[key],
          filePath: file.path
        })
      }
    }
  }
  return completionList
}

function parseContent(line: string, fileMap: Object, captureFn: Function, failFn? : Function) {
  let i18nSyntaxs = parseI18nSyntax(line)
  i18nSyntaxs.forEach(i18nSyntax => {
    let isMatchFile : boolean = false
    for (var fileName in fileMap) {
      if (fileMap[fileName].content[i18nSyntax.capture]) {
        isMatchFile = true
        captureFn(i18nSyntax, fileMap[fileName])
      }
    }
    let isReciveI18NMap: boolean = Object.keys(fileMap).length > 0;
    if (isReciveI18NMap && isMatchFile === false) {
      failFn && failFn(i18nSyntax)
    }
  })
}

export {
  parseI18nSyntax,
  parseContent,
  getI18nKeyList
}
