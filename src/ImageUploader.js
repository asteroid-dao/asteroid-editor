import { sha256 } from 'js-sha256'

import { forEach, range, o, indexBy, prop, isNil, values, map } from 'ramda'

const Hash = require('ipfs-only-hash')

export default Quill => {
  class ImageUploader {
    constructor(quill, options) {
      this.quill = quill
      this.options = options
      this.range = null
      var toolbar = this.quill.getModule('toolbar')
      toolbar.addHandler('image', this.selectLocalImage.bind(this))

      this.handleDrop = this.handleDrop.bind(this)
      this.handlePaste = this.handlePaste.bind(this)

      this.quill.root.addEventListener('drop', this.handleDrop, false)
      this.quill.root.addEventListener('paste', this.handlePaste, false)
    }

    selectLocalImage() {
      this.range = this.quill.getSelection()
      this.fileHolder = document.createElement('input')
      this.fileHolder.setAttribute('type', 'file')
      this.fileHolder.setAttribute('accept', 'image/*')
      this.fileHolder.setAttribute('style', 'visibility:hidden')

      this.fileHolder.onchange = this.fileChanged.bind(this)

      document.body.appendChild(this.fileHolder)

      this.fileHolder.click()

      window.requestAnimationFrame(() => {
        document.body.removeChild(this.fileHolder)
      })
    }

    handleDrop(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      if (
        evt.dataTransfer &&
        evt.dataTransfer.files &&
        evt.dataTransfer.files.length
      ) {
        if (document.caretRangeFromPoint) {
          const selection = document.getSelection()
          const range = document.caretRangeFromPoint(evt.clientX, evt.clientY)
          if (selection && range) {
            selection.setBaseAndExtent(
              range.startContainer,
              range.startOffset,
              range.startContainer,
              range.startOffset
            )
          }
        } else {
          const selection = document.getSelection()
          const range = document.caretPositionFromPoint(
            evt.clientX,
            evt.clientY
          )
          if (selection && range) {
            selection.setBaseAndExtent(
              range.offsetNode,
              range.offset,
              range.offsetNode,
              range.offset
            )
          }
        }

        this.range = this.quill.getSelection()
        let file = evt.dataTransfer.files[0]

        setTimeout(() => {
          this.range = this.quill.getSelection()
          this.readAndUploadFile(file)
        }, 0)
      }
    }

    handlePaste(evt) {
      let clipboard = evt.clipboardData || window.clipboardData

      // IE 11 is .files other browsers are .items
      if (clipboard && (clipboard.items || clipboard.files)) {
        let items = clipboard.items || clipboard.files
        const IMAGE_MIME_REGEX = /^image\/(jpe?g|gif|png|svg|webp)$/i

        for (let i = 0; i < items.length; i++) {
          if (IMAGE_MIME_REGEX.test(items[i].type)) {
            let file = items[i].getAsFile ? items[i].getAsFile() : items[i]

            if (file) {
              this.range = this.quill.getSelection()
              evt.preventDefault()
              setTimeout(() => {
                this.range = this.quill.getSelection()
                this.readAndUploadFile(file)
              }, 0)
            }
          }
        }
      }
    }

    convertDataURIToBinary(dataURI) {
      let BASE64_MARKER = ';base64,'
      let base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length
      let base64 = dataURI.substring(base64Index)
      let raw = window.atob(base64)
      let array = new Uint8Array(new ArrayBuffer(raw.length))
      forEach(i => (array[i] = raw.charCodeAt(i)))(range(0, raw.length))
      return array
    }
    readAndUploadFile(file) {
      const fileReader = new FileReader()
      fileReader.addEventListener(
        'load',
        async () => {
          const base64 = fileReader.result
          const hash = await Hash.of(this.convertDataURIToBinary(base64))
          if (!isNil(hash)) this.insertBase64Image(base64, hash, file)
        },
        false
      )
      if (file) fileReader.readAsDataURL(file)
    }

    fileChanged() {
      this.readAndUploadFile(this.fileHolder.files[0])
    }

    insertBase64Image(url, hash, file) {
      const range = this.range
      const image_map = window.image_map || {}
      let hash_map = o(indexBy(prop('hash')), values)(image_map)
      let _id = null
      let ext = null
      let plus = 0
      let original_index = range.index
      if (!isNil(hash_map[hash])) {
        _id = hash_map[hash].id
        ext = hash_map[hash].ext
      } else {
        _id = sha256(url)
        ext = url.split(';')[0].split('/')[1]
        const new_image = {
          id: _id,
          url: url,
          ext,
          size: url.length,
          hash
        }
        if (isNil(this.options.upload)) {
          this.insertToEditor(url, plus, url, original_index)
        } else {
          this.options
            .upload(new_image)
            .then(i => {
              if (isNil(i)) {
                this.removeBase64Image()
              } else {
                this.insertToEditor(i.url, plus, url, original_index)
              }
            })
            .catch(() => this.removeBase64Image())
        }
        image_map[_id] = new_image
        window.image_map = image_map
      }
      const prev = this.quill.getText(range.index - 1, 1)
      const next = this.quill.getText(range.index + 1, 1)
      if (!((prev === '' || prev === '\n') && (next === '' || next === '\n'))) {
        this.quill.insertText(range.index, '\n')
        range.index++
        plus++
      }
      this.quill.insertEmbed(
        range.index,
        'imageBlot',
        `data:image/${ext};local,${_id}`,
        'user'
      )
      range.index++
      plus++
      this.quill.setSelection(range, 'user')
    }

    insertToEditor(url, plus, original, original_index) {
      let index = null
      let max = null
      for (let v of this.quill.getLines()) {
        try {
          if (v.domNode.childNodes[0].currentSrc === original) {
            let ind = this.quill.getIndex(v)
            let abs = Math.abs(original_index - ind)
            if (isNil(max) || max >= abs) {
              index = ind
              max = abs
            }
          }
        } catch (e) {
          console.log(e)
        }
      }
      if (!isNil(index)) {
        this.quill.deleteText(index, 1, 'user')
        this.quill.insertEmbed(index, 'image', `${url}`, 'user')
        let range = this.quill.getSelection()
        this.quill.insertText(index + 1, '\n')
        range.index = index + 2
        this.quill.setSelection(range, 'user')
      }
    }
    removeBase64Image() {
      const range = this.range
      this.quill.deleteText(range.index, 3, 'user')
    }
  }
  const BlockEmbed = Quill.import('blots/block/embed')
  class LoadingImage extends BlockEmbed {
    static create(src) {
      const id = typeof src === 'string' ? src.split(',').pop() : null
      if (isNil(id)) return null
      const image_map = window.image_map || {}
      const node = super.create(image_map[id].url)
      if (src === true) return node
      const image = document.createElement('img')
      image.setAttribute('src', image_map[id].url)
      node.appendChild(image)
      return node
    }
    deleteAt(index, length) {
      super.deleteAt(index, length)
      this.cache = {}
    }
    static value(domNode) {
      const { src, custom } = domNode.dataset
      return { src, custom }
    }
  }
  LoadingImage.blotName = 'imageBlot'
  LoadingImage.className = 'image-uploading'
  LoadingImage.tagName = 'span'
  Quill.register({ 'formats/imageBlot': LoadingImage })
  Quill.register('modules/imageUploader', ImageUploader)
}
