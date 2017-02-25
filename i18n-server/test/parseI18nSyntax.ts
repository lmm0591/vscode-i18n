
import * as assert from 'assert';
import { suite , test } from 'mocha';
import * as i18nParse from '../src/i18nParse'

suite("parseI18nSyntax", () => {

    test("解析单个", () => {
        let tokens = i18nParse.parseI18nSyntax("__('NAME')")
        assert.equal(tokens.length, 1)
        let token = tokens[0]
        assert.equal(token.capture, "NAME")
        assert.equal(token.start, 3)
        assert.equal(token.end, 9)
    })

    test("解析多个", () => {
        let tokens = i18nParse.parseI18nSyntax("__('NAME') __('I18N')")
        assert.equal(tokens.length, 2)
        let token1 = tokens[0]
        assert.equal(token1.capture, "NAME")
        assert.equal(token1.start, 3)
        assert.equal(token1.end, 9)

        let token2 = tokens[1]
        assert.equal(token2.capture, "I18N")
        assert.equal(token2.start, 14)
        assert.equal(token2.end, 20)
    })

    test("混淆解析", () => {
        let tokens = i18nParse.parseI18nSyntax(" __('NAME') NAME __('I18N') ")
        assert.equal(tokens.length, 2)
        let token1 = tokens[0]
        assert.equal(token1.capture, "NAME")
        assert.equal(token1.start, 4)
        assert.equal(token1.end, 10)

        let token2 = tokens[1]
        assert.equal(token2.capture, "I18N")
        assert.equal(token2.start, 20)
        assert.equal(token2.end, 26)
    })
});
