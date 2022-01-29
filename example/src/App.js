import React, { useRef, useMemo, useState, useEffect } from 'react'
import { isNil, isEmpty } from 'ramda'
import { Nav } from 'asteroid-ui'
import { Flex, Box } from '@chakra-ui/react'
import Editor from 'asteroid-editor'
import { sha256 } from 'js-sha256'
import { useDebounce } from '@react-hook/debounce'
let q2m = null
let m2q = null
let m2h = null
export default () => {
  const [nav, setNav] = useState({ modal: {} })
  const [mode, setMode] = useState(['richtext', null])
  const [html, setHTML] = useState('')
  const [md, setMD] = useState('')
  const [initEditor, setInitEditor] = useState(false)
  const [preview, setPreview] = useDebounce('')
  useEffect(() => {
    if (initEditor) setPreview(m2h(md))
  }, [md, initEditor])

  useEffect(() => {
    const parser = require('asteroid-parser')
    parser.setImageHook({
      fromBase64: url => {
        if (/^data\:image\/.+/.test(url)) {
          const img = (window.image_map || {})[sha256(url)]
          if (!isNil(img)) return `data:image/${img.ext};local,${img.id}`
        }
        return url
      },
      toBase64: url => {
        if (/^data\:image\/.+;local,/.test(url)) {
          const img = (window.image_map || {})[url.split(',')[1]]
          if (!isNil(img)) return img.url
        }
        return url
      }
    })
    q2m = parser.q2m
    m2q = parser.m2q
    m2h = parser.m2h
    setInitEditor(true)
  }, [])
  const tmenu = [
    {
      key: 'markdown',
      name: 'Markdown',
      onClick: () => {
        if (mode[0] === 'richtext' || mode[1] === 'richtext') setMD(q2m(html))
        setMode(['markdown', mode[0] === 'preview' ? mode[1] : mode[0]])
      }
    },
    {
      key: 'richtext',
      name: 'Rich Text',
      onClick: () => {
        if (mode[0] === 'markdown' || mode[1] === 'markdown') setHTML(m2q(md))
        setMode(['richtext', mode[0] === 'preview' ? mode[1] : mode[0]])
      }
    },
    {
      key: 'preview',
      name: 'Preview',
      onClick: () => setMode(['preview', mode[0]])
    }
  ]
  return (
    <Nav
      {...{
        tmenu_selected: mode[0],
        tmenu,
        logo: 'https://picsum.photos/100/100',
        appname: <Box fontSize='20px'>Asteroid Editor</Box>,
        setNav,
        style: {},
        modal: {}
      }}
    >
      <Editor
        {...{
          preview,
          height: nav.height,
          html,
          md,
          setMD,
          setHTML,
          setMode,
          mode
        }}
      />
    </Nav>
  )
}
