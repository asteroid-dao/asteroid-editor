import React, { Fragment, useRef, useEffect } from 'react'
import { Flex, Box, ChakraProvider } from '@chakra-ui/react'
import GithubCSS from './GithubCSS'
import QuillBubbleCSS from './QuillBubbleCSS'
import QuillSnowCSS from './QuillSnowCSS'
import Editor from '@monaco-editor/react'
import { isNil } from 'ramda'
let m2h = null
let ReactQuill = null
let options = null
export default ({ height, setHTML, setMD, setMode, mode, md, html }) => {
  const monacoRef = useRef(null)
  let quillRef = React.createRef()
  useEffect(() => {
    ReactQuill = require('react-quill')
    let Parchment = ReactQuill.Quill.import('parchment')
    let Delta = ReactQuill.Quill.import('delta')
    let Break = ReactQuill.Quill.import('blots/break')
    let Embed = ReactQuill.Quill.import('blots/embed')
    let Block = ReactQuill.Quill.import('blots/block')
    class SmartBreak extends Break {
      length() {
        return 1
      }

      value() {
        return '\n'
      }

      insertInto(parent, ref) {
        Embed.prototype.insertInto.call(this, parent, ref)
      }
    }

    SmartBreak.blotName = 'break'
    SmartBreak.tagName = 'BR'

    function lineBreakMatcher() {
      let newDelta = new Delta()
      newDelta.insert({ break: '' })
      return newDelta
    }
    ReactQuill.Quill.register(SmartBreak)
    options = {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'blockquote', 'link'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ],
      clipboard: {
        matchers: [['BR', lineBreakMatcher]]
      },
      keyboard: {
        bindings: {
          handleDelete(range, context) {
            // Check for astral symbols
            const length = /^[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(
              context.suffix
            )
              ? 2
              : 1
            if (range.index >= this.quill.getLength() - length) return
            let formats = {}
            const [line] = this.quill.getLine(range.index)
            let delta = new Delta().retain(range.index).delete(length)
            if (context.offset >= line.length() - 1) {
              const [next] = this.quill.getLine(range.index + 1)
              if (next) {
                const curFormats = line.formats()
                const nextFormats = this.quill.getFormat(range.index, 1)
                formats = AttributeMap.diff(curFormats, nextFormats) || {}
                if (Object.keys(formats).length > 0) {
                  delta = delta.retain(next.length() - 1).retain(1, formats)
                }
              }
            }
            this.quill.updateContents(delta, ReactQuill.Quill.sources.USER)
            this.quill.focus()
          },
          handleEnter: {
            key: 13,
            handler: function (range, context) {
              if (range.length > 0) {
                this.quill.scroll.deleteAt(range.index, range.length)
              }
              let lineFormats = Object.keys(context.format).reduce(function (
                lineFormats,
                format
              ) {
                if (
                  Parchment.query(format, Parchment.Scope.BLOCK) &&
                  !Array.isArray(context.format[format])
                ) {
                  lineFormats[format] = context.format[format]
                }
                return lineFormats
              },
              {})
              var previousChar = this.quill.getText(range.index - 1, 1)
              this.quill.insertText(
                range.index,
                '\n',
                lineFormats,
                ReactQuill.Quill.sources.USER
              )
              if (previousChar == '' || previousChar == '\n') {
                this.quill.setSelection(
                  range.index + 2,
                  ReactQuill.Quill.sources.SILENT
                )
              } else {
                this.quill.setSelection(
                  range.index + 1,
                  ReactQuill.Quill.sources.SILENT
                )
              }
              try {
                this.quill.selection.scrollIntoView()
              } catch (e) {}
              Object.keys(context.format).forEach(name => {
                if (lineFormats[name] != null) return
                if (Array.isArray(context.format[name])) return
                if (name === 'link') return
                this.quill.format(
                  name,
                  context.format[name],
                  ReactQuill.Quill.sources.USER
                )
              })
            }
          },
          linebreak: {
            key: 13,
            shiftKey: true,
            handler: function (range, context) {
              var nextChar = this.quill.getText(range.index + 1, 1)
              var ee = this.quill.insertEmbed(
                range.index,
                'break',
                true,
                'user'
              )
              if (nextChar.length == 0) {
                var ee = this.quill.insertEmbed(
                  range.index,
                  'break',
                  true,
                  'user'
                )
              }
              this.quill.setSelection(
                range.index + 1,
                ReactQuill.Quill.sources.SILENT
              )
            }
          }
        }
      }
    }

    const parser = require('asteroid-parser')
    m2h = parser.m2h
  }, [])
  const QStyle = () => (
    <style global jsx>{`
      .quill {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        max-width: 750px;
      }
      .ql-container {
        overflow: visible;
        flex: 1;
        max-width: 750px;
        font-size: 17px;
      }
      .ql-editor {
        max-width: 750px;
        height: 100%;
      }
      .ql-container {
        border: 0px;
        flex: 1;
        overflow: auto;
        height: 100%;
      }
      .ql-tooltip {
        margin-left: 120px;
      }
      .ql-toolbar {
      }
    `}</style>
  )
  return isNil(m2h) ? null : (
    <ChakraProvider>
      <GithubCSS />
      <Flex boxSize='100%' w='100%'>
        {mode[0] === 'preview' ? (
          <Flex justify='center' w='100%'>
            <Box
              maxW='750px'
              className='markdown-body'
              flex={1}
              p={3}
              h='100%'
              dangerouslySetInnerHTML={{
                __html: mode[0] === 'markdown' ? m2h(md) : html
              }}
            />
          </Flex>
        ) : mode[0] === 'markdown' ? (
          <>
            <Flex
              flex={1}
              borderRight='3px solid #eee'
              overflow='hidden'
              h='100%'
            >
              <Editor
                defaultLanguage='markdown'
                theme='vs-dark'
                value={md}
                options={{
                  selectOnLineNumbers: true
                }}
                onChange={setMD}
                beforeMount={monaco => {
                  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(
                    true
                  )
                }}
                onMount={(editor, monaco) => {
                  monacoRef.current = editor
                }}
                h={height}
              />
            </Flex>
            <Box
              display={['none', null, null, 'block']}
              h='100%'
              className='markdown-body'
              flex={1}
              p={3}
              dangerouslySetInnerHTML={{
                __html: m2h(md)
              }}
            ></Box>
          </>
        ) : (
          <Flex justify='center' w='100%' h={[height, null, '100%']}>
            <Box
              w='100%'
              h='100%'
              maxW='750px'
              display={['none', null, 'block']}
            >
              <QuillBubbleCSS />
              <QStyle />
              <ReactQuill
                ref={el => {
                  if (!isNil(el)) quillRef = el.getEditor()
                }}
                onChange={(val, d, s, e) => {
                  const length = e.getLength()
                  const text = e.getText(length - 2, 2)
                  if (text === '\n\n') quillRef.deleteText(length - 1, 1)
                  setHTML(val)
                }}
                modules={options}
                maxW='750px'
                w='100%'
                theme='bubble'
                value={html}
                placeholder='start typing here...'
              />
            </Box>
            <Box
              w='100%'
              h='100%'
              maxW='750px'
              display={['block', null, 'none']}
            >
              <QuillSnowCSS />
              <QStyle />
              <ReactQuill
                ref={el => {
                  if (!isNil(el)) quillRef = el.getEditor()
                }}
                onChange={(val, d, s, e) => {
                  const length = e.getLength()
                  const text = e.getText(length - 2, 2)
                  if (text === '\n\n') quillRef.deleteText(length - 1, 1)
                  setHTML(val)
                }}
                modules={options}
                maxW='750px'
                w='100%'
                theme='snow'
                value={html}
                placeholder='start typing here...'
              />
            </Box>
          </Flex>
        )}
      </Flex>
    </ChakraProvider>
  )
}
