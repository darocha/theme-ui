import { expecter } from 'ts-snippet'

import { css, get, Theme } from '../src'

const expectSnippet = expecter(
  (code) => `
  import { css } from './packages/css/src'

  ${code}
`,
  { strict: true }
)

describe('Theme', () => {
  test('shows friendly error only on bad property', () => {
    expectSnippet(`
      css({
        bg: 'salmon',
        widows: 'foo',
        '> form': {
          color: 'blue',
          widows: 'bar',
          // unknown CSS property is accepted
          windows: 'baz',
        },
      })
    `).toFail(
      /Error snippet\.ts \(\d+,\d+\): Type '"foo"' is not assignable to type [\s\S]+'./
    )
  })

  test('shows friendly error on nested object', () => {
    expectSnippet(`
      css({
        bg: 'salmon',
        '> form': {
          color: 'blue',
          widows: 'bar',
        },
      })
    `).toFail(
      new RegExp(
        `Error snippet\\.ts \\(\\d+,\\d+\\): Type '{ color: string; widows: "bar"; }'` +
          ` is not assignable to type '[\\s\\S]+'.\\n\\s+` +
          `Types of property 'widows' are incompatible.\\n\\s+` +
          `Type '"bar"' is not assignable to type [\\s\\S]+`
      )
    )
  })

  test('accepts unknown CSS property without error', () => {
    expect(css({ '> form': { windows: 'baz' } })({})).toStrictEqual({
      '> form': { windows: 'baz' },
    })
  })

  test('infers Theme argument in computed style function', () => {
    expectSnippet(`
      import { get } from 'theme-ui'

      css({
        p: t => {
          const theme = t;
          return get(t, 'sizes.5')
        }
      })
    `).toInfer('theme', 'Theme')
  })

  test('accepts additional properties by declaration merging', () => {
    expectSnippet(`
      import { Theme } from 'theme-ui';

      interface MySyntaxHighlightingTheme {
        foreground: string
      }

      declare module 'theme-ui' {
        interface Theme {
          syntaxHighlighting: MySyntaxHighlightingTheme
        }
      }

      const theme: Theme = {
        syntaxHighlighting: {
          foreground: '#222',
        },
      }

      const syntaxHighlighting = theme.syntaxHighlighting
    `).toInfer('syntaxHighlighting', 'MySyntaxHighlightingTheme')
  })

  test('works as described in the docs', () => {
    const theme: Theme = {
      colors: { background: 'white', text: 'black', primary: '#07f' },
      space: [0, 8, 16, 32, 64, 128, 256],
      sizes: [0, 8, 16, 32, 64, 128, 256],
    }

    css({ size: (t) => get(t, 'space.3') + get(t, 'sizes.5') })

    const parse = (x: string | number | undefined | {}) => parseInt(String(x))
    css({
      size: (t) => parse(t.space?.[3]) + parse(t.sizes?.[5]),
    })

    // Current limitation. If you broke this one, that's actually pretty awesome,
    // but TypeScript chapter in the docs needs an update.
    expectSnippet(`
      css({ size: (t) => t.space?.['xs'] + t.sizes?.['lg'] })
    `).toFail(
      /Element implicitly has an 'any' type because index expression is not of type 'number'/
    )
  })
})
