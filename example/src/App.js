import React, { useRef, useMemo, useState, useEffect } from 'react'
import { isEmpty } from 'ramda'
import 'asteroid-editor/dist/index.css'
import { m2h, h2m } from 'asteroid-parser'
import { Nav } from 'asteroid-ui'
import { Flex, Box } from '@chakra-ui/react'
import Editor from 'asteroid-editor'

export default () => {
  const [nav, setNav] = useState({ modal: {} })
  const [mode, setMode] = useState(['markdown', null])
  const [html, setHTML] = useState('')
  const [md, setMD] = useState('')
  const tmenu = [
    {
      key: 'markdown',
      name: 'Markdown',
      onClick: () => {
        if (mode[0] === 'richtext' || mode[1] === 'richtext')
          setMD(h2m(html).replace(/\n$/, ''))
        setMode(['markdown', mode[0] === 'preview' ? mode[1] : mode[0]])
      }
    },
    {
      key: 'richtext',
      name: 'Rich Text',
      onClick: () => {
        if (mode[0] === 'markdown' || mode[1] === 'markdown') setHTML(m2h(md))
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
          mode
        }}
      />
    </Nav>
  )
}
