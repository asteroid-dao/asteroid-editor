import React, { useRef, useMemo, useState, useEffect } from 'react'
import { isEmpty } from 'ramda'
import { Nav } from 'asteroid-ui'
import { Flex, Box } from '@chakra-ui/react'
import Editor from 'asteroid-editor'
import lf from 'localforage'
let q2m = null
let m2q = null

export default () => {
  const [nav, setNav] = useState({ modal: {} })
  const [mode, setMode] = useState(['richtext', null])
  const [html, setHTML] = useState('')
  const [md, setMD] = useState('')
  useEffect(() => {
    const parser = require('asteroid-parser')
    q2m = parser.q2m
    m2q = parser.m2q
  }, [])
  const saveImage = ({ url, id, ext, size }) =>
    new Promise(async res => {
      await lf.setItem(`_local_image-${id}`, {
        url,
        id,
        ext,
        size
      })
      res({ url: url })
    })
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
          height: nav.height,
          html,
          md,
          setMD,
          setHTML,
          setMode,
          mode,
          saveImage
        }}
      />
    </Nav>
  )
}
