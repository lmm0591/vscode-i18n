
import * as assert from 'assert';
import { suite , test } from 'mocha';
import * as i18nParse from '../src/i18nParse'

suite("getI18nKeyList", () => {
    const fileMap = {
        'a.js': {
            path: 'a.js',
            content: {
              'NAME': '名字',
              'ND': '网龙'
            }
        },
        'b.js': {
            path: 'b.js',
            content: {
                'ORG': '组织机构'
            }
        }
    }

    test("获取翻译的KEY", () => {
      let keyList = i18nParse.getI18nKeyList(fileMap)
      assert.equal(keyList[0].filePath, 'a.js')
      assert.equal(keyList[0].label, 'NAME')
      assert.equal(keyList[0].message, '名字')

      assert.equal(keyList[1].filePath, 'a.js')
      assert.equal(keyList[1].label, 'ND')
      assert.equal(keyList[1].message, '网龙')

      assert.equal(keyList[2].filePath, 'b.js')
      assert.equal(keyList[2].label, 'ORG')
      assert.equal(keyList[2].message, '组织机构')
    })

    test("过滤文件", () => {
      let keyList = i18nParse.getI18nKeyList(fileMap, /a.js/)
      assert.equal(keyList[0].filePath, 'a.js')
      assert.equal(keyList[0].label, 'NAME')
      assert.equal(keyList[0].message, '名字')

      assert.equal(keyList[1].filePath, 'a.js')
      assert.equal(keyList[1].label, 'ND')
      assert.equal(keyList[1].message, '网龙')

      assert.equal(keyList.length, 2)
    })

});
