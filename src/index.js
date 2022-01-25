import React, { Fragment, useRef, useState, useEffect } from 'react'
import { Flex, Box } from '@chakra-ui/react'
import GithubCSS from './GithubCSS'
import QuillBubbleCSS from './QuillBubbleCSS'
import Editor from '@monaco-editor/react'
import { isNil } from 'ramda'
let m2h = null
let ReactQuill = null
export default ({ height, setHTML, setMD, setMode, mode, md, html }) => {
  const options = {
    selectOnLineNumbers: true
  }
  const monacoRef = useRef(null)
  function handleEditorWillMount(monaco) {
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)
  }
  function handleEditorDidMount(editor, monaco) {
    monacoRef.current = editor
  }
  useEffect(() => {
    ReactQuill = require('react-quill')
    const parser = require('asteroid-parser')
    m2h = parser.m2h
  }, [])
  return isNil(m2h) ? null : (
    <>
      <GithubCSS />
      <Flex boxSize='100%' width='100%'>
        {mode[0] === 'preview' ? (
          <Flex justify='center' width='100%'>
            <Box
              maxW='750px'
              className='markdown-body'
              flex={1}
              p={3}
              height='100%'
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
              height='100%'
            >
              <Editor
                defaultLanguage='markdown'
                theme='vs-dark'
                value={md}
                options={options}
                onChange={setMD}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                height={height}
              />
            </Flex>
            <Box
              height='100%'
              className='markdown-body'
              flex={1}
              p={3}
              dangerouslySetInnerHTML={{
                __html: m2h(md)
              }}
            ></Box>
          </>
        ) : (
          <Flex justify='center' width='100%'>
            <QuillBubbleCSS />
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
              }
              .ql-container.ql-snow {
                border: 0px;
              }
              .ql-tooltip {
                margin-left: 120px;
              }
            `}</style>
            <ReactQuill
              maxWidth='750px'
              width='100%'
              theme='bubble'
              value={html}
              onChange={setHTML}
              placeholder='start typing here...'
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'blockquote', 'link'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean']
                ]
              }}
            />
          </Flex>
        )}
      </Flex>
    </>
  )
}
