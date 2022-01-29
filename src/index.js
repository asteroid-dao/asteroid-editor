import React, { useState, Fragment, useRef, useEffect } from 'react'
import { useDebounce } from '@react-hook/debounce'
import { ChakraProvider, Flex, Box } from '@chakra-ui/react'
const entities = require('entities')
import GithubCSS from './GithubCSS'
import QuillBubbleCSS from './QuillBubbleCSS'
import QuillSnowCSS from './QuillSnowCSS'
import Editor from '@monaco-editor/react'
import ImageUploader from 'quill-image-uploader2'
import { o, isNil } from 'ramda'
import { sha256 } from 'js-sha256'
let options = null
let m2h = null
let ReactQuill = null

const App = ({
  height,
  setHTML,
  setMD,
  setMode,
  mode,
  md,
  html,
  saveImage
}) => {
  const monacoRef = useRef(null)
  let quillRef = React.createRef()
  const [preview, setPreview] = useDebounce('')
  const [initEditor, setInitEditor] = useState(false)
  useEffect(() => {
    if (initEditor) setPreview(m2h(md))
  }, [md, initEditor])
  useEffect(() => {
    ReactQuill = require('react-quill')
    ImageUploader(ReactQuill.Quill)
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
    SmartBreak.blotName = 'inline-break'
    SmartBreak.tagName = 'BR'
    function lineBreakMatcher() {
      let newDelta = new Delta()
      newDelta.insert({ ['inline-break']: '' })
      return newDelta
    }

    ReactQuill.Quill.register(SmartBreak)
    options = {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'blockquote', 'link', 'image'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ],
      imageUploader: { upload: saveImage },
      clipboard: {
        matchers: [['BR', lineBreakMatcher]]
      },
      keyboard: {
        bindings: {
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
              this.quill.setSelection(
                range.index + 1,
                ReactQuill.Quill.sources.SILENT
              )
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
                'inline-break',
                true,
                'user'
              )
              if (nextChar.length == 0) {
                var ee = this.quill.insertEmbed(
                  range.index,
                  'inline-break',
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
    parser.setImageHook({
      fromBase64: url => {
        console.log(url)
        if (/^data\:image\/.+/.test(url)) {
          const img = window.image_map[sha256(url)]
          if (!isNil(img)) return `data:image/${img.ext};local,${img.id}`
        }
        return url
      },
      toBase64: url => {
        if (/^data\:image\/.+;local,/.test(url)) {
          const img = window.image_map[url.split(',')[1]]
          if (!isNil(img)) return img.url
        }
        return url
      }
    })
    m2h = parser.m2h
    setInitEditor(true)
  }, [])
  const QStyle = () => (
    <style global jsx>{`
      .ql-editor p,
      .ql-editor h1,
      .ql-editor h2,
      .ql-editor h3 {
        margin-bottom: 15px;
      }
      .quill {
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }
      .ql-container {
        overflow: visible;
        flex: 1;
        max-width: 750px;
        font-size: 17px;
        width: 100%;
      }
      .ql-editor {
        border: 0px;
        max-width: 750px;
        height: 100%;
      }
      .ql-container.ql-snow {
        border: 0px;
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
      .ql-toolbar.ql-snow {
        border-top: 0;
        border-left: 0;
        border-right: 0;
        width: 100%;
        max-width: 750px;
      }
    `}</style>
  )

  return !initEditor ? null : (
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
                __html: mode[0] === 'markdown' ? preview : html
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
                __html: preview
              }}
            ></Box>
          </>
        ) : (
          <Flex justify='center' w='100%' h={height}>
            <Box w='100%' h='100%'>
              <QuillSnowCSS />
              <QStyle />
              <ReactQuill
                ref={el => {
                  if (!isNil(el)) quillRef = el.getEditor()
                }}
                onChange={(val, d, s, e) => setHTML(val)}
                modules={options}
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
export default App
