
import * as assert from 'assert';
import { suite , test } from 'mocha';
import * as i18nParse from '../src/i18nParse'
import * as _ from 'lodash'

suite("parseContent", () => {
    const fileMap = {
        'a.js': {
            path: 'a.js',
            content: {
                'NAME': '名字'
            }
        },
        'b.js': {
            path: 'b.js',
            content: {
                'ORG': '组织构'
            }
        }
    }

    test("匹配关键字", () => { 
        i18nParse.parseContent("__('NAME')", fileMap, (token, file) => { 
            assert.equal(file.path, 'a.js')
            assert.deepEqual(token, {
                capture: 'NAME',
                start: 3,
                end: 9
            })
        }, () => { 
            assert.equal(false, true)
        })
    })

    test("匹配多个关键字", () => { 
        let tokens = []
        let files = []
        i18nParse.parseContent("__('NAME')  __('ORG')", fileMap, (token, file) => { 
            files.push(file)
            tokens.push(token)
        }, () => assert.equal(false, true))
        assert.equal(files[0].path, 'a.js')
        assert.deepEqual(tokens[0], {
            capture: 'NAME',
            start: 3,
            end: 9
        })

        assert.equal(files[1].path, 'b.js')
        assert.deepEqual(tokens[1], {
            capture: 'ORG',
            start: 15,
            end: 20
        })
    })

    test("匹配不到关键字", () => { 
        i18nParse.parseContent("__('NULL')", fileMap, (token, file) => { 
            assert.equal(false, true)
        }, (token, file) => { 
            assert.deepEqual(token, {
                capture: 'NULL',
                start: 3,
                end: 9
            })
        })
    })
});