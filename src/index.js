import React, { Fragment, useRef, useState, useEffect } from 'react'
import { Flex, Box, ChakraProvider } from '@chakra-ui/react'
import GithubCSS from './GithubCSS'
import QuillBubbleCSS from './QuillBubbleCSS'
import QuillSnowCSS from './QuillSnowCSS'
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
                options={options}
                onChange={setMD}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
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
                maxW='750px'
                w='100%'
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
                maxW='750px'
                w='100%'
                theme='snow'
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
            </Box>
          </Flex>
        )}
      </Flex>
    </ChakraProvider>
  )
}
