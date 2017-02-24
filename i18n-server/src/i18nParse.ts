import * as _ from 'lodash'

interface I18nSyntax { 
	start: number,
	end: number,
	capture: String
}

const i18nFunReg = /__\('(.+?)'\)/g
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


function parseContent(line: string, fileMap: Object, captureFn: Function, failFn: Function) { 
		let i18nSyntax = parseI18nSyntax(line)
		if (i18nSyntax) {
			let isMatchTranslateFile : boolean = false
			for (var fileName in fileMap) { 
				for (let key in fileMap[fileName].content) {
					if (key === i18nSyntax.capture) { 
						isMatchTranslateFile = true
            captureFn(i18nSyntax)
					}
				}
			}
			let isReciveI18NMap: boolean = Object.keys(fileMap).length > 0;
			if (isReciveI18NMap && isMatchTranslateFile === false) { 
        failFn(i18nSyntax)
			}
		}
}

export {
  parseI18nSyntax,
  parseContent
}